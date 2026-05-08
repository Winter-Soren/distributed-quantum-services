"""Fetch a real multi-security price matrix and run the Track B benchmark honestly."""

from __future__ import annotations

import argparse
import asyncio
import copy
import csv
import io
import json
import logging
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock

from quantum_backend_v2.application.financial_comparison import build_financial_comparison_report
from quantum_backend_v2.application.financial_portfolio import (
    PortfolioOptimizationConfig,
    build_portfolio_optimization_artifacts,
)
from quantum_backend_v2.application.quantum_bridge import QuantumExecutionBridge
from quantum_backend_v2.discovery.registry import PeerRegistryEntry
from quantum_backend_v2.libp2p.fragment_worker import PeerFragmentWorker
from quantum_backend_v2.libp2p.protocol_ids import build_execution_protocol_ids
from quantum_backend_v2.quality.catalog import KNOWN_SERVICE_IDS

DEFAULT_TICKERS = ("AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "AVGO", "JPM", "LLY", "XOM")
YAHOO_CHART_ENDPOINT = "https://query1.finance.yahoo.com/v8/finance/chart/{ticker}"
USER_AGENT = "CodexTrackBBenchmark/1.0"


class _FakeDiscoveryService:
    def __init__(self, *, peers: list[PeerRegistryEntry], workers: dict[str, PeerFragmentWorker], namespace: str) -> None:
        self._peers = peers
        self._workers = workers
        self._protocol_ids = build_execution_protocol_ids(namespace)
        self.registry = SimpleNamespace(
            list_peers=lambda include_stale=False: list(peers),
            get_peer=lambda peer_id: next((peer for peer in peers if peer.peer_id == peer_id), None),
        )

    async def wait_for_service_peers(self, *, timeout_seconds: float = 10.0) -> list[PeerRegistryEntry]:
        return list(self._peers)

    async def request_peer_rpc(
        self,
        *,
        peer_id: str,
        protocol_id: str,
        payload: bytes,
        peer_addresses: tuple[str, ...] = (),
        timeout_seconds: float = 15.0,
    ) -> bytes:
        worker = self._workers[peer_id]
        if protocol_id == self._protocol_ids.reservation_prepare:
            return await worker.handle_prepare(payload)
        if protocol_id == self._protocol_ids.reservation_commit:
            return await worker.handle_commit(payload)
        if protocol_id == self._protocol_ids.reservation_cancel:
            return await worker.handle_cancel(payload)
        if protocol_id == self._protocol_ids.fragment_dispatch:
            return await worker.handle_dispatch(payload)
        raise RuntimeError(f"Unsupported protocol {protocol_id}")


def _project_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _default_output_csv() -> Path:
    return _project_root() / "benchmark-data" / "us_mega_cap_adjclose_2y.csv"


def _fetch_adjusted_close_series(ticker: str, *, range_name: str, interval: str) -> dict[str, float]:
    params = urllib.parse.urlencode(
        {
            "interval": interval,
            "range": range_name,
            "includeAdjustedClose": "true",
            "events": "div,splits",
        }
    )
    url = YAHOO_CHART_ENDPOINT.format(ticker=urllib.parse.quote(ticker)) + f"?{params}"
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=30) as response:
        payload = json.load(response)

    result = payload.get("chart", {}).get("result") or []
    if not result:
        raise RuntimeError(f"Yahoo chart API returned no result for {ticker}.")
    record = result[0]
    timestamps = record.get("timestamp") or []
    indicators = record.get("indicators", {})
    adjclose = (indicators.get("adjclose") or [{}])[0].get("adjclose")
    closes = (indicators.get("quote") or [{}])[0].get("close") or []
    values = adjclose or closes
    if not timestamps or not values:
        raise RuntimeError(f"Yahoo chart API returned no prices for {ticker}.")

    series: dict[str, float] = {}
    for timestamp, value in zip(timestamps, values, strict=False):
        if value is None:
            continue
        date_key = datetime.fromtimestamp(int(timestamp), tz=timezone.utc).date().isoformat()
        series[date_key] = float(value)
    if not series:
        raise RuntimeError(f"Yahoo chart API only returned null prices for {ticker}.")
    return series


def _build_price_matrix_rows(
    *,
    tickers: tuple[str, ...],
    range_name: str,
    interval: str,
    min_common_days: int,
) -> list[dict[str, str]]:
    series_by_ticker = {
        ticker: _fetch_adjusted_close_series(ticker, range_name=range_name, interval=interval)
        for ticker in tickers
    }
    common_dates = sorted(set.intersection(*(set(series) for series in series_by_ticker.values())))
    if len(common_dates) < min_common_days:
        raise RuntimeError(
            f"Only found {len(common_dates)} common trading days across {len(tickers)} tickers; "
            f"need at least {min_common_days}."
        )

    rows: list[dict[str, str]] = []
    for current_date in common_dates:
        row = {"date": current_date}
        for ticker in tickers:
            row[ticker] = str(series_by_ticker[ticker][current_date])
        rows.append(row)
    return rows


