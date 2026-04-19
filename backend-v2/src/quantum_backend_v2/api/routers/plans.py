"""Execution plans API router."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from quantum_backend_v2.api.deps.auth import CurrentUser
from quantum_backend_v2.api.models.plans import ExecutionPlanResponse


def build_plans_router(*, session_factory: object) -> APIRouter:
    """Build the execution plans router."""
    router = APIRouter(prefix="/api/v1", tags=["plans"])

    # Temporary in-memory storage for plans
    # TODO: Replace with proper persistence
    _plans: dict[str, dict] = {}

    @router.get(
        "/plans/{plan_id}",
        response_model=ExecutionPlanResponse,
        summary="Get execution plan details",
    )
    async def get_plan(
        plan_id: str,
        current_user: CurrentUser,
    ) -> ExecutionPlanResponse:
        """Get the compiled execution plan for a job."""
        plan_data = _plans.get(plan_id)
        
        if plan_data is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Plan '{plan_id}' not found",
            )
        
        return ExecutionPlanResponse(**plan_data)

    return router
