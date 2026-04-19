"""Execution plan API models."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class FragmentResponse(BaseModel):
    """Response model for a circuit fragment."""

    fragment_id: str
    service_type: str
    qubits: list[int]
    operation_ids: list[str]
    dependencies: list[str]


class CandidateResponse(BaseModel):
    """Response model for an assignment candidate."""

    node_id: str
    total_cost: float
    latency_cost: float
    failure_risk_cost: float
    entanglement_cost: float
    load_cost: float
    fidelity: float


class AssignmentResponse(BaseModel):
    """Response model for a fragment assignment."""

    fragment_id: str
    primary_node_id: str
    fallback_node_ids: list[str]
    candidates: list[CandidateResponse]


class ExecutionPlanResponse(BaseModel):
    """Response model for a complete execution plan."""

    plan_id: str
    fragment_order: list[str]
    fragments: dict[str, FragmentResponse]
    assignments: dict[str, AssignmentResponse]
    quality_snapshot_id: str | None = None
