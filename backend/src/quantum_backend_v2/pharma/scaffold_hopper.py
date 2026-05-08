"""Scaffold hopping for iterative ligand refinement.

Triggered when: ADMET fails OR VQC affinity above threshold.
Preserves QAOA warm-start parameters across iterations.
"""
from __future__ import annotations

from dataclasses import dataclass

from rdkit import Chem
from rdkit.Chem import Descriptors

from quantum_backend_v2.pharma.models import ADMETResult


@dataclass
class HopResult:
    needs_hop: bool
    replacement_smiles: str
    replaced_fragment_smiles: str = ""
    hop_reason: str = ""
    warm_start_beta: list[float] | None = None
    warm_start_gamma: list[float] | None = None


class ScaffoldHopper:
    """Rule-based scaffold hopper with warm-start parameter preservation."""

    # Polar isosteres for lipophilic groups
    ISOSTERE_MAP: dict[str, str] = {
        "CC(C)C": "CC(N)C",
        "c1ccccc1": "c1ccncc1",
        "CCC": "CCO",
        "CCCC": "CCC(=O)O",
        "C(F)(F)F": "C(O)(F)F",
    }

    def __init__(self, min_affinity_kcal: float = -6.0) -> None:
        self._min_affinity = min_affinity_kcal

    def hop(
        self,
        smiles: str,
        admet: ADMETResult,
        vqc_affinity: float,
        iteration: int,
        prev_beta: list[float] | None = None,
        prev_gamma: list[float] | None = None,
    ) -> HopResult:
        needs_hop = not admet.passes or vqc_affinity > self._min_affinity

        if not needs_hop:
            return HopResult(needs_hop=False, replacement_smiles=smiles)

        reason = admet.failure_reasons[0] if admet.failure_reasons else "weak_affinity"
        new_smiles, replaced = self._apply_hop_strategy(smiles, reason)

        return HopResult(
            needs_hop=True,
            replacement_smiles=new_smiles,
            replaced_fragment_smiles=replaced,
            hop_reason=reason,
            warm_start_beta=prev_beta,
            warm_start_gamma=prev_gamma,
        )

    def _apply_hop_strategy(self, smiles: str, reason: str) -> tuple[str, str]:
        mol = Chem.MolFromSmiles(smiles)
        if mol is None:
            return smiles, ""

        if "LogP" in reason or "logp" in reason.lower():
            return self._reduce_logp(smiles, mol)
        elif "MW" in reason:
            return self._reduce_mw(smiles, mol)
        elif "QED" in reason:
            return self._improve_qed(smiles, mol)
        else:
            return self._mutate_random_fragment(smiles, mol)

    def _reduce_logp(self, smiles: str, mol: Chem.Mol) -> tuple[str, str]:
        from rdkit.Chem import AllChem

        for substructure, replacement in self.ISOSTERE_MAP.items():
            sub_mol = Chem.MolFromSmiles(substructure)
            if sub_mol and mol.HasSubstructMatch(sub_mol):
                new_mol = AllChem.ReplaceSubstructs(
                    mol, sub_mol, Chem.MolFromSmiles(replacement), replaceAll=False
                )
                if new_mol and new_mol[0] is not None:
                    new_smiles = Chem.MolToSmiles(new_mol[0])
                    if Chem.MolFromSmiles(new_smiles) is not None:
                        return new_smiles, substructure
        return smiles, ""

    def _reduce_mw(self, smiles: str, mol: Chem.Mol) -> tuple[str, str]:
        from rdkit.Chem import BRICS

        frags = list(BRICS.BRICSDecompose(mol))
        if len(frags) <= 1:
            return smiles, ""
        frags_sorted = sorted(
            frags,
            key=lambda s: Descriptors.ExactMolWt(Chem.MolFromSmiles(s))
            if Chem.MolFromSmiles(s)
            else 999,
        )
        removed = frags_sorted[0]
        remaining = frags_sorted[1:]
        candidate = max(
            remaining,
            key=lambda s: Descriptors.ExactMolWt(Chem.MolFromSmiles(s))
            if Chem.MolFromSmiles(s)
            else 0,
        )
        if Chem.MolFromSmiles(candidate):
            return Chem.MolToSmiles(Chem.MolFromSmiles(candidate)), removed  # type: ignore[arg-type]
        return smiles, ""

    def _improve_qed(self, smiles: str, mol: Chem.Mol) -> tuple[str, str]:
        rw = Chem.RWMol(mol)
        for atom in rw.GetAtoms():
            if atom.GetAtomicNum() == 6 and atom.GetTotalNumHs() >= 1:
                atom.SetAtomicNum(8)
                try:
                    Chem.SanitizeMol(rw)
                    new_smiles = Chem.MolToSmiles(rw)
                    if Chem.MolFromSmiles(new_smiles) is not None:
                        return new_smiles, "aliphatic_carbon"
                except Exception:
                    pass
                atom.SetAtomicNum(6)
        return smiles, ""

    def _mutate_random_fragment(self, smiles: str, mol: Chem.Mol) -> tuple[str, str]:
        import random
        from rdkit.Chem import AllChem

        bioisosteres = ["c1ccncc1", "C1CCCCC1", "C(=O)N", "S(=O)(=O)N"]
        for sub_smiles in bioisosteres:
            sub = Chem.MolFromSmiles(sub_smiles)
            if sub and mol.HasSubstructMatch(sub):
                replacement = random.choice(bioisosteres)
                try:
                    result = AllChem.ReplaceSubstructs(
                        mol, sub, Chem.MolFromSmiles(replacement)
                    )
                    if result:
                        new_smiles = Chem.MolToSmiles(result[0])
                        if Chem.MolFromSmiles(new_smiles) is not None:
                            return new_smiles, sub_smiles
                except Exception:
                    pass
        return smiles, ""
