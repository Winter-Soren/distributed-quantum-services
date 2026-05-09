"""Unit tests — pharma domain models (matches actual schemas)."""
from __future__ import annotations
import pytest
from quantum_backend_v2.pharma.models import (
    ADMETResult, DockingPose, MolecularFragment, PharmaCandidate,
    QUBOPlacement, ScaffoldIteration, VQCScore, VQEDescriptors,
)


ASPIRIN = "CC(=O)Oc1ccccc1C(=O)O"
IBUPROFEN = "CC(C)Cc1ccc(cc1)C(C)C(=O)O"


def make_fragment(fid: str = "F001", smiles: str = "c1ccccc1") -> MolecularFragment:
    return MolecularFragment(
        fragment_id=fid, smiles=smiles,
        parent_ligand_smiles=ASPIRIN,
        atom_indices=(0, 1, 2, 3, 4, 5),
        adjacent_fragments=(),
        rotatable_bonds=0,
    )


def make_vqe(fid: str = "F001", smiles: str = "c1ccccc1") -> VQEDescriptors:
    return VQEDescriptors(
        fragment_id=fid,
        homo_energy_ev=-9.5, lumo_energy_ev=-1.2, homo_lumo_gap_ev=8.3,
        chemical_hardness_ev=4.15, esp_charges=[0.1, -0.2, 0.05, 0.15, -0.1, 0.0],
        ground_state_energy_hartree=-382.6, qubit_count=6, gate_count=80,
        vqe_iterations=100,
    )


def make_placement(fid: str = "F001") -> QUBOPlacement:
    return QUBOPlacement(
        fragment_id=fid, grid_site_index=0,
        binary_variable_assignment=[1, 0, 0],
        interaction_energy_kcal=-2.5,
    )


def make_pose() -> DockingPose:
    return DockingPose(
        ligand_smiles=ASPIRIN,
        fragment_placements=[make_placement("F001")],
        total_qubo_energy=-8.0,
        qaoa_approximation_ratio=0.85,
        qaoa_params_beta=[0.3],
        qaoa_params_gamma=[0.5],
        dc_qaoa_alpha=0.5,
    )


def make_vqc_score() -> VQCScore:
    return VQCScore(
        ligand_smiles=ASPIRIN,
        binding_affinity_kcal=-8.5,
        confidence_interval=(-9.0, -8.0),
        quantum_shot_variance=0.004,
        pose_rank=1,
    )


def make_admet(passes: bool = True) -> ADMETResult:
    return ADMETResult(
        ligand_smiles=ASPIRIN,
        molecular_weight=180.16, logp=1.19, tpsa=63.6,
        hbd=1, hba=3, synthetic_accessibility=1.8,
        qed_score=0.54, lipinski_violations=0,
        herg_risk=False, cyp450_soft_spots=[],
        passes=passes, failure_reasons=[] if passes else ["test_reason"],
    )


class TestMolecularFragment:
    def test_basic_creation(self):
        f = make_fragment()
        assert f.smiles == "c1ccccc1"
        assert f.fragment_id == "F001"
        assert f.rotatable_bonds == 0

    def test_adjacent_fragments_tuple(self):
        f = make_fragment()
        assert isinstance(f.adjacent_fragments, tuple)

    def test_extra_field_forbidden(self):
        with pytest.raises(Exception):
            MolecularFragment(
                fragment_id="F", smiles="C", parent_ligand_smiles="C",
                atom_indices=(), adjacent_fragments=(), rotatable_bonds=0,
                unknown_field="x",
            )


class TestVQEDescriptors:
    def test_basic(self):
        d = make_vqe()
        assert d.homo_energy_ev == -9.5
        assert d.qubit_count == 6
        assert d.cached is False

    def test_cached_flag(self):
        d = make_vqe()
        d2 = d.model_copy(update={"cached": True})
        assert d2.cached is True

    def test_dmet_optional(self):
        d = make_vqe()
        assert d.dmet_impurity_size is None

    def test_qubit_count_ge1(self):
        with pytest.raises(Exception):
            VQEDescriptors(
                fragment_id="F", homo_energy_ev=-9.5, lumo_energy_ev=-1.2,
                homo_lumo_gap_ev=8.3, chemical_hardness_ev=4.15, esp_charges=[],
                ground_state_energy_hartree=-382.6,
                qubit_count=0, gate_count=1, vqe_iterations=1,
            )


