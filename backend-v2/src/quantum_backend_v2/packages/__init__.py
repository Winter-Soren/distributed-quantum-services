"""Packages domain — swarm-ready service packages, signing, placement."""

from quantum_backend_v2.packages.models import (
    BenchmarkMetadata,
    BenchmarkMode,
    PackageIntegrity,
    PeerPublishedQuantumServiceManifest,
    RuntimeClass,
    ServiceInterfaceSchema,
    ServiceVisibility,
)
from quantum_backend_v2.packages.replication import SwarmPlacementMeta
from quantum_backend_v2.packages.signing import (
    ManifestSigner,
    ManifestVerificationResult,
    verify_manifest,
)

__all__ = [
    "BenchmarkMetadata",
    "BenchmarkMode",
    "ManifestSigner",
    "ManifestVerificationResult",
    "PackageIntegrity",
    "PeerPublishedQuantumServiceManifest",
    "RuntimeClass",
    "ServiceInterfaceSchema",
    "ServiceVisibility",
    "SwarmPlacementMeta",
    "verify_manifest",
]
