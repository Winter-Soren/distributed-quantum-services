"""Unit tests for ReservationService and reservation state machine."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest

from quantum_backend_v2.reservations.models import (
    ReservationState,
    ReservationTransition,
)


class TestReservationStateTransitions:
    """State machine correctness tests — no I/O required."""

    def _initial_state(self, **kwargs: object) -> ReservationState:
        defaults = dict(
            reservation_id="res-abc12345",
            workflow_run_id="wf-12345678",
            fragment_id="frag-01",
            service_id="svc-qft",
            requesting_peer_id="peer-coordinator",
        )
        defaults.update(kwargs)
        return ReservationState(**defaults)

    def test_initial_state_is_requested(self) -> None:
        state = self._initial_state()
        assert state.current_transition == ReservationTransition.REQUESTED
        assert not state.is_terminal
        assert not state.is_active

    def test_requested_can_accept(self) -> None:
        state = self._initial_state()
        assert state.can_transition_to(ReservationTransition.ACCEPTED)

    def test_requested_can_reject(self) -> None:
        state = self._initial_state()
        assert state.can_transition_to(ReservationTransition.REJECTED)

    def test_requested_cannot_commit_directly(self) -> None:
        state = self._initial_state()
        assert not state.can_transition_to(ReservationTransition.COMMITTED)

    def test_accept_transition(self) -> None:
        state = self._initial_state()
        accepted = state.apply(
            ReservationTransition.ACCEPTED, accepting_peer_id="peer-worker-01"
        )
        assert accepted.current_transition == ReservationTransition.ACCEPTED
        assert accepted.accepting_peer_id == "peer-worker-01"
        assert accepted.is_active

    def test_commit_after_accept(self) -> None:
        state = self._initial_state()
        accepted = state.apply(ReservationTransition.ACCEPTED)
        committed = accepted.apply(ReservationTransition.COMMITTED)
        assert committed.current_transition == ReservationTransition.COMMITTED
        assert committed.is_terminal
        assert committed.is_active

    def test_cancel_after_accept(self) -> None:
        state = self._initial_state()
        accepted = state.apply(ReservationTransition.ACCEPTED)
        cancelled = accepted.apply(ReservationTransition.CANCELLED)
        assert cancelled.is_terminal
        assert not cancelled.is_active

    def test_reject_from_requested(self) -> None:
        state = self._initial_state()
        rejected = state.apply(ReservationTransition.REJECTED)
        assert rejected.is_terminal

    def test_expire_from_requested(self) -> None:
        state = self._initial_state()
        expired = state.apply(ReservationTransition.EXPIRED)
        assert expired.is_terminal

    def test_invalid_transition_raises(self) -> None:
        state = self._initial_state()
        accepted = state.apply(ReservationTransition.ACCEPTED)
        committed = accepted.apply(ReservationTransition.COMMITTED)

        with pytest.raises(ValueError, match="Invalid transition"):
            committed.apply(ReservationTransition.CANCELLED)

    def test_committed_has_no_allowed_transitions(self) -> None:
        state = self._initial_state()
        accepted = state.apply(ReservationTransition.ACCEPTED)
        committed = accepted.apply(ReservationTransition.COMMITTED)

        for transition in ReservationTransition:
            assert not committed.can_transition_to(transition)

    def test_apply_preserves_other_fields(self) -> None:
        state = self._initial_state()
        accepted = state.apply(
            ReservationTransition.ACCEPTED, accepting_peer_id="peer-x"
        )
        assert accepted.reservation_id == state.reservation_id
        assert accepted.workflow_run_id == state.workflow_run_id
        assert accepted.fragment_id == state.fragment_id
        assert accepted.service_id == state.service_id

    def test_apply_can_preserve_replayed_timestamp(self) -> None:
        state = self._initial_state()
        replayed_at = datetime.now(timezone.utc) - timedelta(minutes=5)

        accepted = state.apply(
            ReservationTransition.ACCEPTED,
            accepting_peer_id="peer-worker-01",
            occurred_at=replayed_at,
        )

        assert accepted.last_event_at == replayed_at


class TestReservationConflictState:
    """Conflict detection without network I/O."""

    def test_has_capacity_when_empty(self) -> None:
        from quantum_backend_v2.reservations.models import ReservationConflictState

        conflict = ReservationConflictState(peer_id="peer-01")
        assert conflict.has_capacity(max_concurrent=3)
        assert conflict.active_count == 0

    def test_no_capacity_when_full(self) -> None:
        from quantum_backend_v2.reservations.models import ReservationConflictState

        conflict = ReservationConflictState(
            peer_id="peer-01",
            active_reservation_ids=frozenset({"r1", "r2"}),
            committed_reservation_ids=frozenset({"r3"}),
        )
        assert not conflict.has_capacity(max_concurrent=3)
        assert conflict.active_count == 3

    def test_has_capacity_with_slack(self) -> None:
        from quantum_backend_v2.reservations.models import ReservationConflictState

        conflict = ReservationConflictState(
            peer_id="peer-01",
            active_reservation_ids=frozenset({"r1"}),
        )
        assert conflict.has_capacity(max_concurrent=5)
