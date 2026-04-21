"""Shared planning/execution bridge for QASM-backed workflows."""

from __future__ import annotations

import sys
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Any, Iterator

from quantum_backend_v2.api.routers.service_quality import ServiceQualityTracker
from quantum_backend_v2.discovery.service import DiscoveryService
from quantum_backend_v2.libp2p import Libp2pRuntime


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[4]


def _load_backend_bridge() -> dict[str, Any]:
    backend_src = _repo_root() / "backend" / "src"
    backend_src_str = str(backend_src)
    if backend_src_str not in sys.path:
        sys.path.insert(0, backend_src_str)

    from quantum_coordinator.planning.dag import build_operation_dependencies, topological_order
    from quantum_coordinator.planning.fragments import build_fragments
    from quantum_coordinator.planning.models import (
        CandidateScore,
        ExecutionPlan,
        FragmentAssignment,
    )
    from quantum_coordinator.planning.parser import (
        CircuitNormalizationError,
        normalize_circuit_input,
    )
    from quantum_coordinator.runtime.models import (
        FragmentExecutionResult,
        FragmentExecutionStatus,
    )
    from quantum_coordinator.runtime.qiskit_results import build_quantum_result

    return {
        "CandidateScore": CandidateScore,
        "CircuitNormalizationError": CircuitNormalizationError,
        "ExecutionPlan": ExecutionPlan,
        "FragmentAssignment": FragmentAssignment,
        "FragmentExecutionResult": FragmentExecutionResult,
        "FragmentExecutionStatus": FragmentExecutionStatus,
        "build_fragments": build_fragments,
        "build_operation_dependencies": build_operation_dependencies,
        "build_quantum_result": build_quantum_result,
        "normalize_circuit_input": normalize_circuit_input,
        "topological_order": topological_order,
    }


def sanitize_json(value: Any) -> Any:
    """Convert runtime values into JSON-friendly payloads."""
    if isinstance(value, dict):
        return {str(key): sanitize_json(item) for key, item in value.items()}
    if isinstance(value, (list, tuple, set, frozenset)):
        return [sanitize_json(item) for item in value]
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, Enum):
        return value.value
    if isinstance(value, complex):
        return _format_complex(value)
    return value


def _format_complex(value: complex) -> str:
    real = round(value.real, 12)
    imag = round(value.imag, 12)

    if imag == 0:
        return f"{real}"
    if real == 0:
        return f"{imag}j"
    sign = "+" if imag >= 0 else "-"
    return f"{real}{sign}{abs(imag)}j"


@dataclass(frozen=True)
class ServiceCandidate:
    node_id: str
    fidelity: float


