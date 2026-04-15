"""Distributed financial analysis engine backed by the quantum runtime.

The finance workflow now uses the same planner/runtime stack as circuit jobs:
CSV features are encoded into an OpenQASM program, compiled into fragments,
routed across the distributed service registry, executed through the runtime,
and then merged back into the financial analytics payload.
"""

from __future__ import annotations

import csv
import dataclasses
import io
import math
import statistics
import time
from collections import Counter
from typing import Any

from quantum_coordinator.domain.models import GateType
from quantum_coordinator.financial.models import (
    AnomalyPoint,
    ColumnProfile,
    CorrelationPair,
    DCFOutput,
    FinancialAnalysisResult,
    FinancialQuantumExecution,
    NodeExecutionSegment,
    QuantumFeatureMapping,
    QuantumSignalSummary,
    ScenarioOutput,
    TimeSeriesInsight,
)
from quantum_coordinator.infra.persistence.runtime_store import RuntimeEventStore
from quantum_coordinator.planning import CircuitPlanner
from quantum_coordinator.reservation.protocol import ReservationProtocol
from quantum_coordinator.runtime import (
    GateExecutionAdapter,
    RuntimeExecutionResult,
    RuntimeExecutor,
    RuntimePolicy,
)
from quantum_coordinator.service_discovery.registry import ServiceRegistry

_MAX_QUBITS = 8
_MAX_CORRELATION_ENCODINGS = 8


def _is_numeric(value: str) -> bool:
    try:
        float(value.replace(",", "").replace("$", "").replace("%", "").strip())
        return True
    except (ValueError, AttributeError):
        return False


def _is_date_like(value: str) -> bool:
    patterns = ["-", "/"]
    return any(p in value for p in patterns) and any(c.isdigit() for c in value)


def _coerce_numeric(value: str) -> float | None:
    try:
        return float(value.replace(",", "").replace("$", "").replace("%", "").strip())
    except (ValueError, AttributeError):
        return None


def _safe_correlation(xs: list[float], ys: list[float]) -> float | None:
    if len(xs) < 3 or len(ys) < 3:
        return None
    n = len(xs)
    mean_x = sum(xs) / n
    mean_y = sum(ys) / n
    num = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, ys, strict=False))
    den_x = math.sqrt(sum((x - mean_x) ** 2 for x in xs))
    den_y = math.sqrt(sum((y - mean_y) ** 2 for y in ys))
    if den_x == 0 or den_y == 0:
        return None
    return num / (den_x * den_y)


def _correlation_strength(r: float) -> tuple[str, str]:
    abs_r = abs(r)
    direction = "positive" if r >= 0 else "negative"
    if abs_r >= 0.7:
        return "strong", direction
    if abs_r >= 0.4:
        return "moderate", direction
    return "weak", direction


def _linear_regression_slope(ys: list[float]) -> float:
    n = len(ys)
    if n < 2:
        return 0.0
    xs = list(range(n))
    mean_x = sum(xs) / n
    mean_y = sum(ys) / n
    num = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, ys, strict=False))
    den = sum((x - mean_x) ** 2 for x in xs)
    return num / den if den != 0 else 0.0


def _trend_label(slope: float, volatility: float, values: list[float]) -> str:
    if volatility > 0.5 * (max(values) - min(values)) / (abs(statistics.mean(values)) or 1):
        return "volatile"
    if abs(slope) < 0.001:
        return "flat"
    return "upward" if slope > 0 else "downward"


def _cagr(start: float, end: float, years: float) -> float | None:
    if start <= 0 or end <= 0 or years <= 0:
        return None
    return (end / start) ** (1 / years) - 1


