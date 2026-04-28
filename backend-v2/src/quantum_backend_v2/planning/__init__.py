"""Planning domain — workflow DAGs, fragment decomposition, assignment."""

from quantum_backend_v2.planning.cost import score_candidate
from quantum_backend_v2.planning.dag import build_operation_dependencies, topological_order
from quantum_backend_v2.planning.fragments import build_fragments
from quantum_backend_v2.planning.models import (
    CandidateScore,
    CircuitFragment,
    CircuitIR,
    CircuitOperation,
    ExecutionFragment,
    ExecutionPlan,
    FragmentAssignment,
    FragmentStatus,
    GateType,
    PlannerConfig,
    PlannerFragmentAssignment,
    PlannerWeights,
    ServiceAdvertisement,
    WorkflowDAG,
    WorkflowNode,
)
from quantum_backend_v2.planning.parser import CircuitNormalizationError, normalize_circuit_input
from quantum_backend_v2.planning.planner import CircuitPlanner, PlanningError, available_services

__all__ = [
    # Models
    "CandidateScore",
    "CircuitFragment",
    "CircuitIR",
    "CircuitOperation",
    "ExecutionFragment",
    "ExecutionPlan",
    "FragmentAssignment",
    "FragmentStatus",
    "GateType",
    "PlannerConfig",
    "PlannerFragmentAssignment",
    "PlannerWeights",
    "ServiceAdvertisement",
    "WorkflowDAG",
    "WorkflowNode",
    # Classes
    "CircuitPlanner",
    # Functions
    "available_services",
    "build_fragments",
    "build_operation_dependencies",
    "normalize_circuit_input",
    "score_candidate",
    "topological_order",
    # Exceptions
    "CircuitNormalizationError",
    "PlanningError",
]
