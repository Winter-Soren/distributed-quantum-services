"""Shared API error contracts and FastAPI exception handlers."""

from quantum_backend_v2.api.errors.models import (
    ApiError,
    ErrorCode,
    ErrorDetail,
    register_exception_handlers,
)

__all__ = ["ApiError", "ErrorCode", "ErrorDetail", "register_exception_handlers"]
