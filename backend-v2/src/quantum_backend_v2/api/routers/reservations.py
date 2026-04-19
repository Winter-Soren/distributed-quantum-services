"""Reservation router — create and query durable event-log-backed reservations."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, status

from quantum_backend_v2.api.deps.auth import CurrentUser
from quantum_backend_v2.api.errors.models import not_found
from quantum_backend_v2.api.models.reservations import ReservationResponse, ReserveRequest
from quantum_backend_v2.reservations.models import ReservationState
from quantum_backend_v2.reservations.service import ReservationService


def build_reservations_router(*, reservation_service: ReservationService) -> APIRouter:
    """Build the reservations router."""
    router = APIRouter(prefix="/api/v1/reservations", tags=["reservations"])

    @router.post(
        "",
        response_model=ReservationResponse,
        status_code=status.HTTP_201_CREATED,
        summary="Create a new durable reservation",
    )
    async def create_reservation(
        body: ReserveRequest,
        current_user: CurrentUser,
    ) -> ReservationResponse:
        reservation_id = uuid.uuid4().hex
        state = await reservation_service.request(
            reservation_id=reservation_id,
            workflow_run_id=body.workflow_run_id,
            fragment_id=body.fragment_id,
            service_id=body.service_id,
            requesting_peer_id=body.requesting_peer_id,
            ttl_seconds=body.ttl_seconds,
            idempotency_key=body.idempotency_key,
        )
        return _to_response(state)

    @router.get(
        "/{reservation_id}",
        response_model=ReservationResponse,
        summary="Get reservation state (reconstructed from event log)",
    )
    async def get_reservation(
        reservation_id: str,
        current_user: CurrentUser,
    ) -> ReservationResponse:
        state = await reservation_service.get_state(reservation_id)
        if state is None:
            raise not_found("Reservation", reservation_id)
        return _to_response(state)

    @router.post(
        "/{reservation_id}/cancel",
        response_model=ReservationResponse,
        summary="Cancel a reservation",
    )
    async def cancel_reservation(
        reservation_id: str,
        current_user: CurrentUser,
        reason: str | None = None,
    ) -> ReservationResponse:
        state = await reservation_service.cancel(
            reservation_id=reservation_id,
            reason=reason,
        )
        return _to_response(state)

    return router


def _to_response(state: ReservationState) -> ReservationResponse:
    return ReservationResponse(
        reservation_id=state.reservation_id,
        workflow_run_id=state.workflow_run_id,
        fragment_id=state.fragment_id,
        service_id=state.service_id,
        requesting_peer_id=state.requesting_peer_id,
        accepting_peer_id=state.accepting_peer_id,
        current_transition=state.current_transition.value,
        ttl_seconds=state.ttl_seconds,
        last_event_at=state.last_event_at,
        is_terminal=state.is_terminal,
        is_active=state.is_active,
    )
