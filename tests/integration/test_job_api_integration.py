from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from time import monotonic, sleep

from fastapi.testclient import TestClient

from quantum_coordinator.api.app import create_app
from quantum_coordinator.config.models import APIConfig, AppConfig, DatabaseConfig
from quantum_coordinator.domain.models import GateType, JobStatus
from quantum_coordinator.infra.persistence import SQLiteJobStore, SQLiteServiceRegistryStore
from quantum_coordinator.infra.persistence.job_store import JobRecord
from quantum_coordinator.service_discovery.advertisement import ServiceAdvertisement

CIRCUIT_TEXT = """
OPENQASM 2.0;
qreg q[2];
cx q[0], q[1];
"""


def _wait_for_job_terminal(client: TestClient, job_id: str, timeout_seconds: float = 2.0) -> dict:
    deadline = monotonic() + timeout_seconds
    while monotonic() < deadline:
        response = client.get(f"/api/v1/jobs/{job_id}")
        assert response.status_code == 200
        payload = response.json()
        if payload["status"] in {"COMPLETED", "FAILED"}:
            return payload
        sleep(0.02)
    raise AssertionError(f"job {job_id} did not reach terminal state")


def _seed_service(database_path: str, node_id: str = "node-1", fidelity: float = 0.95) -> None:
    store = SQLiteServiceRegistryStore(database_path)
    store.save(
        ServiceAdvertisement(
            node_id=node_id,
            service_type=GateType.CNOT,
            fidelity=fidelity,
            qubit_min=1,
            qubit_max=2,
            availability=True,
        )
    )


def _make_config(
    database_path: str,
    *,
    enable_auth: bool = False,
    api_key: str | None = None,
    enable_rate_limit: bool = False,
    rate_limit_per_minute: int = 60,
) -> AppConfig:
    return AppConfig(
        database=DatabaseConfig(path=database_path),
        api=APIConfig(
            enable_auth=enable_auth,
            api_key=api_key,
            enable_rate_limit=enable_rate_limit,
            rate_limit_per_minute=rate_limit_per_minute,
        ),
    )


def test_submit_and_poll_job_completion(tmp_path: Path) -> None:
    database_path = str(tmp_path / "submit.db")
    _seed_service(database_path=database_path)
    app = create_app(_make_config(database_path))

    with TestClient(app) as client:
        submit_response = client.post(
            "/api/v1/circuits/submit",
            json={"circuit": CIRCUIT_TEXT},
        )
        assert submit_response.status_code == 200
        submit_payload = submit_response.json()
        assert submit_payload["status"] == "QUEUED"
        assert submit_payload["job_id"].startswith("job-")

        terminal = _wait_for_job_terminal(client, submit_payload["job_id"])
        assert terminal["status"] == "COMPLETED"
        assert terminal["result"] is not None
        assert len(terminal["result"]["fragment_results"]) == 1


def test_services_and_fidelity_metrics_endpoints(tmp_path: Path) -> None:
    database_path = str(tmp_path / "metrics.db")
    _seed_service(database_path=database_path, node_id="node-metrics", fidelity=0.91)
    store = SQLiteServiceRegistryStore(database_path)
    store.save(
        ServiceAdvertisement(
            node_id="node-metrics",
            service_type=GateType.CZ,
            fidelity=0.89,
            qubit_min=1,
            qubit_max=3,
            availability=True,
        )
    )
    app = create_app(_make_config(database_path))

    with TestClient(app) as client:
        services_response = client.get("/api/v1/services")
        assert services_response.status_code == 200
        services = services_response.json()
        assert len(services) == 2

        metrics_response = client.get("/api/v1/metrics/fidelity/node-metrics")
        assert metrics_response.status_code == 200
        metrics = metrics_response.json()
        assert metrics["node_id"] == "node-metrics"
        assert metrics["sample_count"] == 2
        assert metrics["min_fidelity"] == 0.89
        assert metrics["max_fidelity"] == 0.91


def test_auth_and_rate_limit_guards(tmp_path: Path) -> None:
    database_path = str(tmp_path / "auth-rate.db")
    _seed_service(database_path=database_path)
    app = create_app(
        _make_config(
            database_path,
            enable_auth=True,
            api_key="topsecret",
            enable_rate_limit=True,
            rate_limit_per_minute=1,
        )
    )

    with TestClient(app) as client:
        unauthorized = client.get("/api/v1/services")
        assert unauthorized.status_code == 401

        authorized = client.get("/api/v1/services", headers={"X-API-Key": "topsecret"})
        assert authorized.status_code == 200

        limited = client.get("/api/v1/services", headers={"X-API-Key": "topsecret"})
        assert limited.status_code == 429


def test_startup_recovery_reprocesses_unfinished_jobs(tmp_path: Path) -> None:
    database_path = str(tmp_path / "recovery.db")
    _seed_service(database_path=database_path)
    job_store = SQLiteJobStore(database_path)
    now = datetime.now(timezone.utc)
    job_store.upsert(
        JobRecord(
            job_id="job-recover-1",
            status=JobStatus.QUEUED,
            circuit_text=CIRCUIT_TEXT,
            plan_id=None,
            error=None,
            result_json=None,
            created_at=now,
            updated_at=now,
        )
    )

    app = create_app(_make_config(database_path))
    with TestClient(app) as client:
        response = client.get("/api/v1/jobs/job-recover-1")
        assert response.status_code == 200
        payload = response.json()
        assert payload["status"] == "COMPLETED"
        assert payload["result"] is not None