def _dcf(
    cashflows: list[float],
    wacc: float,
    terminal_growth: float,
    shares: float | None,
    growth_multiplier: float,
    margin_multiplier: float,
) -> ScenarioOutput:
    adjusted = [cf * growth_multiplier for cf in cashflows]
    last_cf = adjusted[-1] if adjusted else 0.0
    terminal = last_cf * (1 + terminal_growth) / max(wacc - terminal_growth, 0.001)
    discount_factors = [1 / (1 + wacc) ** (i + 1) for i in range(len(adjusted))]
    pv_cashflows = sum(cf * df for cf, df in zip(adjusted, discount_factors, strict=False))
    pv_terminal = terminal / (1 + wacc) ** len(adjusted)
    enterprise = pv_cashflows + pv_terminal
    equity = enterprise  # simplified: no net debt adjustment yet
    avg_margin = (
        sum(adjusted) / len(adjusted) / (sum(cashflows) / len(cashflows))
        if cashflows else 1.0
    )
    label_map = {1.15: "Bull", 1.0: "Base", 0.85: "Bear"}
    label = label_map.get(growth_multiplier, "Scenario")
    return ScenarioOutput(
        label=label,
        revenue_projection=sum(adjusted),
        margin_projection=avg_margin * margin_multiplier,
        valuation_estimate=equity,
        growth_rate=growth_multiplier - 1,
        discount_rate=wacc,
        terminal_value=terminal,
    )


def _clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def _magnitude_mean(values: list[float]) -> float:
    if not values:
        return 0.0
    return sum(abs(v) for v in values) / len(values)


