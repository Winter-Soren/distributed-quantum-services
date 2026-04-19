"""durable_event_logs_and_workflow_runs

Adds append-only reservation_events, execution_events tables and the
workflow_runs table that replaces in-memory workflow state tracking.
"""

from __future__ import annotations

import sqlalchemy as sa

from alembic import op

revision = "2c4f9a71e3b8"
down_revision = "838b0126c4fd"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "workflow_runs",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("workflow_definition_id", sa.String(64), nullable=False),
        sa.Column(
            "owner_user_id",
            sa.String(64),
            sa.ForeignKey("platform_users.id", name="fk_workflow_runs_owner_user_id_platform_users"),
            nullable=False,
        ),
        sa.Column("project_id", sa.String(64), nullable=True),
        sa.Column("workflow_type", sa.String(40), nullable=False),
        sa.Column("status", sa.String(32), nullable=False, server_default="submitted"),
        sa.Column("input_snapshot", sa.JSON, nullable=False, server_default="{}"),
        sa.Column("output_snapshot", sa.JSON, nullable=False, server_default="{}"),
        sa.Column("fragment_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("completed_fragments", sa.Integer, nullable=False, server_default="0"),
        sa.Column("failed_fragments", sa.Integer, nullable=False, server_default="0"),
        sa.Column("artifact_bundle_id", sa.String(64), nullable=True),
        sa.Column("benchmark_run_id", sa.String(64), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_workflow_runs_owner_user_id", "workflow_runs", ["owner_user_id"])
    op.create_index(
        "ix_workflow_runs_workflow_definition_id", "workflow_runs", ["workflow_definition_id"]
    )
    op.create_index("ix_workflow_runs_project_id", "workflow_runs", ["project_id"])

    op.create_table(
        "reservation_events",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("reservation_id", sa.String(64), nullable=False),
        sa.Column("workflow_run_id", sa.String(64), nullable=False),
        sa.Column("fragment_id", sa.String(64), nullable=False),
        sa.Column("transition", sa.String(32), nullable=False),
        sa.Column("requesting_peer_id", sa.String(255), nullable=False),
        sa.Column("accepting_peer_id", sa.String(255), nullable=True),
        sa.Column("service_id", sa.String(120), nullable=False),
        sa.Column("idempotency_key", sa.String(64), nullable=False, unique=True),
        sa.Column("reason", sa.Text, nullable=True),
        sa.Column("payload", sa.JSON, nullable=False, server_default="{}"),
        sa.Column(
            "occurred_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index(
        "ix_reservation_events_reservation_id", "reservation_events", ["reservation_id"]
    )
    op.create_index(
        "ix_reservation_events_workflow_run_id", "reservation_events", ["workflow_run_id"]
    )

    op.create_table(
        "execution_events",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("execution_id", sa.String(64), nullable=False),
        sa.Column("reservation_id", sa.String(64), nullable=False),
        sa.Column("workflow_run_id", sa.String(64), nullable=False),
        sa.Column("fragment_id", sa.String(64), nullable=False),
        sa.Column("transition", sa.String(32), nullable=False),
        sa.Column("executing_peer_id", sa.String(255), nullable=False),
        sa.Column("service_id", sa.String(120), nullable=False),
        sa.Column("idempotency_key", sa.String(64), nullable=False, unique=True),
        sa.Column("retry_attempt", sa.Integer, nullable=False, server_default="0"),
        sa.Column("fidelity_score", sa.Float, nullable=True),
        sa.Column("latency_ms", sa.Float, nullable=True),
        sa.Column("error_detail", sa.Text, nullable=True),
        sa.Column("payload", sa.JSON, nullable=False, server_default="{}"),
        sa.Column(
            "occurred_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_execution_events_execution_id", "execution_events", ["execution_id"])
    op.create_index("ix_execution_events_reservation_id", "execution_events", ["reservation_id"])
    op.create_index(
        "ix_execution_events_workflow_run_id", "execution_events", ["workflow_run_id"]
    )


def downgrade() -> None:
    op.drop_table("execution_events")
    op.drop_table("reservation_events")
    op.drop_table("workflow_runs")
