"""Package manifest signing and verification.

Produces and checks Ed25519-style detached signatures over the canonical
JSON representation of a ``PeerPublishedQuantumServiceManifest``.

In production, replace the stub key-pair generation with a proper key-management
integration (HSM, Vault, PKCS#11, etc.).  The verification interface remains stable.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import logging
from dataclasses import dataclass
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from quantum_backend_v2.packages.models import (
    PackageIntegrity,
    PeerPublishedQuantumServiceManifest,
)

logger = logging.getLogger(__name__)

_SIGNING_ALG = "hmac-sha256"


def _canonical_json(data: dict[str, Any]) -> bytes:
    """Deterministic JSON serialisation for signing."""
    return json.dumps(data, sort_keys=True, separators=(",", ":"), default=str).encode()


def _hex_digest(data: bytes, *, algorithm: str = "sha256") -> str:
    h = hashlib.new(algorithm)
    h.update(data)
    return h.hexdigest()


class ManifestVerificationResult(BaseModel):
    """Outcome of a manifest verification check."""

    model_config = ConfigDict(extra="forbid", frozen=True)

    valid: bool
    manifest_id: str
    algorithm: str
    computed_digest: str
    expected_digest: str
    signature_valid: bool
    failure_reason: str | None = None

    @property
    def trusted(self) -> bool:
        return self.valid and self.signature_valid


@dataclass(frozen=True)
class ManifestSigner:
    """Signs manifests with a shared HMAC secret.

    Production replacements should use asymmetric signing (Ed25519 / ECDSA).
    """

    secret_key: bytes
    algorithm: str = "sha256"

    def sign(
        self,
        manifest: PeerPublishedQuantumServiceManifest,
        *,
        payload_bytes: bytes,
    ) -> PackageIntegrity:
        """Return a ``PackageIntegrity`` object with digest and signature."""
        payload_digest = _hex_digest(payload_bytes, algorithm=self.algorithm)
        manifest_dict = manifest.model_dump(mode="json", exclude={"integrity"})
        manifest_dict["payload_digest"] = payload_digest
        canonical = _canonical_json(manifest_dict)

        signature = hmac.new(self.secret_key, canonical, self.algorithm).hexdigest()
        return PackageIntegrity(
            algorithm=self.algorithm,
            digest=payload_digest,
            manifest_signature=signature,
        )

    def verify(
        self,
        manifest: PeerPublishedQuantumServiceManifest,
        *,
        payload_bytes: bytes,
    ) -> ManifestVerificationResult:
        """Verify the manifest signature and payload digest."""
        computed_payload_digest = _hex_digest(payload_bytes, algorithm=self.algorithm)
        manifest_dict = manifest.model_dump(mode="json", exclude={"integrity"})
        manifest_dict["payload_digest"] = computed_payload_digest
        canonical = _canonical_json(manifest_dict)

        expected_sig = hmac.new(self.secret_key, canonical, self.algorithm).hexdigest()
        sig_valid = hmac.compare_digest(
            expected_sig, manifest.integrity.manifest_signature
        )
        digest_valid = hmac.compare_digest(
            computed_payload_digest, manifest.integrity.digest
        )
        valid = sig_valid and digest_valid

        failure: str | None = None
        if not digest_valid:
            failure = "payload digest mismatch"
        elif not sig_valid:
            failure = "manifest signature invalid"

        return ManifestVerificationResult(
            valid=valid,
            manifest_id=manifest.service_id,
            algorithm=self.algorithm,
            computed_digest=computed_payload_digest,
            expected_digest=manifest.integrity.digest,
            signature_valid=sig_valid,
            failure_reason=failure,
        )


def verify_manifest(
    manifest: PeerPublishedQuantumServiceManifest,
    *,
    payload_bytes: bytes,
    secret_key: bytes,
) -> ManifestVerificationResult:
    """Convenience wrapper that constructs a signer and verifies in one call."""
    signer = ManifestSigner(secret_key=secret_key, algorithm=manifest.integrity.algorithm)
    return signer.verify(manifest, payload_bytes=payload_bytes)