def _rows_to_csv_bytes(rows: list[dict[str, str]]) -> bytes:
    buffer = io.StringIO()
    fieldnames = list(rows[0].keys())
    writer = csv.DictWriter(buffer, fieldnames=fieldnames)
    writer.writeheader()
    for row in rows:
        writer.writerow(row)
    return buffer.getvalue().encode("utf-8")


def _write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(_rows_to_csv_bytes(rows))


def _build_bridge(peer_count: int, *, namespace: str) -> QuantumExecutionBridge:
    now = datetime.now(timezone.utc)
    peers: list[PeerRegistryEntry] = []
    workers: dict[str, PeerFragmentWorker] = {}
    service_ids = tuple(sorted(KNOWN_SERVICE_IDS))
    for index in range(peer_count):
        peer_id = f"12D3KooWBenchPeer{index + 1}"
        peers.append(
            PeerRegistryEntry(
                peer_id=peer_id,
                trust_tier="platform_managed",
                health_status="healthy",
                network_addresses=(f"/ip4/127.0.0.1/tcp/{4101 + index}",),
                supported_protocols=(),
                service_ids=service_ids,
                last_seen_at=now,
            )
        )
        workers[peer_id] = PeerFragmentWorker(peer_id=peer_id, max_concurrent_slots=4)

    runtime = SimpleNamespace(
        settings=SimpleNamespace(rendezvous_namespace=namespace, dev_service_peer_count=peer_count),
        host=MagicMock(),
    )
    runtime.host.get_id.return_value = "12D3KooWCoordinator"
    return QuantumExecutionBridge(
        discovery_service=_FakeDiscoveryService(peers=peers, workers=workers, namespace=namespace),
        libp2p_runtime=runtime,
    )


