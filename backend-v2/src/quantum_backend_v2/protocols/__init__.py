"""Protocol contracts for the quantum peer network.

Families:
- reservation  — prepare / commit / cancel / expire
- execution    — dispatch / progress / complete / fail / retry
- quality      — fidelity / link-quality / node-health / reputation
- packages     — manifest announcement / fetch / install / seed
- chunks       — content-addressed chunked transfer with Merkle proofs
- peersync     — checkpoint reconciliation, replay, wantlists
"""

from quantum_backend_v2.protocols.models import ProtocolDescriptor, ProtocolVersion

__all__ = ["ProtocolDescriptor", "ProtocolVersion"]
