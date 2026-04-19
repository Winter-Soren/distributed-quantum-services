"""Unit tests for package manifest signing and verification."""

from __future__ import annotations

import pytest

from quantum_backend_v2.packages.models import (
    BenchmarkMetadata,
    BenchmarkMode,
    PackageIntegrity,
    PeerPublishedQuantumServiceManifest,
    RuntimeClass,
    ServiceInterfaceSchema,
    ServiceVisibility,
)
from quantum_backend_v2.packages.signing import ManifestSigner, verify_manifest
from quantum_backend_v2.protocols.models import ProtocolDescriptor, ProtocolVersion


def _make_manifest(
    *,
    manifest_signature: str = "a" * 32,
    digest: str = "b" * 64,
) -> PeerPublishedQuantumServiceManifest:
    return PeerPublishedQuantumServiceManifest(
        service_id="svc-qaoa-optimizer",
        version="1.0.0",
        title="QAOA Portfolio Optimizer",
        summary="Variational quantum optimizer for portfolio selection using QAOA algorithm.",
        publisher_peer_id="peer-publisher-01",
        runtime_class=RuntimeClass.PYTHON_ENV,
        protocol=ProtocolDescriptor(
            name="qaoa-service",
            version=ProtocolVersion(major=1, minor=0, patch=0),
            topic="quantum-backend-v2.qaoa-service.v1",
        ),
        quantum_capability="variational_optimization",
        classical_baseline_capability="classical_portfolio",
        entrypoint="qaoa_optimizer:run",
        input_schema=ServiceInterfaceSchema(name="PortfolioInput"),
        output_schema=ServiceInterfaceSchema(name="PortfolioOutput"),
        benchmark=BenchmarkMetadata(
            mode=BenchmarkMode.QUANTUM_VS_CLASSICAL,
            benchmark_family="portfolio_optimization",
        ),
        integrity=PackageIntegrity(
            algorithm="sha256",
            digest=digest,
            manifest_signature=manifest_signature,
        ),
    )


class TestManifestSigner:
    _SECRET = b"dev-signing-secret-00000000000000"
    _PAYLOAD = b"fake-package-payload-bytes"

    def test_sign_produces_integrity(self) -> None:
        signer = ManifestSigner(secret_key=self._SECRET)
        manifest = _make_manifest()
        integrity = signer.sign(manifest, payload_bytes=self._PAYLOAD)
        assert len(integrity.digest) >= 32
        assert len(integrity.manifest_signature) >= 16

    def test_verify_signed_manifest(self) -> None:
        signer = ManifestSigner(secret_key=self._SECRET)
        manifest = _make_manifest()
        integrity = signer.sign(manifest, payload_bytes=self._PAYLOAD)
        manifest_with_integrity = manifest.model_copy(update={"integrity": integrity})

        result = signer.verify(manifest_with_integrity, payload_bytes=self._PAYLOAD)
        assert result.valid
        assert result.signature_valid
        assert result.trusted

    def test_tampered_payload_fails(self) -> None:
        signer = ManifestSigner(secret_key=self._SECRET)
        manifest = _make_manifest()
        integrity = signer.sign(manifest, payload_bytes=self._PAYLOAD)
        manifest_with_integrity = manifest.model_copy(update={"integrity": integrity})

        result = signer.verify(manifest_with_integrity, payload_bytes=b"tampered-payload")
        assert not result.valid
        assert result.failure_reason == "payload digest mismatch"

    def test_wrong_key_fails(self) -> None:
        signer = ManifestSigner(secret_key=self._SECRET)
        manifest = _make_manifest()
        integrity = signer.sign(manifest, payload_bytes=self._PAYLOAD)
        manifest_with_integrity = manifest.model_copy(update={"integrity": integrity})

        bad_signer = ManifestSigner(secret_key=b"wrong-key-00000000000000000000000")
        result = bad_signer.verify(manifest_with_integrity, payload_bytes=self._PAYLOAD)
        assert not result.valid

    def test_verify_convenience_wrapper(self) -> None:
        signer = ManifestSigner(secret_key=self._SECRET)
        manifest = _make_manifest()
        integrity = signer.sign(manifest, payload_bytes=self._PAYLOAD)
        manifest_with_integrity = manifest.model_copy(update={"integrity": integrity})

        result = verify_manifest(
            manifest_with_integrity,
            payload_bytes=self._PAYLOAD,
            secret_key=self._SECRET,
        )
        assert result.trusted


class TestSwarmPlacementMeta:
    def test_not_seeded_when_empty(self) -> None:
        from quantum_backend_v2.packages.replication import SwarmPlacementMeta

        meta = SwarmPlacementMeta(package_id="pkg-001")
        assert not meta.is_sufficiently_seeded
        assert meta.seeder_count == 0

    def test_add_seeder(self) -> None:
        from quantum_backend_v2.packages.replication import SwarmPlacementMeta

        meta = SwarmPlacementMeta(package_id="pkg-001", desired_seeders=2)
        meta = meta.with_new_seeder("peer-01")
        meta = meta.with_new_seeder("peer-02")
        assert meta.is_sufficiently_seeded
        assert meta.seeder_count == 2

    def test_duplicate_seeder_not_added(self) -> None:
        from quantum_backend_v2.packages.replication import SwarmPlacementMeta

        meta = SwarmPlacementMeta(package_id="pkg-001")
        meta = meta.with_new_seeder("peer-01")
        meta = meta.with_new_seeder("peer-01")
        assert meta.seeder_count == 1

    def test_chunk_availability_tracking(self) -> None:
        from quantum_backend_v2.packages.replication import SwarmPlacementMeta

        meta = SwarmPlacementMeta(package_id="pkg-001", total_chunks=3)
        meta = meta.with_chunk_seen(0, "peer-01")
        meta = meta.with_chunk_seen(1, "peer-01")
        meta = meta.with_chunk_seen(0, "peer-02")

        assert meta.chunk_availability["0"] == 2
        assert meta.chunk_availability["1"] == 1
        assert meta.rarest_chunk_index == "1"