class TestQUBOPlacement:
    def test_basic(self):
        p = make_placement()
        assert p.fragment_id == "F001"
        assert p.grid_site_index == 0
        assert p.clash_penalty == 0.0

    def test_clash_non_negative(self):
        with pytest.raises(Exception):
            QUBOPlacement(
                fragment_id="F", grid_site_index=0,
                binary_variable_assignment=[0],
                interaction_energy_kcal=-1.0, clash_penalty=-1.0,
            )


class TestDockingPose:
    def test_basic(self):
        p = make_pose()
        assert p.ligand_smiles == ASPIRIN
        assert p.total_qubo_energy == -8.0
        assert p.qaoa_approximation_ratio == 0.85

    def test_approx_ratio_bounded(self):
        with pytest.raises(Exception):
            DockingPose(
                ligand_smiles=ASPIRIN, fragment_placements=[],
                total_qubo_energy=-1.0, qaoa_approximation_ratio=1.5,
                qaoa_params_beta=[], qaoa_params_gamma=[], dc_qaoa_alpha=0.5,
            )


class TestVQCScore:
    def test_basic(self):
        s = make_vqc_score()
        assert s.binding_affinity_kcal == -8.5
        assert len(s.confidence_interval) == 2

    def test_shot_variance_non_negative(self):
        with pytest.raises(Exception):
            VQCScore(
                ligand_smiles=ASPIRIN, binding_affinity_kcal=-8.0,
                confidence_interval=(-9.0, -7.0), quantum_shot_variance=-0.1,
                pose_rank=1,
            )


class TestADMETResult:
    def test_passing(self):
        r = make_admet(passes=True)
        assert r.passes is True
        assert len(r.failure_reasons) == 0

    def test_failing(self):
        r = make_admet(passes=False)
        assert r.passes is False
        assert len(r.failure_reasons) >= 1

    def test_qed_bounded(self):
        with pytest.raises(Exception):
            ADMETResult(
                ligand_smiles=ASPIRIN, molecular_weight=180.0, logp=1.2,
                tpsa=60.0, hbd=1, hba=3, synthetic_accessibility=2.0,
                qed_score=1.5, lipinski_violations=0, herg_risk=False,
                cyp450_soft_spots=[], passes=True, failure_reasons=[],
            )


class TestScaffoldIteration:
    def test_basic(self):
        si = ScaffoldIteration(
            iteration=2, input_smiles=ASPIRIN, output_smiles=IBUPROFEN,
            reason_for_hop="logp_reduction", replaced_fragment_id="F001",
            replacement_fragment_smiles="c1ccncc1",
            warm_start_beta=[0.3, 0.2], warm_start_gamma=[0.5, 0.4],
        )
        assert si.iteration == 2
        assert si.replaced_fragment_id == "F001"

    def test_iteration_ge0(self):
        with pytest.raises(Exception):
            ScaffoldIteration(
                iteration=-1, input_smiles=ASPIRIN, output_smiles=IBUPROFEN,
                reason_for_hop="test", replaced_fragment_id="F",
                replacement_fragment_smiles="C", warm_start_beta=[], warm_start_gamma=[],
            )


class TestPharmaCandidate:
    def test_basic(self):
        c = PharmaCandidate(
            rank=1, smiles=ASPIRIN, docking_pose=make_pose(),
            vqc_score=make_vqc_score(), admet=make_admet(),
            descriptors=[make_vqe()], scaffold_history=[],
        )
        assert c.rank == 1
        assert c.admet.qed_score == 0.54

    def test_rank_ge1(self):
        with pytest.raises(Exception):
            PharmaCandidate(
                rank=0, smiles=ASPIRIN, docking_pose=make_pose(),
                vqc_score=make_vqc_score(), admet=make_admet(),
                descriptors=[], scaffold_history=[],
            )
