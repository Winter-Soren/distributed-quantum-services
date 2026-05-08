"""Ansatz builders for VQE — UCCSD (V1), HEA (fallback), LUCJ (V2 hardware path)."""
from __future__ import annotations

from typing import Any, Callable

from quantum_backend_v2.pharma.config import AnsatzType, VQEConfig


class AnsatzFactory:
    """Returns a PennyLane circuit function for the configured ansatz type."""

    def __init__(self, config: VQEConfig) -> None:
        self._config = config

    def get_ansatz_fn(self, n_qubits: int, n_electrons: int) -> Callable[..., Any]:
        """Return ansatz callable for use in PennyLane VQE circuit."""
        if self._config.ansatz == AnsatzType.UCCSD:
            return self._uccsd_ansatz(n_qubits, n_electrons)
        elif self._config.ansatz == AnsatzType.HEA:
            return self._hea_ansatz(n_qubits)
        elif self._config.ansatz == AnsatzType.LUCJ:
            raise NotImplementedError(
                "LUCJ ansatz is config-ready but not active in V1. "
                "Requires real quantum hardware with noise for SQD post-processing."
            )
        raise ValueError(f"Unknown ansatz type: {self._config.ansatz}")

    def _uccsd_ansatz(self, n_qubits: int, n_electrons: int) -> Callable:
        import pennylane as qml
        from pennylane import qchem

        def ansatz(params: list, wires: list) -> None:  # type: ignore[type-arg]
            singles, doubles = qchem.excitations(n_electrons, n_qubits)
            qml.UCCSD(
                weights=params,
                wires=wires,
                s_wires=singles,
                d_wires=doubles,
                init_state=qchem.hf_state(n_electrons, n_qubits),
            )

        return ansatz

    def _hea_ansatz(self, n_qubits: int) -> Callable:
        import pennylane as qml

        def ansatz(params: list, wires: list) -> None:  # type: ignore[type-arg]
            for i, w in enumerate(wires):
                qml.RY(params[i], wires=w)
            for i in range(len(wires) - 1):
                qml.CNOT(wires=[wires[i], wires[i + 1]])

        return ansatz
