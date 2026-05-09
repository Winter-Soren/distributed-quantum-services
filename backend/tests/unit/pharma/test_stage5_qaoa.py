"""Unit tests — Stage 5: DC-QAOA docking optimizer.

_run_qaoa_circuit is patched to avoid PennyLane simulation.
QUBO/Ising builder, result structure, warm-start, and placement logic tested.
"""
from __future__ import annotations
import numpy as np
import pytest
from unittest.mock import patch
from quantum_backend_v2.pharma.config import QAOAConfig
from quantum_backend_v2.pharma.models import MolecularFragment, VQEDescriptors, QUBOPlacement
from quantum_backend_v2.pharma.stages.stage_5 import DockingResult, QAOADockingOptimizer


def make_fragment(fid: str, smiles: str = "c1ccccc1") -> MolecularFragment:
    return MolecularFragment(
        fragment_id=fid, smiles=smiles,
        parent_ligand_smiles="CC(=O)Oc1ccccc1C(=O)O",
        atom_indices=(0, 1, 2, 3, 4, 5),
        adjacent_fragments=(), rotatable_bonds=0,
    )


def make_desc(fid: str) -> VQEDescriptors:
    return VQEDescriptors(
        fragment_id=fid, homo_energy_ev=-9.0, lumo_energy_ev=-1.0,
        homo_lumo_gap_ev=8.0, chemical_hardness_ev=4.0,
        esp_charges=[0.0, 0.1, -0.1, 0.0, 0.1, -0.1],
        ground_state_energy_hartree=-230.0, qubit_count=6, gate_count=80,
        vqe_iterations=100,
    )


def _mock_qaoa(self, h, J, beta0, gamma0, dc_alpha, n_qubits):
    """Stub: returns a random bitstring and plausible energy without PennyLane."""
    bitstring = np.random.randint(0, 2, n_qubits).tolist()
    energy = -3.5
    approx_ratio = 0.75
    return bitstring, energy, approx_ratio, beta0, gamma0, dc_alpha


FRAGS = [make_fragment("F1"), make_fragment("F2"), make_fragment("F3", "CC(=O)O")]
DESCS = {f.fragment_id: make_desc(f.fragment_id) for f in FRAGS}
N_SITES = 4
BINDING_GRID = np.random.uniform(-1, 0, (len(FRAGS), N_SITES))
CLASH = np.zeros((N_SITES, N_SITES))


class TestDockingResult:
    def test_basic(self):
        placement = QUBOPlacement(
            fragment_id="F1", grid_site_index=0,
            binary_variable_assignment=[1, 0, 0, 0],
            interaction_energy_kcal=-5.2,
        )
        r = DockingResult(
            placements=[placement], total_energy=-5.2,
            approximation_ratio=0.85,
            beta_params=[0.3], gamma_params=[0.5],
            dc_alpha=0.5, n_qubits_used=12,
        )
        assert r.total_energy == -5.2
        assert r.n_qubits_used == 12


class TestQAOADockingOptimizer:
    def setup_method(self):
        self.cfg = QAOAConfig(layers=1, use_counterdiabatic=True, max_iterations=5, shots=64)
        self.opt = QAOADockingOptimizer(self.cfg)

    def test_dock_returns_docking_result(self):
        with patch.object(QAOADockingOptimizer, "_run_qaoa_circuit", _mock_qaoa):
            result = self.opt.dock(FRAGS, DESCS, BINDING_GRID, CLASH)
        assert isinstance(result, DockingResult)

    def test_result_has_placements(self):
        with patch.object(QAOADockingOptimizer, "_run_qaoa_circuit", _mock_qaoa):
            result = self.opt.dock(FRAGS, DESCS, BINDING_GRID, CLASH)
        assert len(result.placements) == len(FRAGS)

    def test_placement_ids_match_fragments(self):
        with patch.object(QAOADockingOptimizer, "_run_qaoa_circuit", _mock_qaoa):
            result = self.opt.dock(FRAGS, DESCS, BINDING_GRID, CLASH)
        result_ids = {p.fragment_id for p in result.placements}
        expected_ids = {f.fragment_id for f in FRAGS}
        assert result_ids == expected_ids

    def test_approximation_ratio_in_range(self):
        with patch.object(QAOADockingOptimizer, "_run_qaoa_circuit", _mock_qaoa):
            result = self.opt.dock(FRAGS, DESCS, BINDING_GRID, CLASH)
        assert 0.0 <= result.approximation_ratio <= 1.0

    def test_beta_params_length(self):
        with patch.object(QAOADockingOptimizer, "_run_qaoa_circuit", _mock_qaoa):
            result = self.opt.dock(FRAGS, DESCS, BINDING_GRID, CLASH)
        assert len(result.beta_params) == self.cfg.layers

    def test_gamma_params_length(self):
        with patch.object(QAOADockingOptimizer, "_run_qaoa_circuit", _mock_qaoa):
            result = self.opt.dock(FRAGS, DESCS, BINDING_GRID, CLASH)
        assert len(result.gamma_params) == self.cfg.layers

    def test_warm_start_parameters(self):
        with patch.object(QAOADockingOptimizer, "_run_qaoa_circuit", _mock_qaoa):
            r1 = self.opt.dock(FRAGS, DESCS, BINDING_GRID, CLASH)
            r2 = self.opt.dock(
                FRAGS, DESCS, BINDING_GRID, CLASH,
                warm_start_beta=r1.beta_params,
                warm_start_gamma=r1.gamma_params,
            )
        assert isinstance(r2, DockingResult)

    def test_n_qubits_positive(self):
        with patch.object(QAOADockingOptimizer, "_run_qaoa_circuit", _mock_qaoa):
            result = self.opt.dock(FRAGS, DESCS, BINDING_GRID, CLASH)
        assert result.n_qubits_used > 0

    def test_single_fragment(self):
        one_frag = [FRAGS[0]]
        one_desc = {FRAGS[0].fragment_id: DESCS[FRAGS[0].fragment_id]}
        grid = BINDING_GRID[:1, :]
        with patch.object(QAOADockingOptimizer, "_run_qaoa_circuit", _mock_qaoa):
            result = self.opt.dock(one_frag, one_desc, grid, CLASH)
        assert isinstance(result, DockingResult)
        assert len(result.placements) == 1
