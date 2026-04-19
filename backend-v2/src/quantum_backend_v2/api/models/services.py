"""Services and metrics API models."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class ServiceResponse(BaseModel):
    """Response model for a quantum service."""

    node_id: str = Field(description="Peer node identifier")
    listen_addrs: list[str] = Field(description="Network addresses")
    service_type: str = Field(description="Type of quantum service")
    fidelity: float = Field(ge=0.0, le=1.0, description="Service fidelity")
    qubit_min: int = Field(ge=1, description="Minimum qubits supported")
    qubit_max: int = Field(ge=1, description="Maximum qubits supported")
    availability: bool = Field(description="Service availability")
    updated_at: datetime = Field(description="Last update timestamp")


class FidelitySampleResponse(BaseModel):
    """A single fidelity measurement sample."""

    service_type: str
    fidelity: float = Field(ge=0.0, le=1.0)
    availability: bool
    updated_at: datetime


class FidelityMetricsResponse(BaseModel):
    """Fidelity metrics for a node."""

    node_id: str
    sample_count: int = Field(ge=0)
    average_fidelity: float = Field(ge=0.0, le=1.0)
    min_fidelity: float = Field(ge=0.0, le=1.0)
    max_fidelity: float = Field(ge=0.0, le=1.0)
    samples: list[FidelitySampleResponse]