class FinancialAnalysisEngine:
    """Runs CSV analytics and executes a finance-derived quantum circuit."""

    def __init__(
        self,
        registry: ServiceRegistry,
        planner: CircuitPlanner,
        reservation_protocol: ReservationProtocol,
        runtime_policy: RuntimePolicy,
        runtime_store: RuntimeEventStore,
        gate_adapter: GateExecutionAdapter,
    ) -> None:
        self._registry = registry
        self._planner = planner
        self._reservation_protocol = reservation_protocol
        self._runtime_policy = runtime_policy
        self._runtime_store = runtime_store
        self._gate_adapter = gate_adapter

    async def analyse(self, csv_bytes: bytes, filename: str, job_id: str) -> FinancialAnalysisResult:
        t_start = time.perf_counter()

        rows, headers = self._ingest(csv_bytes)
        row_count = len(rows)
        col_count = len(headers)
        col_types = self._detect_types(headers, rows)
        numeric_cols = [h for h in headers if col_types[h] == "numeric"]
        cat_cols = [h for h in headers if col_types[h] == "categorical"]
        dt_cols = [h for h in headers if col_types[h] == "datetime"]

        numeric_series = self._build_numeric_series(rows, numeric_cols)
        numeric_data = {
            col: [value for _, value in series]
            for col, series in numeric_series.items()
        }

        profiles = self._profile_columns(headers, rows, numeric_data, col_types)
        correlations = self._compute_correlations(numeric_series)
        ts_insights = self._time_series_analysis(numeric_cols, numeric_data)
        dcf_result = self._dcf_valuation(numeric_data)
        anomalies = self._detect_anomalies(numeric_series)

        top_corrs = sorted(correlations, key=lambda c: abs(c.pearson), reverse=True)[:10]

        quantum_execution = await self._execute_financial_quantum_model(
            job_id=job_id,
            profiles=profiles,
            correlations=correlations,
            time_series_insights=ts_insights,
            anomalies=anomalies,
        )

        node_segments = self._node_segments_from_runtime(
            plan=quantum_execution.plan,
            fragment_results=quantum_execution.fragment_results,
            row_count=row_count,
        )

        signal_summary = dataclasses.asdict(quantum_execution.signal_summary)
        summary = self._build_summary(
            row_count=row_count,
            col_count=col_count,
            numeric_cols=numeric_cols,
            cat_cols=cat_cols,
            numeric_data=numeric_data,
            correlations=correlations,
            quantum_signal_summary=signal_summary,
        )

        duration_ms = (time.perf_counter() - t_start) * 1000
        used_nodes = len({segment.node_id for segment in node_segments}) or 1

        return FinancialAnalysisResult(
            job_id=job_id,
            filename=filename,
            row_count=row_count,
            col_count=col_count,
            numeric_columns=numeric_cols,
            categorical_columns=cat_cols,
            datetime_columns=dt_cols,
            column_profiles=profiles,
            correlations=correlations,
            top_correlations=top_corrs,
            time_series_insights=ts_insights,
            dcf=dcf_result,
            anomalies=anomalies,
            summary_stats=summary,
            node_execution=node_segments,
            quantum_execution=quantum_execution,
            analysis_duration_ms=round(duration_ms, 2),
            distributed_nodes_used=used_nodes,
            fragments_executed=len(node_segments),
        )

    def _ingest(self, csv_bytes: bytes) -> tuple[list[dict[str, str]], list[str]]:
        text = csv_bytes.decode("utf-8-sig", errors="replace")
        reader = csv.DictReader(io.StringIO(text))
        headers = reader.fieldnames or []
        rows = [dict(r) for r in reader]
        return rows, list(headers)

    def _detect_types(self, headers: list[str], rows: list[dict[str, str]]) -> dict[str, str]:
        types: dict[str, str] = {}
        sample = rows[:50]
        for col in headers:
            vals = [str(r.get(col, "")).strip() for r in sample if r.get(col, "").strip()]
            if not vals:
                types[col] = "categorical"
                continue
            numeric_hits = sum(1 for v in vals if _is_numeric(v))
            date_hits = sum(1 for v in vals if _is_date_like(v) and not _is_numeric(v))
            if numeric_hits / len(vals) >= 0.75:
                types[col] = "numeric"
            elif date_hits / len(vals) >= 0.5:
                types[col] = "datetime"
            else:
                types[col] = "categorical"
        return types

    def _build_numeric_series(
        self,
        rows: list[dict[str, str]],
        numeric_cols: list[str],
    ) -> dict[str, list[tuple[int, float]]]:
        numeric_series: dict[str, list[tuple[int, float]]] = {}
        for col in numeric_cols:
            series: list[tuple[int, float]] = []
            for row_index, row in enumerate(rows):
                value = _coerce_numeric(str(row.get(col, "")))
                if value is not None:
                    series.append((row_index, value))
            numeric_series[col] = series
        return numeric_series

    def _profile_columns(
        self,
        headers: list[str],
        rows: list[dict[str, str]],
        numeric_data: dict[str, list[float]],
        col_types: dict[str, str],
    ) -> list[ColumnProfile]:
        profiles: list[ColumnProfile] = []
        for col in headers:
            raw = [str(r.get(col, "")) for r in rows]
            non_null = [v for v in raw if v.strip()]
            null_count = len(raw) - len(non_null)
            unique_vals = list(set(non_null))
            sample = unique_vals[:8]
            dtype = col_types.get(col, "categorical")

            if dtype == "numeric" and col in numeric_data:
                nums = numeric_data[col]
                if nums:
                    mean = statistics.mean(nums)
                    median = statistics.median(nums)
                    std = statistics.stdev(nums) if len(nums) > 1 else 0.0
                    mn, mx = min(nums), max(nums)
                    q1 = _percentile(nums, 25)
                    q3 = _percentile(nums, 75)
                    iqr = q3 - q1
                    skewness = _skew(nums)
                    kurt = _kurt(nums)
                    cv = std / abs(mean) if mean != 0 else None
                    lo, hi = q1 - 1.5 * iqr, q3 + 1.5 * iqr
                    outliers = [v for v in nums if v < lo or v > hi]
                    profiles.append(ColumnProfile(
                        name=col,
                        dtype=dtype,
                        non_null_count=len(non_null),
                        null_count=null_count,
                        null_pct=round(null_count / max(len(raw), 1) * 100, 2),
                        unique_count=len(unique_vals),
                        sample_values=sample,
                        mean=round(mean, 4),
                        median=round(median, 4),
                        std=round(std, 4),
                        min=round(mn, 4),
                        max=round(mx, 4),
                        q1=round(q1, 4),
                        q3=round(q3, 4),
                        iqr=round(iqr, 4),
                        skewness=round(skewness, 4),
                        kurtosis=round(kurt, 4),
                        cv=round(cv, 4) if cv is not None else None,
                        outlier_count=len(outliers),
                        outlier_pct=round(len(outliers) / max(len(nums), 1) * 100, 2),
                    ))
                    continue

            profiles.append(ColumnProfile(
                name=col,
                dtype=dtype,
                non_null_count=len(non_null),
                null_count=null_count,
                null_pct=round(null_count / max(len(raw), 1) * 100, 2),
                unique_count=len(unique_vals),
                sample_values=sample,
            ))
        return profiles

    def _compute_correlations(
        self,
        numeric_series: dict[str, list[tuple[int, float]]],
    ) -> list[CorrelationPair]:
        pairs: list[CorrelationPair] = []
        cols = list(numeric_series.keys())[:20]
        for i, a in enumerate(cols):
            index_a = dict(numeric_series.get(a, ()))
            if len(index_a) < 3:
                continue
            for b in cols[i + 1:]:
                index_b = dict(numeric_series.get(b, ()))
                shared_rows = sorted(set(index_a) & set(index_b))
                if len(shared_rows) < 3:
                    continue
                xs = [index_a[row] for row in shared_rows]
                ys = [index_b[row] for row in shared_rows]
                r = _safe_correlation(xs, ys)
                if r is None:
                    continue
                strength, direction = _correlation_strength(r)
                pairs.append(CorrelationPair(
                    col_a=a,
                    col_b=b,
                    pearson=round(r, 4),
                    strength=strength,
                    direction=direction,
                ))
        return pairs

    def _time_series_analysis(
        self,
        numeric_cols: list[str],
        numeric_data: dict[str, list[float]],
    ) -> list[TimeSeriesInsight]:
        insights: list[TimeSeriesInsight] = []
        for col in numeric_cols[:12]:
            vals = numeric_data.get(col, [])
            if len(vals) < 4:
                continue
            slope = _linear_regression_slope(vals)
            vol = statistics.stdev(vals) if len(vals) > 1 else 0.0
            avg = statistics.mean(vals)
            hi, lo = max(vals), min(vals)
            momentum = ((vals[-1] - vals[0]) / abs(vals[0]) * 100) if vals[0] != 0 else 0.0
            trend = _trend_label(slope, vol, vals)
            cagr_val = _cagr(vals[0], vals[-1], len(vals) / 12) if len(vals) >= 12 else None
            insights.append(TimeSeriesInsight(
                column=col,
                trend=trend,
                trend_slope=round(slope, 6),
                volatility=round(vol, 4),
                period_avg=round(avg, 4),
                period_high=round(hi, 4),
                period_low=round(lo, 4),
                momentum=round(momentum, 2),
                cagr=round(cagr_val, 4) if cagr_val is not None else None,
            ))
        return insights

    def _dcf_valuation(self, numeric_data: dict[str, list[float]]) -> DCFOutput | None:
        candidates = [
            col for col in numeric_data
            if any(kw in col.lower() for kw in ["revenue", "sales", "income", "cash", "profit", "ebitda", "earn"])
        ]
        if not candidates:
            if not numeric_data:
                return None
            candidates = sorted(
                numeric_data.keys(),
                key=lambda c: _magnitude_mean(numeric_data[c]),
                reverse=True,
            )[:1]

        col = candidates[0]
        raw_vals = numeric_data[col]
        if not raw_vals:
            return None

        base_cfs = raw_vals[-5:] if len(raw_vals) >= 5 else raw_vals
        wacc = 0.10
        terminal_growth = 0.025
        shares_col = next(
            (c for c in numeric_data if "share" in c.lower() or "count" in c.lower()),
            None,
        )
        shares = statistics.mean(numeric_data[shares_col]) if shares_col else None

        bull = _dcf(base_cfs, wacc - 0.01, terminal_growth + 0.005, shares, 1.15, 1.05)
        base = _dcf(base_cfs, wacc, terminal_growth, shares, 1.0, 1.0)
        bear = _dcf(base_cfs, wacc + 0.02, terminal_growth - 0.01, shares, 0.85, 0.95)

        yearly = list(base_cfs)
        last_cf = yearly[-1] if yearly else 0.0
        terminal = last_cf * (1 + terminal_growth) / max(wacc - terminal_growth, 0.001)
        enterprise = sum(
            cf / (1 + wacc) ** (i + 1)
            for i, cf in enumerate(yearly)
        ) + terminal / (1 + wacc) ** len(yearly)

        return DCFOutput(
            wacc=wacc,
            terminal_growth=terminal_growth,
            projection_years=len(yearly),
            yearly_cashflows=[round(v, 2) for v in yearly],
            terminal_value=round(terminal, 2),
            enterprise_value=round(enterprise, 2),
            equity_value=round(enterprise, 2),
            per_share_value=round(enterprise / shares, 4) if shares else None,
            bull=bull,
            base=base,
            bear=bear,
        )

    def _detect_anomalies(
        self,
        numeric_series: dict[str, list[tuple[int, float]]],
    ) -> list[AnomalyPoint]:
        anomalies: list[AnomalyPoint] = []
        for col, series in list(numeric_series.items())[:10]:
            vals = [value for _, value in series]
            if len(vals) < 5:
                continue
            mean = statistics.mean(vals)
            std = statistics.stdev(vals) if len(vals) > 1 else 0.0
            if std == 0:
                continue
            for row_index, value in series:
                z = (value - mean) / std
                if abs(z) > 2.5:
                    anomalies.append(AnomalyPoint(
                        row_index=row_index,
                        column=col,
                        value=round(value, 4),
                        z_score=round(z, 3),
                        label="extreme_high" if z > 0 else "extreme_low",
                    ))
        return sorted(anomalies, key=lambda a: abs(a.z_score), reverse=True)[:50]

    async def _execute_financial_quantum_model(
        self,
        *,
        job_id: str,
        profiles: list[ColumnProfile],
        correlations: list[CorrelationPair],
        time_series_insights: list[TimeSeriesInsight],
        anomalies: list[AnomalyPoint],
    ) -> FinancialQuantumExecution:
        available_ads = self._registry.query(available_only=True)
        if not available_ads:
            raise ValueError("No available quantum services to execute the finance-derived circuit.")

        available_types = {advertisement.service_type for advertisement in available_ads}
        encoded_profiles = self._select_quantum_profiles(
            profiles=profiles,
            correlations=correlations,
            time_series_insights=time_series_insights,
        )
        if not encoded_profiles:
            raise ValueError("No columns were suitable for finance-to-quantum encoding.")

        feature_mapping = self._build_feature_mapping(
            profiles=encoded_profiles,
            correlations=correlations,
            time_series_insights=time_series_insights,
            anomalies=anomalies,
        )
        circuit_text = self._build_financial_circuit(
            feature_mapping=feature_mapping,
            correlations=correlations,
            available_types=available_types,
        )

        plan = self._planner.compile(circuit_text)
        runtime = RuntimeExecutor(
            reservation_protocol=self._reservation_protocol,
            gate_adapter=self._gate_adapter,
            policy=self._runtime_policy,
            store=self._runtime_store,
        )
        runtime_result = await runtime.execute(job_id=job_id, plan=plan)

        plan_payload = dataclasses.asdict(plan)
        fragment_payloads = self._fragment_results_payload(runtime_result)
        quantum_payload = self._json_ready(runtime_result.quantum_result)
        signal_summary = self._build_quantum_signal_summary(
            feature_mapping=feature_mapping,
            quantum_result=quantum_payload,
        )

        return FinancialQuantumExecution(
            circuit_text=circuit_text,
            encoded_columns=[mapping.column for mapping in feature_mapping],
            feature_mapping=feature_mapping,
            plan=plan_payload,
            fragment_results=fragment_payloads,
            quantum_result=quantum_payload,
            signal_summary=signal_summary,
        )

    def _select_quantum_profiles(
        self,
        *,
        profiles: list[ColumnProfile],
        correlations: list[CorrelationPair],
        time_series_insights: list[TimeSeriesInsight],
    ) -> list[ColumnProfile]:
        ts_by_col = {insight.column: insight for insight in time_series_insights}
        corr_degree: Counter[str] = Counter()
        for pair in correlations:
            corr_degree[pair.col_a] += 1
            corr_degree[pair.col_b] += 1

        def score(profile: ColumnProfile) -> float:
            numeric_bias = 2.0 if profile.dtype == "numeric" else 0.2
            spread = abs(profile.std or 0.0)
            scale = abs(profile.mean or 0.0)
            variability = abs(profile.cv or 0.0)
            outlier_ratio = (profile.outlier_pct or 0.0) / 100.0
            momentum = abs(ts_by_col.get(profile.name).momentum) / 100.0 if profile.name in ts_by_col else 0.0
            return (
                numeric_bias
                + math.log1p(spread + scale + variability + profile.unique_count)
                + outlier_ratio
                + momentum
                + 0.2 * corr_degree[profile.name]
            )

        prioritized = sorted(profiles, key=score, reverse=True)
        return prioritized[:_MAX_QUBITS]

    def _build_feature_mapping(
        self,
        *,
        profiles: list[ColumnProfile],
        correlations: list[CorrelationPair],
        time_series_insights: list[TimeSeriesInsight],
        anomalies: list[AnomalyPoint],
    ) -> list[QuantumFeatureMapping]:
        corr_degree: Counter[str] = Counter()
        for pair in correlations:
            corr_degree[pair.col_a] += 1
            corr_degree[pair.col_b] += 1

        anomaly_counts: Counter[str] = Counter(anomaly.column for anomaly in anomalies)
        ts_by_col = {insight.column: insight for insight in time_series_insights}

        mapping: list[QuantumFeatureMapping] = []
        for qubit, profile in enumerate(profiles):
            if profile.dtype == "numeric":
                max_abs = max(abs(profile.max or 0.0), abs(profile.min or 0.0), 1.0)
                mean_ratio = (profile.mean or 0.0) / max_abs
                spread_ratio = abs(profile.cv or 0.0)
            else:
                mean_ratio = profile.unique_count / max(profile.non_null_count, 1)
                spread_ratio = profile.null_pct / 100.0

            insight = ts_by_col.get(profile.name)
            momentum_ratio = 0.0 if insight is None else _clamp(insight.momentum / 100.0, -1.0, 1.0)
            anomaly_pressure = anomaly_counts[profile.name] / max(profile.non_null_count, 1)

            mapping.append(QuantumFeatureMapping(
                column=profile.name,
                qubit=qubit,
                mean_rotation=round(_clamp(mean_ratio, -1.0, 1.0) * (math.pi / 2), 6),
                volatility_rotation=round(_clamp(spread_ratio, 0.0, 1.0) * math.pi, 6),
                momentum_rotation=round(momentum_ratio * (math.pi / 2), 6),
                anomaly_pressure=round(_clamp(anomaly_pressure, 0.0, 1.0), 4),
                correlation_degree=corr_degree[profile.name],
            ))
        return mapping

    def _build_financial_circuit(
        self,
        *,
        feature_mapping: list[QuantumFeatureMapping],
        correlations: list[CorrelationPair],
        available_types: set[GateType],
    ) -> str:
        qubit_count = len(feature_mapping)
        if qubit_count < 1:
            raise ValueError("Finance quantum circuit requires at least one encoded qubit.")

        declarations = [
            "OPENQASM 3;",
            f"qubit[{qubit_count}] q;",
        ]
        if GateType.MEASUREMENT_FEEDFORWARD in available_types:
            declarations.append(f"bit[{qubit_count}] c;")

        lines: list[str] = []

        if GateType.HADAMARD in available_types:
            for mapping in feature_mapping:
                lines.append(f"h q[{mapping.qubit}];")

        if GateType.PROGRAMMABLE_GATE in available_types:
            for mapping in feature_mapping:
                lines.append(f"ry({mapping.mean_rotation}) q[{mapping.qubit}];")
                lines.append(f"rz({mapping.volatility_rotation}) q[{mapping.qubit}];")
                if abs(mapping.momentum_rotation) > 0.000001:
                    lines.append(f"rx({mapping.momentum_rotation}) q[{mapping.qubit}];")
                if mapping.anomaly_pressure >= 0.05:
                    lines.append(f"sx q[{mapping.qubit}];")

        qubit_by_column = {mapping.column: mapping.qubit for mapping in feature_mapping}
        usable_pairs = [
            pair for pair in correlations
            if pair.col_a in qubit_by_column and pair.col_b in qubit_by_column
        ][: _MAX_CORRELATION_ENCODINGS]

        for index, pair in enumerate(usable_pairs):
            left = qubit_by_column[pair.col_a]
            right = qubit_by_column[pair.col_b]
            if left == right:
                continue

            if (
                index == 0
                and abs(pair.pearson) >= 0.7
                and GateType.BELL_PAIR in available_types
            ):
                lines.append(f"bell_pair q[{left}], q[{right}];")

            if GateType.CONTROLLED_UNITARY in available_types:
                angle = round(max(0.1, abs(pair.pearson)) * (math.pi / 2), 6)
                lines.append(f"controlled U({angle}) q[{left}], q[{right}];")

            if GateType.CZ in available_types:
                lines.append(f"cz q[{left}], q[{right}];")
            elif GateType.CNOT in available_types:
                lines.append(f"cnot q[{left}], q[{right}];")

            if GateType.PROGRAMMABLE_GATE in available_types:
                phase = round(pair.pearson * (math.pi / 2), 6)
                lines.append(f"controlled rz({phase}) q[{left}], q[{right}];")

        if qubit_count > 1 and GateType.QFT in available_types:
            lines.append(f"qft q[0:{qubit_count - 1}];")

        hottest = max(feature_mapping, key=lambda item: (item.anomaly_pressure, item.correlation_degree))
        if GateType.SYNDROME_EXTRACTION in available_types:
            lines.append(f"syndrome_extraction q[{hottest.qubit}];")
        if GateType.DISTILLATION in available_types:
            lines.append(f"distillation q[{feature_mapping[-1].qubit}];")
        if qubit_count > 1 and GateType.TELEPORTATION in available_types:
            lines.append(f"teleport q[{feature_mapping[0].qubit}], q[{feature_mapping[-1].qubit}];")

        if GateType.MEASUREMENT_FEEDFORWARD in available_types:
            for qubit in range(qubit_count):
                lines.append(f"measure q[{qubit}] -> c[{qubit}];")

        if not lines:
            raise ValueError("No compatible quantum services were available for the finance-derived circuit.")

        return "\n".join(declarations + [""] + lines)

    def _fragment_results_payload(
        self,
        runtime_result: RuntimeExecutionResult,
    ) -> list[dict[str, Any]]:
        return [
            {
                "fragment_id": fragment.fragment_id,
                "node_id": fragment.node_id,
                "status": fragment.status.value,
                "attempts": fragment.attempts,
                "started_at": fragment.started_at.isoformat(),
                "finished_at": fragment.finished_at.isoformat(),
                "observed_fidelity": fragment.observed_fidelity,
                "error": fragment.error,
            }
            for fragment in runtime_result.fragment_results
        ]

    def _node_segments_from_runtime(
        self,
        *,
        plan: dict[str, Any],
        fragment_results: list[dict[str, Any]],
        row_count: int,
    ) -> list[NodeExecutionSegment]:
        fragments = plan.get("fragments", {})
        by_id = {result["fragment_id"]: result for result in fragment_results}
        ordered_ids = plan.get("fragment_order", [])

        segments: list[NodeExecutionSegment] = []
        for fragment_id in ordered_ids:
            fragment = fragments.get(fragment_id, {})
            result = by_id.get(fragment_id)
            if result is None:
                continue

            started_at = result.get("started_at")
            finished_at = result.get("finished_at")
            duration_ms = 0.0
            if isinstance(started_at, str) and isinstance(finished_at, str):
                try:
                    start_dt = time.strptime(started_at[:19], "%Y-%m-%dT%H:%M:%S")
                    end_dt = time.strptime(finished_at[:19], "%Y-%m-%dT%H:%M:%S")
                    duration_ms = max(0.0, (time.mktime(end_dt) - time.mktime(start_dt)) * 1000)
                except ValueError:
                    duration_ms = 0.0

            service_type = str(fragment.get("service_type", "quantum_fragment"))
            qubits = fragment.get("qubits", [])
            rows_processed = row_count if service_type in {
                GateType.PROGRAMMABLE_GATE.value,
                GateType.QFT.value,
                GateType.MEASUREMENT_FEEDFORWARD.value,
            } else max(len(qubits), 1)
            raw_task = str(fragment.get("raw_text", "") or service_type)
            task = raw_task.removesuffix(";")

            segments.append(NodeExecutionSegment(
                node_id=str(result.get("node_id", "unknown-node")),
                task=task,
                rows_processed=rows_processed,
                duration_ms=round(duration_ms, 2),
                fidelity_score=round(float(result.get("observed_fidelity") or 0.0), 4),
            ))
        return segments

    def _build_quantum_signal_summary(
        self,
        *,
        feature_mapping: list[QuantumFeatureMapping],
        quantum_result: dict[str, Any] | None,
    ) -> QuantumSignalSummary:
        encoded_columns = [mapping.column for mapping in feature_mapping]
        if quantum_result is None:
            return QuantumSignalSummary(
                qubit_count=len(feature_mapping),
                encoded_columns=encoded_columns,
                dominant_state=None,
                dominant_state_probability=None,
                concentration_score=0.0,
                entanglement_score=0.0,
                interference_score=0.0,
                execution_fidelity=None,
                column_activation={column: 0.0 for column in encoded_columns},
            )

        top_states = quantum_result.get("top_basis_states") or []
        dominant_state = None
        dominant_probability = None
        if top_states:
            first = top_states[0]
            dominant_state = str(first.get("basis_state") or first.get("basisState") or "")
            raw_probability = first.get("probability") or first.get("value")
            if isinstance(raw_probability, (int, float)):
                dominant_probability = float(raw_probability)

        entanglement = quantum_result.get("entanglement_entropy") or {}
        entanglement_score = round(
            statistics.mean(entanglement.values()) if entanglement else 0.0,
            4,
        )

        observable_expectations = quantum_result.get("observable_expectations") or {}
        interference_score = round(
            statistics.mean(abs(value) for value in observable_expectations.values())
            if observable_expectations else 0.0,
            4,
        )

        fidelity = quantum_result.get("fidelity") or {}
        execution_fidelity = fidelity.get("estimated_execution_fidelity")
        if not isinstance(execution_fidelity, (int, float)):
            execution_fidelity = None

        marginals = self._column_activation(
            feature_mapping=feature_mapping,
            probability_source=(
                quantum_result.get("measured_probabilities")
                or quantum_result.get("probabilities")
                or {}
            ),
        )

        return QuantumSignalSummary(
            qubit_count=len(feature_mapping),
            encoded_columns=encoded_columns,
            dominant_state=dominant_state,
            dominant_state_probability=(
                round(dominant_probability, 6) if dominant_probability is not None else None
            ),
            concentration_score=round(dominant_probability or 0.0, 6),
            entanglement_score=entanglement_score,
            interference_score=interference_score,
            execution_fidelity=(
                round(float(execution_fidelity), 6) if execution_fidelity is not None else None
            ),
            column_activation=marginals,
        )

    def _column_activation(
        self,
        *,
        feature_mapping: list[QuantumFeatureMapping],
        probability_source: dict[str, Any],
    ) -> dict[str, float]:
        activations = {mapping.column: 0.0 for mapping in feature_mapping}
        if not probability_source:
            return activations

        qubit_count = len(feature_mapping)
        for state, raw_probability in probability_source.items():
            if not isinstance(state, str) or not isinstance(raw_probability, (int, float)):
                continue
            probability = float(raw_probability)
            bits = state.replace(" ", "")
            if not bits:
                continue
            padded = bits[-qubit_count:].rjust(qubit_count, "0")
            for mapping in feature_mapping:
                bit_index = qubit_count - 1 - mapping.qubit
                if 0 <= bit_index < len(padded) and padded[bit_index] == "1":
                    activations[mapping.column] += probability

        return {column: round(value, 6) for column, value in activations.items()}

    def _build_summary(
        self,
        *,
        row_count: int,
        col_count: int,
        numeric_cols: list[str],
        cat_cols: list[str],
        numeric_data: dict[str, list[float]],
        correlations: list[CorrelationPair],
        quantum_signal_summary: dict[str, Any],
    ) -> dict[str, Any]:
        strong_corrs = [c for c in correlations if c.strength == "strong"]
        all_means = {
            col: round(statistics.mean(values), 4)
            for col, values in numeric_data.items()
            if values
        }
        return {
            "total_rows": row_count,
            "total_columns": col_count,
            "numeric_column_count": len(numeric_cols),
            "categorical_column_count": len(cat_cols),
            "strong_correlation_pairs": len(strong_corrs),
            "column_means": all_means,
            "quantum_signal_summary": quantum_signal_summary,
        }

    def _json_ready(self, value: Any) -> Any:
        if isinstance(value, complex):
            return str(value)
        if isinstance(value, dict):
            return {str(key): self._json_ready(inner) for key, inner in value.items()}
        if isinstance(value, (list, tuple)):
            return [self._json_ready(item) for item in value]
        return value


def _percentile(data: list[float], pct: float) -> float:
    sorted_data = sorted(data)
    n = len(sorted_data)
    k = (n - 1) * pct / 100
    lo, hi = int(k), min(int(k) + 1, n - 1)
    return sorted_data[lo] + (sorted_data[hi] - sorted_data[lo]) * (k - lo)


def _skew(data: list[float]) -> float:
    n = len(data)
    if n < 3:
        return 0.0
    mean = statistics.mean(data)
    std = statistics.stdev(data)
    if std == 0:
        return 0.0
    return (sum((x - mean) ** 3 for x in data) / n) / (std ** 3)


def _kurt(data: list[float]) -> float:
    n = len(data)
    if n < 4:
        return 0.0
    mean = statistics.mean(data)
    std = statistics.stdev(data)
    if std == 0:
        return 0.0
    return (sum((x - mean) ** 4 for x in data) / n) / (std ** 4) - 3
