"""Stage 3: Fragment Decomposition via BRICS.

Each fragment becomes an ExecutionFragment dispatched to one peer for VQE.
"""
from __future__ import annotations

import hashlib

from rdkit import Chem
from rdkit.Chem import BRICS, rdMolDescriptors

from quantum_backend_v2.pharma.models import MolecularFragment


def _canonical(smiles: str) -> str:
    """Canonicalize SMILES and strip BRICS dummy atoms."""
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        return smiles
    edit = Chem.RWMol(mol)
    atoms_to_remove = [a.GetIdx() for a in edit.GetAtoms() if a.GetAtomicNum() == 0]
    for idx in sorted(atoms_to_remove, reverse=True):
        edit.RemoveAtom(idx)
    try:
        return Chem.MolToSmiles(edit.GetMol(), canonical=True)
    except Exception:
        return smiles


def _fragment_id(smiles: str, idx: int) -> str:
    digest = hashlib.sha1(smiles.encode()).hexdigest()[:8]
    return f"frag_{idx:03d}_{digest}"


class FragmentDecomposer:
    """Decomposes ligand SMILES into BRICS fragments for distributed VQE."""

    def __init__(self, min_fragment_heavy_atoms: int = 3) -> None:
        self._min_heavy = min_fragment_heavy_atoms

    def decompose(self, smiles: str) -> list[MolecularFragment]:
        mol = Chem.MolFromSmiles(smiles)
        if mol is None:
            raise ValueError(f"Invalid SMILES: {smiles}")

        raw_fragments = list(BRICS.BRICSDecompose(mol, returnMols=False))

        cleaned: list[str] = []
        for frag_smiles in raw_fragments:
            canon = _canonical(frag_smiles)
            frag_mol = Chem.MolFromSmiles(canon)
            if frag_mol is None:
                continue
            heavy = sum(1 for a in frag_mol.GetAtoms() if a.GetAtomicNum() > 1)
            if heavy >= self._min_heavy:
                cleaned.append(canon)

        if not cleaned:
            # Fallback: treat whole molecule as single fragment
            cleaned = [Chem.MolToSmiles(mol, canonical=True)]

        fragments: list[MolecularFragment] = []
        for i, frag_smiles in enumerate(cleaned):
            frag_mol = Chem.MolFromSmiles(frag_smiles)
            rotatable = rdMolDescriptors.CalcNumRotatableBonds(frag_mol) if frag_mol else 0
            fragments.append(
                MolecularFragment(
                    fragment_id=_fragment_id(frag_smiles, i),
                    smiles=frag_smiles,
                    parent_ligand_smiles=smiles,
                    atom_indices=tuple(),
                    adjacent_fragments=tuple(),
                    rotatable_bonds=rotatable,
                )
            )
        return fragments
