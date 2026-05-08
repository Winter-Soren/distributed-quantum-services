"""Stage 1: Lipinski Rule of Five + electronic stability filter.

Pure Python + RDKit — no quantum compute required.
"""
from __future__ import annotations

from dataclasses import dataclass, field

from rdkit import Chem
from rdkit.Chem import Descriptors, rdMolDescriptors

from quantum_backend_v2.pharma.models import VQEDescriptors


@dataclass
class FilterResult:
    smiles: str
    passes: bool
    failure_reasons: list[str] = field(default_factory=list)
    molecular_weight: float = 0.0
    logp: float = 0.0
    hbd: int = 0
    hba: int = 0


class LipinskiFilter:
    """Lipinski Rule of Five + electronic stability gates from VQE descriptors."""

    def __init__(
        self,
        max_mw: float = 500.0,
        max_logp: float = 5.0,
        max_hbd: int = 5,
        max_hba: int = 10,
        min_gap_ev: float = 4.0,
        min_hardness_ev: float = 2.0,
        max_violations: int = 1,
    ) -> None:
        self._max_mw = max_mw
        self._max_logp = max_logp
        self._max_hbd = max_hbd
        self._max_hba = max_hba
        self._min_gap_ev = min_gap_ev
        self._min_hardness_ev = min_hardness_ev
        self._max_violations = max_violations

    def evaluate(self, smiles: str, descriptors: VQEDescriptors) -> FilterResult:
        mol = Chem.MolFromSmiles(smiles)
        if mol is None:
            return FilterResult(smiles=smiles, passes=False, failure_reasons=["Invalid SMILES"])

        mw = Descriptors.ExactMolWt(mol)
        logp = Descriptors.MolLogP(mol)
        hbd = rdMolDescriptors.CalcNumHBD(mol)
        hba = rdMolDescriptors.CalcNumHBA(mol)

        reasons: list[str] = []
        lipinski_violations = 0

        if mw > self._max_mw:
            reasons.append(f"MW {mw:.1f} > {self._max_mw}")
            lipinski_violations += 1
        if logp > self._max_logp:
            reasons.append(f"LogP {logp:.2f} > {self._max_logp}")
            lipinski_violations += 1
        if hbd > self._max_hbd:
            reasons.append(f"HBD {hbd} > {self._max_hbd}")
            lipinski_violations += 1
        if hba > self._max_hba:
            reasons.append(f"HBA {hba} > {self._max_hba}")
            lipinski_violations += 1

        if descriptors.homo_lumo_gap_ev < self._min_gap_ev:
            reasons.append(
                f"HOMO-LUMO gap {descriptors.homo_lumo_gap_ev:.2f} eV < "
                f"{self._min_gap_ev} eV (too reactive)"
            )
        if descriptors.chemical_hardness_ev < self._min_hardness_ev:
            reasons.append(
                f"Chemical hardness {descriptors.chemical_hardness_ev:.2f} eV < "
                f"{self._min_hardness_ev} eV"
            )

        lipinski_ok = lipinski_violations <= self._max_violations
        electronic_ok = not any("eV" in r for r in reasons)
        passes = lipinski_ok and electronic_ok

        return FilterResult(
            smiles=smiles,
            passes=passes,
            failure_reasons=reasons,
            molecular_weight=mw,
            logp=logp,
            hbd=hbd,
            hba=hba,
        )

    def batch_filter(
        self,
        candidates: list[tuple[str, VQEDescriptors]],
    ) -> list[tuple[str, VQEDescriptors]]:
        """Return only (smiles, descriptors) pairs that pass."""
        return [(s, d) for s, d in candidates if self.evaluate(s, d).passes]
