"""Unit tests for ExecutionState machine and RuntimeRecoveryService helpers."""

from __future__ import annotations

import pytest

from quantum_backend_v2.runtime.models import ExecutionState, ExecutionTransition
from quantum_backend_v2.runtime.recovery import (
    _replay_execution_states,
    _replay_reservation_states,
)


class TestExecutionStateTransitions:
    """State machine correctness tests — no I/O required."""

    def _initial(self, **kwargs: object) -> ExecutionState:
        defaults = dict(
            execution_id="exec-12345678",
            reservation_id="res-12345678",
            workflow_run_id="wf-12345678",
            fragment_id="frag-01",
            service_id="svc-qft",
            executing_peer_id="peer-worker-01",
        )
        defaults.update(kwargs)
        return ExecutionState(**defaults)

    def test_initial_is_dispatched(self) -> None:
        state = self._initial()
        assert state.current_transition == ExecutionTransition.DISPATCHED
        assert not state.is_terminal

    def test_dispatched_to_running(self) -> None:
        state = self._initial()
        running = state.apply(ExecutionTransition.RUNNING)
        assert running.current_transition == ExecutionTransition.RUNNING

    def test_running_to_checkpoint(self) -> None:
        state = self._initial()
        running = state.apply(ExecutionTransition.RUNNING)
        ckpt = running.apply(ExecutionTransition.CHECKPOINTED, checkpoint_ref="ckpt-001")
        assert ckpt.current_transition == ExecutionTransition.CHECKPOINTED
        assert ckpt.checkpoint_ref == "ckpt-001"

    def test_running_to_completed(self) -> None:
        state = self._initial()
        running = state.apply(ExecutionTransition.RUNNING)
        completed = running.apply(
            ExecutionTransition.COMPLETED, fidelity_score=0.98, latency_ms=123.4
        )
        assert completed.is_terminal
        assert completed.fidelity_score == pytest.approx(0.98)
        assert completed.latency_ms == pytest.approx(123.4)

    def test_failed_can_retry(self) -> None:
        state = self._initial()
        running = state.apply(ExecutionTransition.RUNNING)
        failed = running.apply(ExecutionTransition.FAILED, error_detail="shot error")
        assert failed.is_retryable
        retrying = failed.apply(ExecutionTransition.RETRYING)
        assert retrying.current_transition == ExecutionTransition.RETRYING

    def test_completed_is_terminal(self) -> None:
        state = self._initial()
        running = state.apply(ExecutionTransition.RUNNING)
        completed = running.apply(ExecutionTransition.COMPLETED)
        assert completed.is_terminal
        assert not completed.can_transition_to(ExecutionTransition.RUNNING)

    def test_invalid_transition_raises(self) -> None:
        state = self._initial()
        with pytest.raises(ValueError, match="Invalid transition"):
            state.apply(ExecutionTransition.COMPLETED)

    def test_dispatched_cannot_checkpoint(self) -> None:
        state = self._initial()
        assert not state.can_transition_to(ExecutionTransition.CHECKPOINTED)


class TestRuntimeRecovery:
    """Tests for the replay helpers (pure functions, no DB)."""

    def _make_exec_record(
        self,
        execution_id: str,
        transition: str,
        reservation_id: str = "res-00000001",
        workflow_run_id: str = "wf-00000001",
        fragment_id: str = "frag-001",
        service_id: str = "svc-qft",
        executing_peer_id: str = "peer-worker",
        fidelity_score: float | None = None,
        latency_ms: float | None = None,
        error_detail: str | None = None,
        payload: dict | None = None,
        occurred_offset_seconds: int = 0,
    ) -> object:
        from datetime import datetime, timezone, timedelta

        class FakeExecEvent:
            pass

        e = FakeExecEvent()
        e.execution_id = execution_id  # type: ignore[attr-defined]
        e.reservation_id = reservation_id  # type: ignore[attr-defined]
        e.workflow_run_id = workflow_run_id  # type: ignore[attr-defined]
        e.fragment_id = fragment_id  # type: ignore[attr-defined]
        e.transition = transition  # type: ignore[attr-defined]
        e.service_id = service_id  # type: ignore[attr-defined]
        e.executing_peer_id = executing_peer_id  # type: ignore[attr-defined]
        e.fidelity_score = fidelity_score  # type: ignore[attr-defined]
        e.latency_ms = latency_ms  # type: ignore[attr-defined]
        e.error_detail = error_detail  # type: ignore[attr-defined]
        e.payload = payload or {}  # type: ignore[attr-defined]
        e.occurred_at = datetime(2026, 1, 1, tzinfo=timezone.utc) + timedelta(  # type: ignore[attr-defined]
            seconds=occurred_offset_seconds
        )
        return e

    def test_replay_single_dispatched(self) -> None:
        events = [self._make_exec_record("exec-001", "dispatched")]
        states = _replay_execution_states(events)  # type: ignore[arg-type]
        assert "exec-001" in states
        assert states["exec-001"].current_transition == ExecutionTransition.DISPATCHED

    def test_replay_full_lifecycle(self) -> None:
        events = [
            self._make_exec_record("exec-001", "dispatched", occurred_offset_seconds=0),
            self._make_exec_record("exec-001", "running", occurred_offset_seconds=1),
            self._make_exec_record(
                "exec-001", "completed", fidelity_score=0.95, occurred_offset_seconds=2
            ),
        ]
        states = _replay_execution_states(events)  # type: ignore[arg-type]
        assert states["exec-001"].current_transition == ExecutionTransition.COMPLETED
        assert states["exec-001"].fidelity_score == pytest.approx(0.95)

    def test_replay_multiple_executions(self) -> None:
        events = [
            self._make_exec_record("exec-001", "dispatched"),
            self._make_exec_record("exec-002", "dispatched"),
            self._make_exec_record("exec-002", "running", occurred_offset_seconds=1),
        ]
        states = _replay_execution_states(events)  # type: ignore[arg-type]
        assert len(states) == 2
        assert states["exec-001"].current_transition == ExecutionTransition.DISPATCHED
        assert states["exec-002"].current_transition == ExecutionTransition.RUNNING

    def test_empty_events_returns_empty(self) -> None:
        states = _replay_execution_states([])
        assert states == {}