async def _run_distributed_benchmark(
    *,
    csv_bytes: bytes,
    filename: str,
    peer_count: int,
    max_assets_considered: int,
    parameter_search_steps: int,
    budget: int | None,
) -> dict[str, object]:
    job_id = f"market-benchmark-{int(time.time())}"
    artifacts = build_portfolio_optimization_artifacts(
        csv_bytes=csv_bytes,
        job_id=job_id,
        filename=filename,
        config=PortfolioOptimizationConfig(
            budget=budget,
            max_assets_considered=max_assets_considered,
            parameter_search_steps=parameter_search_steps,
        ),
    )
    bridge = _build_bridge(peer_count, namespace="track-b-market-bench")

    service_wait_started_at = time.perf_counter()
    await bridge.wait_for_service_peers()
    service_wait_duration_ms = int((time.perf_counter() - service_wait_started_at) * 1000)

    plan_compile_started_at = time.perf_counter()
    plan = bridge.compile_plan(artifacts.circuit_qasm)
    plan_compile_duration_ms = int((time.perf_counter() - plan_compile_started_at) * 1000)

    runtime_fragment_results = []
    serialized_fragment_results = []
    final_state = None
    distributed_execution_started_at = time.perf_counter()
    async for execution in bridge.iter_fragment_executions(
        workflow_run_id=job_id,
        plan=plan,
    ):
        runtime_fragment_results.append(execution.fragment_result)
        final_state = execution.state
        serialized_fragment_results.append(
            bridge.serialize_fragment_result(execution.fragment_result, execution=execution)
        )
    distributed_execution_duration_ms = int(
        (time.perf_counter() - distributed_execution_started_at) * 1000
    )
    quantum_result = bridge.build_quantum_result(
        plan=plan,
        fragment_results=tuple(runtime_fragment_results),
        final_state=final_state,
    )

    result_payload = copy.deepcopy(artifacts.payload)
    quantum_execution = result_payload.get("quantum_execution")
    if not isinstance(quantum_execution, dict):
        raise RuntimeError("Track B payload omitted the quantum_execution section.")
    quantum_execution.update(
        {
            "plan": bridge.serialize_plan(plan),
            "fragment_results": serialized_fragment_results,
            "quantum_result": quantum_result,
        }
    )

    timings = result_payload.get("benchmark", {}).get("timings")
    if not isinstance(timings, dict):
        raise RuntimeError("Track B payload omitted benchmark timings.")
    shared_preparation_duration_ms = int(timings.get("shared_preparation_duration_ms", 0))
    quantum_local_end_to_end_duration_ms = int(
        timings.get("quantum_local_end_to_end_duration_ms", 0)
    )
    timings.update(
        {
            "service_wait_duration_ms": service_wait_duration_ms,
            "plan_compile_duration_ms": plan_compile_duration_ms,
            "distributed_execution_duration_ms": distributed_execution_duration_ms,
            "quantum_end_to_end_duration_ms": (
                quantum_local_end_to_end_duration_ms
                + service_wait_duration_ms
                + plan_compile_duration_ms
                + distributed_execution_duration_ms
            ),
            "classical_end_to_end_duration_ms": (
                shared_preparation_duration_ms + int(timings.get("classical_solve_duration_ms", 0))
            ),
        }
    )
    result_payload["distributed_nodes_used"] = len({row["node_id"] for row in serialized_fragment_results})
    result_payload["fragments_executed"] = len(serialized_fragment_results)
    report = build_financial_comparison_report(result_payload)

    counts = quantum_result.get("counts") if isinstance(quantum_result, dict) else {}
    most_likely_bitstring = None
    if isinstance(counts, dict) and counts:
        most_likely_bitstring = max(
            counts.items(),
            key=lambda item: int(item[1]) if isinstance(item[1], int) else float(item[1]),
        )[0]

    return {
        "job_id": job_id,
        "selected_tickers": result_payload["dataset"]["selected_tickers"],
        "dataset": result_payload["dataset"],
        "timings": timings,
        "classical_bitstring": result_payload["benchmark"]["classical"]["bitstring"],
        "quantum_bitstring_local": result_payload["benchmark"]["quantum"]["bitstring"],
        "quantum_bitstring_distributed": most_likely_bitstring,
        "counts_match_classical": most_likely_bitstring
        == result_payload["benchmark"]["classical"]["bitstring"],
        "validation_statevector_fidelity": quantum_result.get("distributed_execution", {}).get(
            "validation_statevector_fidelity"
        )
        if isinstance(quantum_result, dict)
        else None,
        "fragments_executed": result_payload["fragments_executed"],
        "distributed_nodes_used": result_payload["distributed_nodes_used"],
        "plan": {
            "stages": len(plan.stages),
            "blocks": len(plan.blocks),
        },
        "comparison_report": {
            "fairness": report["fairness"],
            "dataset": report["dataset"],
            "scorecard": report["scorecard"],
            "verdict": report["verdict"],
        },
    }


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--tickers",
        default=",".join(DEFAULT_TICKERS),
        help="Comma-separated Yahoo Finance ticker symbols.",
    )
    parser.add_argument("--range", dest="range_name", default="2y", help="Yahoo Finance range parameter.")
    parser.add_argument("--interval", default="1d", help="Yahoo Finance interval parameter.")
    parser.add_argument("--min-common-days", type=int, default=252, help="Minimum aligned trading days.")
    parser.add_argument("--peer-count", type=int, default=5, help="Number of synthetic service peers.")
    parser.add_argument("--max-assets", dest="max_assets", type=int, default=6, help="Track B screened asset cap.")
    parser.add_argument(
        "--parameter-search-steps",
        type=int,
        default=9,
        help="QAOA parameter search grid size.",
    )
    parser.add_argument("--budget", type=int, default=None, help="Optional fixed portfolio budget.")
    parser.add_argument(
        "--output-csv",
        type=Path,
        default=_default_output_csv(),
        help="Where to write the fetched market price matrix.",
    )
    return parser.parse_args()


def main() -> None:
    args = _parse_args()
    logging.getLogger("qiskit").setLevel(logging.WARNING)

    tickers = tuple(
        ticker.strip().upper()
        for ticker in args.tickers.split(",")
        if ticker.strip()
    )
    if len(tickers) < 2:
        raise SystemExit("Need at least two ticker symbols for a portfolio benchmark.")

    price_rows = _build_price_matrix_rows(
        tickers=tickers,
        range_name=args.range_name,
        interval=args.interval,
        min_common_days=args.min_common_days,
    )
    _write_csv(args.output_csv, price_rows)

    benchmark = asyncio.run(
        _run_distributed_benchmark(
            csv_bytes=_rows_to_csv_bytes(price_rows),
            filename=args.output_csv.name,
            peer_count=args.peer_count,
            max_assets_considered=args.max_assets,
            parameter_search_steps=args.parameter_search_steps,
            budget=args.budget,
        )
    )
    summary = {
        "source": {
            "provider": "yahoo_finance_chart_api",
            "tickers": list(tickers),
            "range": args.range_name,
            "interval": args.interval,
            "output_csv": str(args.output_csv),
            "row_count": len(price_rows),
            "start_date": price_rows[0]["date"],
            "end_date": price_rows[-1]["date"],
        },
        "benchmark": benchmark,
    }
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
