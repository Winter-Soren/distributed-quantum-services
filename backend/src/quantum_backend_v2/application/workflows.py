"""Workflow submission use-case — submit, plan, cancel workflow runs."""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from quantum_backend_v2.workflows.models import WorkflowRun, WorkflowRunStatus, WorkflowType

logger = logging.getLogger(__name__)


def create_workflow_run(
    *,
    workflow_definition_id: str,
    owner_user_id: str,
    workflow_type: WorkflowType,
    input_snapshot: dict[str, Any],
    project_id: str | None = None,
) -> WorkflowRun:
    """Build a new WorkflowRun in SUBMITTED state.

    The run is not persisted here — callers must write it to Postgres via the
    appropriate ORM session.
    """
    run_id = uuid.uuid4().hex
    run = WorkflowRun(
        run_id=run_id,
        workflow_definition_id=workflow_definition_id,
        owner_user_id=owner_user_id,
        project_id=project_id,
        workflow_type=workflow_type,
        status=WorkflowRunStatus.SUBMITTED,
        input_snapshot=input_snapshot,
        submitted_at=datetime.now(timezone.utc),
    )
    logger.info(
        "created workflow run run_id=%s type=%s owner=%s",
        run_id,
        workflow_type.value,
        owner_user_id,
    )
    return run
