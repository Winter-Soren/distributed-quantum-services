from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from time import monotonic, sleep

from fastapi.testclient import TestClient

from quantum_coordinator.api.app import create_app
from quantum_coordinator.config.models import AppConfig, DatabaseConfig, Libp2pConfig
from quantum_coordinator.domain.models import GateType
from quantum_coordinator.service_discovery.advertisement import ServiceAdvertisement

CSV_TEXT = """Date,Revenue,EBITDA,FreeCashFlow,SharesOutstanding,OperatingMargin
2024-01-31,100,18,10,50,0.18
2024-02-29,108,20,12,50,0.19
2024-03-31,116,23,14,50,0.20
2024-04-30,129,26,16,50,0.21
2024-05-31,141,29,17,50,0.205
2024-06-30,156,33,20,50,0.212
2024-07-31,170,36,22,50,0.218
"""


def _make_local_config(database_path: str) -> AppConfig:
    return AppConfig(
        database=DatabaseConfig(path=database_path),
        libp2p=Libp2pConfig(enabled=False),
        recover_jobs_on_startup=False,
    )


def _seed_local_services(app: object) -> None:
    now = datetime.now(timezone.utc)
    for gate_type in GateType:
        app.state.registry.upsert(
            ServiceAdvertisement(
                node_id=f"node-{gate_type.value}",
                listen_addrs=("/ip4/127.0.0.1/tcp/0",),
                service_type=gate_type,
                fidelity=0.99,
                qubit_min=1,
                qubit_max=16,
                availability=True,
                updated_at=now,
            )
        )


def _wait_for_financial_job_terminal(
    client: TestClient,
    job_id: str,
    timeout_seconds: float = 5.0,
) -> dict[str, object]:
    deadline = monotonic() + timeout_seconds
    while monotonic() < deadline:
        response = client.get(f"/api/v1/finance/{job_id}")
        assert response.status_code == 200
        payload = response.json()
        if payload["status"] in {"COMPLETED", "FAILED"}:
            return payload
        sleep(0.05)
    raise AssertionError(f"financial job {job_id} did not reach terminal state")


def test_financial_csv_executes_real_quantum_runtime_path(tmp_path: Path) -> None:
    app = create_app(_make_local_config(str(tmp_path / "finance.db")))
    _seed_local_services(app)

    with TestClient(app) as client:
        submit = client.post(
            "/api/v1/finance/submit",
            files={"file": ("financials.csv", CSV_TEXT, "text/csv")},
        )
        assert submit.status_code == 200
        submit_payload = submit.json()
        assert submit_payload["job_id"].startswith("fin-")

        terminal = _wait_for_financial_job_terminal(client, submit_payload["job_id"])
        assert terminal["status"] == "COMPLETED"

        result = terminal["result"]
        assert result is not None
        quantum_execution = result["quantum_execution"]
        assert quantum_execution is not None
        assert "OPENQASM 3;" in quantum_execution["circuit_text"]
        assert quantum_execution["plan"]["plan_id"].startswith("plan-")
        assert len(quantum_execution["fragment_results"]) > 0
        assert quantum_execution["quantum_result"] is not None
        assert quantum_execution["quantum_result"]["top_basis_states"] is not None
        assert quantum_execution["signal_summary"]["qubit_count"] >= 1

        assert result["distributed_nodes_used"] >= 1
        assert result["fragments_executed"] == len(result["node_execution"])
        assert result["fragments_executed"] == len(quantum_execution["fragment_results"])

        planned_fragment_ids = quantum_execution["plan"]["fragment_order"]
        executed_fragment_ids = [fragment["fragment_id"] for fragment in quantum_execution["fragment_results"]]
        assert executed_fragment_ids == planned_fragment_ids