class QuantumExecutionBridge:
    """Compile QASM, assign fragments, and synthesize execution metadata."""

    def __init__(
        self,
        *,
        discovery_service: DiscoveryService,
        libp2p_runtime: Libp2pRuntime,
    ) -> None:
        self._discovery_service = discovery_service
        self._libp2p_runtime = libp2p_runtime
        self._quality = ServiceQualityTracker()
        self._bridge = _load_backend_bridge()

    def compile_plan(self, circuit_text: str) -> Any:
        normalize_circuit_input = self._bridge["normalize_circuit_input"]
        build_operation_dependencies = self._bridge["build_operation_dependencies"]
        build_fragments = self._bridge["build_fragments"]
        topological_order = self._bridge["topological_order"]
        candidate_score_type = self._bridge["CandidateScore"]
        assignment_type = self._bridge["FragmentAssignment"]
        execution_plan_type = self._bridge["ExecutionPlan"]

        circuit = normalize_circuit_input(circuit_text)
        dependencies = build_operation_dependencies(circuit)
        fragments = build_fragments(circuit, dependencies)
        fragment_order = topological_order(
            {
                fragment_id: fragment.dependencies
                for fragment_id, fragment in fragments.items()
            }
        )

        assignments = {}
        for fragment_id in fragment_order:
            fragment = fragments[fragment_id]
            candidates = self._candidates_for_service(fragment.service_type.value)
            if not candidates:
                raise RuntimeError(
                    "No available service provider for "
                    f"{fragment.fragment_id} ({fragment.service_type.value})"
                )

            scored_candidates = tuple(
                candidate_score_type(
                    node_id=candidate.node_id,
                    total_cost=round(1.0 - candidate.fidelity, 6),
                    latency_cost=0.0,
                    failure_risk_cost=round(1.0 - candidate.fidelity, 6),
                    entanglement_cost=0.0,
                    load_cost=0.0,
                    fidelity=candidate.fidelity,
                )
                for candidate in candidates
            )
            primary = scored_candidates[0]
            fallbacks = tuple(
                candidate.node_id for candidate in scored_candidates[1:3]
            )
            assignments[fragment_id] = assignment_type(
                fragment_id=fragment.fragment_id,
                primary_node_id=primary.node_id,
                fallback_node_ids=fallbacks,
                candidates=scored_candidates,
            )

        return execution_plan_type(
            plan_id=f"plan-{uuid.uuid4()}",
            fragment_order=fragment_order,
            fragments=fragments,
            assignments=assignments,
            quality_snapshot_id=f"quality-{_utc_now().isoformat()}",
        )

    def iter_fragment_results(self, plan: Any) -> Iterator[Any]:
        fragment_result_type = self._bridge["FragmentExecutionResult"]
        fragment_status_type = self._bridge["FragmentExecutionStatus"]

        for fragment_id in plan.fragment_order:
            assignment = plan.assignments[fragment_id]
            fragment = plan.fragments[fragment_id]
            started_at = _utc_now()
            finished_at = _utc_now()
            fidelity = self._quality.get_service_fidelity(
                fragment.service_type.value,
                peer_id=assignment.primary_node_id,
            )
            yield fragment_result_type(
                fragment_id=fragment.fragment_id,
                node_id=assignment.primary_node_id,
                status=fragment_status_type.SUCCESS,
                attempts=1,
                started_at=started_at,
                finished_at=finished_at,
                observed_fidelity=fidelity,
                error=None,
            )

    def build_quantum_result(
        self,
        *,
        plan: Any,
        fragment_results: tuple[Any, ...],
    ) -> dict[str, Any]:
        return sanitize_json(
            self._bridge["build_quantum_result"](
                plan,
                fragment_results=fragment_results,
            )
        )

    def serialize_plan(self, plan: Any) -> dict[str, Any]:
        return {
            "plan_id": plan.plan_id,
            "fragment_order": list(plan.fragment_order),
            "fragments": {
                fragment_id: {
                    "fragment_id": fragment.fragment_id,
                    "service_type": fragment.service_type.value,
                    "qubits": list(fragment.qubits),
                    "operation_ids": list(fragment.operation_ids),
                    "dependencies": list(fragment.dependencies),
                }
                for fragment_id, fragment in plan.fragments.items()
            },
            "assignments": {
                fragment_id: {
                    "fragment_id": assignment.fragment_id,
                    "primary_node_id": assignment.primary_node_id,
                    "fallback_node_ids": list(assignment.fallback_node_ids),
                    "candidates": [
                        {
                            "node_id": candidate.node_id,
                            "total_cost": candidate.total_cost,
                            "latency_cost": candidate.latency_cost,
                            "failure_risk_cost": candidate.failure_risk_cost,
                            "entanglement_cost": candidate.entanglement_cost,
                            "load_cost": candidate.load_cost,
                            "fidelity": candidate.fidelity,
                        }
                        for candidate in assignment.candidates
                    ],
                }
                for fragment_id, assignment in plan.assignments.items()
            },
            "quality_snapshot_id": plan.quality_snapshot_id,
        }

    def serialize_fragment_result(self, fragment_result: Any) -> dict[str, Any]:
        return {
            "fragment_id": fragment_result.fragment_id,
            "node_id": fragment_result.node_id,
            "status": fragment_result.status.value,
            "started_at": fragment_result.started_at.isoformat(),
            "finished_at": fragment_result.finished_at.isoformat(),
            "attempts": fragment_result.attempts,
            "error": fragment_result.error,
            "observed_fidelity": fragment_result.observed_fidelity,
        }

    def _candidates_for_service(self, service_type: str) -> list[ServiceCandidate]:
        candidates: list[ServiceCandidate] = []
        registry = self._discovery_service.registry
        for peer in registry.list_peers(include_stale=False):
            if peer.health_status != "healthy":
                continue
            if service_type not in peer.service_ids:
                continue
            candidates.append(
                ServiceCandidate(
                    node_id=peer.peer_id,
                    fidelity=self._quality.get_service_fidelity(
                        service_type,
                        peer_id=peer.peer_id,
                    ),
                )
            )

        if not candidates:
            local_peer_id = str(self._libp2p_runtime.host.get_id())
            candidates.append(
                ServiceCandidate(
                    node_id=local_peer_id,
                    fidelity=self._quality.get_service_fidelity(
                        service_type,
                        peer_id=local_peer_id,
                    ),
                )
            )

        return sorted(
            candidates,
            key=lambda candidate: (-candidate.fidelity, candidate.node_id),
        )
