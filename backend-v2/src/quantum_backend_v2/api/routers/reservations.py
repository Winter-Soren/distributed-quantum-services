"""Reservation router for durable event-log-backed reservations."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, status
from sqlalchemy import select

from quantum_backend_v2.api.deps.auth import CurrentUser
from quantum_backend_v2.api.errors.models import forbidden, not_found
from quantum_backend_v2.api.models.reservations import ReservationResponse, ReserveRequest
from quantum_backend_v2.persistence.postgres import WorkflowRunRecord
from quantum_backend_v2.reservations.models import ReservationState
from quantum_backend_v2.reservations.service import ReservationService


def build_reservations_router(
    *,
    reservation_service: ReservationService,
    session_factory: object,
) -> APIRouter:
    """Build the reservations router."""
    router = APIRouter(prefix="/api/v1/reservations", tags=["reservations"])

    def _session():
        return session_factory()  # type: ignore[operator]

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
        workflow_owner_user_id = await _lookup_workflow_owner(
            session_factory=_session,
            workflow_run_id=body.workflow_run_id,
        )
        if workflow_owner_user_id is None:
            raise not_found("Workflow run", body.workflow_run_id)

        if not current_user.is_admin() and workflow_owner_user_id != current_user.user_id:
            raise not_found("Workflow run", body.workflow_run_id)

        if (
            body.requesting_peer_id is not None
            and body.requesting_peer_id != current_user.user_id
            and not current_user.is_admin()
        ):
            raise forbidden("Non-admin callers cannot reserve on behalf of another peer.")

        reservation_id = uuid.uuid4().hex
        state = await reservation_service.request(
            reservation_id=reservation_id,
            workflow_run_id=body.workflow_run_id,
            fragment_id=body.fragment_id,
            service_id=body.service_id,
            requesting_peer_id=body.requesting_peer_id
            if current_user.is_admin() and body.requesting_peer_id is not None
            else current_user.user_id,
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
        if not current_user.is_admin() and state.requesting_peer_id != current_user.user_id:
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
        existing = await reservation_service.get_state(reservation_id)
        if existing is None:
            raise not_found("Reservation", reservation_id)
        if not current_user.is_admin() and existing.requesting_peer_id != current_user.user_id:
            raise not_found("Reservation", reservation_id)

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


async def _lookup_workflow_owner(*, session_factory: object, workflow_run_id: str) -> str | None:
    async with session_factory() as session:  # type: ignore[operator]
        result = await session.execute(
            select(WorkflowRunRecord.owner_user_id).where(WorkflowRunRecord.id == workflow_run_id)
        )
        return result.scalar_one_or_none()
