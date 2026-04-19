"""Unit tests for the planning domain — WorkflowDAG and fragment models."""

from __future__ import annotations

import pytest

from quantum_backend_v2.planning.models import (
    CostEstimate,
    ExecutionFragment,
    FragmentStatus,
    WorkflowDAG,
    WorkflowNode,
)


class TestWorkflowDAG:
    def _node(self, node_id: str, depends_on: tuple[str, ...] = ()) -> WorkflowNode:
        return WorkflowNode(
            node_id=node_id,
            service_id=f"svc-{node_id}",
            label=f"Node {node_id}",
            depends_on=depends_on,
        )

    def test_single_node_dag(self) -> None:
        dag = WorkflowDAG(
            dag_id="dag-001",
            workflow_run_id="wf-12345678",
            nodes=(self._node("node-alpha"),),
        )
        order = dag.execution_order()
        assert len(order) == 1
        assert order[0].node_id == "node-alpha"

    def test_linear_dag_order(self) -> None:
        dag = WorkflowDAG(
            dag_id="dag-002",
            workflow_run_id="wf-12345678",
            nodes=(
                self._node("node-a"),
                self._node("node-b", depends_on=("node-a",)),
                self._node("node-c", depends_on=("node-b",)),
            ),
        )
        order = dag.execution_order()
        ids = [n.node_id for n in order]
        assert ids.index("node-a") < ids.index("node-b")
        assert ids.index("node-b") < ids.index("node-c")

    def test_parallel_dag_order(self) -> None:
        dag = WorkflowDAG(
            dag_id="dag-003",
            workflow_run_id="wf-12345678",
            nodes=(
                self._node("node-a"),
                self._node("node-b"),
                self._node("node-c", depends_on=("node-a", "node-b")),
            ),
        )
        order = dag.execution_order()
        ids = [n.node_id for n in order]
        assert ids.index("node-a") < ids.index("node-c")
        assert ids.index("node-b") < ids.index("node-c")

    def test_unknown_dependency_raises(self) -> None:
        with pytest.raises(ValueError, match="unknown node"):
            WorkflowDAG(
                dag_id="dag-004",
                workflow_run_id="wf-12345678",
                nodes=(self._node("node-x", depends_on=("node-missing",)),),
            )

    def test_cycle_detection(self) -> None:
        dag = WorkflowDAG(
            dag_id="dag-005",
            workflow_run_id="wf-12345678",
            nodes=(
                WorkflowNode(
                    node_id="node-x",
                    service_id="svc-node-x",
                    label="Node X",
                    depends_on=("node-y",),
                ),
                WorkflowNode(
                    node_id="node-y",
                    service_id="svc-node-y",
                    label="Node Y",
                    depends_on=("node-x",),
                ),
            ),
        )
        with pytest.raises(ValueError, match="cycle"):
            dag.execution_order()


class TestExecutionFragment:
    def test_default_status_is_pending(self) -> None:
        frag = ExecutionFragment(
            fragment_id="frag-001",
            workflow_run_id="wf-12345678",
            node_id="node-001",
            service_id="svc-qft",
        )
        assert frag.status == FragmentStatus.PENDING
        assert frag.attempt == 0


class TestCostEstimate:
    def test_composite_score_in_range(self) -> None:
        est = CostEstimate(
            fragment_id="frag-001",
            candidate_peer_id="peer-01",
            estimated_latency_ms=50.0,
            estimated_fidelity=0.97,
            composite_score=0.85,
        )
        assert 0.0 <= est.composite_score <= 1.0
