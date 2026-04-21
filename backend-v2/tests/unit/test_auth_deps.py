from __future__ import annotations

import pytest

from quantum_backend_v2.api.deps.auth import _resolve_user_claims, configure_auth
from quantum_backend_v2.api.errors.models import PlatformException

pytestmark = pytest.mark.anyio


@pytest.fixture(autouse=True)
def reset_auth():
    configure_auth(enabled=True, allow_dev_bearer_tokens=False)
    yield
    configure_auth(enabled=True, allow_dev_bearer_tokens=False)


async def test_dev_bearer_tokens_are_rejected_by_default() -> None:
    with pytest.raises(PlatformException) as exc_info:
        await _resolve_user_claims(authorization="Bearer dev-alice")

    assert exc_info.value.status_code == 401


async def test_dev_bearer_tokens_require_explicit_opt_in() -> None:
    configure_auth(enabled=True, allow_dev_bearer_tokens=True)

    claims = await _resolve_user_claims(authorization="Bearer dev-alice")

    assert claims is not None
    assert claims.user_id == "alice"
