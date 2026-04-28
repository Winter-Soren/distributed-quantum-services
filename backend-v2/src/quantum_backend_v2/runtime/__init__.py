"""Runtime domain — execution event log, recovery, fallback orchestration."""

from quantum_backend_v2.runtime.models import ExecutionState, ExecutionTransition
from quantum_backend_v2.runtime.recovery import RuntimeRecoveryService
from quantum_backend_v2.runtime.service import ExecutionService
from quantum_backend_v2.runtime.executor import RuntimeExecutor, RuntimePolicy
from quantum_backend_v2.runtime.gate_execution import (
    GateExecutionAdapter,
    Libp2pGateExecutionAdapter,
    LocalGateExecutionAdapter,
)
from quantum_backend_v2.runtime.execution_models import (
    FragmentExecutionResult,
    FragmentExecutionStatus,
    GateExecutionResult,
    RuntimeExecutionError,
    RuntimeExecutionResult,
)
from quantum_backend_v2.runtime.qiskit_results import build_quantum_result

__all__ = [
    "ExecutionService",
    "ExecutionState",
    "ExecutionTransition",
    "RuntimeRecoveryService",
    "RuntimeExecutor",
    "RuntimePolicy",
    "GateExecutionAdapter",
    "Libp2pGateExecutionAdapter",
    "LocalGateExecutionAdapter",
    "FragmentExecutionResult",
    "FragmentExecutionStatus",
    "GateExecutionResult",
    "RuntimeExecutionError",
    "RuntimeExecutionResult",
    "build_quantum_result",
]
