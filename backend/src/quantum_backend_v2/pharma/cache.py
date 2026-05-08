"""Fragment descriptor cache backed by MongoDB.
Keyed by canonical SMILES — cross-job, cross-user accumulation."""
from __future__ import annotations

from typing import Any

from quantum_backend_v2.pharma.models import VQEDescriptors


class FragmentCache:
    """MongoDB-backed cache for VQE fragment descriptors."""

    def __init__(self, mongo_runtime: Any | None) -> None:
        self._mongo = mongo_runtime

    def _canonical_key(self, smiles: str) -> str:
        """Canonicalize SMILES for cache key consistency."""
        try:
            from rdkit import Chem

            mol = Chem.MolFromSmiles(smiles)
            if mol is None:
                return smiles
            return Chem.MolToSmiles(mol, canonical=True)
        except ImportError:
            return smiles

    async def _lookup(self, canonical_smiles: str) -> dict | None:
        if self._mongo is None:
            return None
        collection = self._mongo.database["fragment_descriptors"]
        return await collection.find_one({"canonical_smiles": canonical_smiles})

    async def get(self, smiles: str) -> VQEDescriptors | None:
        """Return cached descriptors or None on miss."""
        key = self._canonical_key(smiles)
        doc = await self._lookup(key)
        if doc is None:
            return None
        return VQEDescriptors(
            fragment_id=doc.get("fragment_id_hint", "cached"),
            homo_energy_ev=doc["homo_energy_ev"],
            lumo_energy_ev=doc["lumo_energy_ev"],
            homo_lumo_gap_ev=doc["homo_lumo_gap_ev"],
            chemical_hardness_ev=doc["chemical_hardness_ev"],
            esp_charges=doc.get("esp_charges", []),
            ground_state_energy_hartree=doc["ground_state_energy_hartree"],
            qubit_count=doc["qubit_count"],
            gate_count=doc["gate_count"],
            vqe_iterations=doc["vqe_iterations"],
            dmet_impurity_size=doc.get("dmet_impurity_size"),
            cached=True,
        )

    async def put(
        self,
        smiles: str,
        descriptors: VQEDescriptors,
        source_job_id: str = "",
    ) -> None:
        """Store descriptors. No-op if MongoDB unavailable."""
        if self._mongo is None:
            return
        key = self._canonical_key(smiles)
        collection = self._mongo.database["fragment_descriptors"]
        await collection.update_one(
            {"canonical_smiles": key},
            {
                "$set": {
                    "canonical_smiles": key,
                    "fragment_id_hint": descriptors.fragment_id,
                    "homo_energy_ev": descriptors.homo_energy_ev,
                    "lumo_energy_ev": descriptors.lumo_energy_ev,
                    "homo_lumo_gap_ev": descriptors.homo_lumo_gap_ev,
                    "chemical_hardness_ev": descriptors.chemical_hardness_ev,
                    "esp_charges": descriptors.esp_charges,
                    "ground_state_energy_hartree": descriptors.ground_state_energy_hartree,
                    "qubit_count": descriptors.qubit_count,
                    "gate_count": descriptors.gate_count,
                    "vqe_iterations": descriptors.vqe_iterations,
                    "dmet_impurity_size": descriptors.dmet_impurity_size,
                    "source_job_id": source_job_id,
                }
            },
            upsert=True,
        )

    async def bulk_get(self, smiles_list: list[str]) -> dict[str, VQEDescriptors]:
        """Return all cached descriptors for a list of SMILES."""
        results: dict[str, VQEDescriptors] = {}
        for smiles in smiles_list:
            hit = await self.get(smiles)
            if hit is not None:
                results[self._canonical_key(smiles)] = hit
        return results
