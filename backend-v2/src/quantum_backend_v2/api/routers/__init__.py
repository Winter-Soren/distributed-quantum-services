"""Versioned API routers."""

from quantum_backend_v2.api.routers.discovery import build_discovery_router as discovery_router
from quantum_backend_v2.api.routers.enrollment import build_enrollment_router
from quantum_backend_v2.api.routers.reservations import build_reservations_router
from quantum_backend_v2.api.routers.system import build_router as system_router
from quantum_backend_v2.api.routers.workflows import build_workflows_router

__all__ = [
    "build_enrollment_router",
    "build_reservations_router",
    "build_workflows_router",
    "discovery_router",
    "system_router",
]
