"""Unit tests — PharmaWorkflowConfig and sub-configs."""
from __future__ import annotations
import pytest
from pydantic import ValidationError
from quantum_backend_v2.pharma.config import (
    AnsatzType, PharmaMode, PharmaWorkflowConfig, QAOAConfig,
    QWGANConfig, TargetProperties, VQEConfig,
)


class TestPharmaMode:
    def test_optimization_value(self):
        assert PharmaMode.OPTIMIZATION == "optimization"

    def test_discovery_value(self):
        assert PharmaMode.DISCOVERY == "discovery"


class TestVQEConfig:
    def test_defaults(self):
        cfg = VQEConfig()
        assert cfg.ansatz == AnsatzType.UCCSD
        assert cfg.embedding == "dmet"
        assert cfg.basis_set == "sto-3g"
        assert cfg.max_iterations == 200
        assert cfg.shots == 1024

    def test_hea_ansatz(self):
        cfg = VQEConfig(ansatz=AnsatzType.HEA)
        assert cfg.ansatz == AnsatzType.HEA

    def test_lucj_ansatz(self):
        cfg = VQEConfig(ansatz=AnsatzType.LUCJ)
        assert cfg.ansatz == AnsatzType.LUCJ

    def test_shots_min_1(self):
        with pytest.raises(ValidationError):
            VQEConfig(shots=0)


class TestQAOAConfig:
    def test_defaults(self):
        cfg = QAOAConfig()
        assert cfg.layers == 1
        assert cfg.use_counterdiabatic is True
        assert cfg.cd_alpha == 0.5

    def test_cd_alpha_bounds(self):
        with pytest.raises(ValidationError):
            QAOAConfig(cd_alpha=-0.1)
        with pytest.raises(ValidationError):
            QAOAConfig(cd_alpha=2.1)

    def test_layers_min_1(self):
        with pytest.raises(ValidationError):
            QAOAConfig(layers=0)


class TestQWGANConfig:
    def test_defaults(self):
        cfg = QWGANConfig()
        assert cfg.num_qubits == 15
        assert cfg.use_rl_agents is True
        assert "qed" in cfg.rl_objectives

    def test_qubit_bounds(self):
        with pytest.raises(ValidationError):
            QWGANConfig(num_qubits=3)
        with pytest.raises(ValidationError):
            QWGANConfig(num_qubits=26)


class TestPharmaWorkflowConfig:
    def test_optimization_mode(self):
        cfg = PharmaWorkflowConfig(
            mode=PharmaMode.OPTIMIZATION,
            target_pdb_id="6LU7",
            initial_ligand_smiles="CC(C)Cc1ccc(cc1)C(C)C(O)=O",
        )
        assert cfg.mode == PharmaMode.OPTIMIZATION
        assert cfg.max_iterations == 5
        assert cfg.iterative is True
        assert cfg.candidate_count == 100

    def test_discovery_mode_with_target_props(self):
        cfg = PharmaWorkflowConfig(
            mode=PharmaMode.DISCOVERY,
            target_pdb_id="1ABC",
            target_properties=TargetProperties(max_molecular_weight=450.0, min_qed=0.6),
            candidate_count=50,
        )
        assert cfg.candidate_count == 50
        assert cfg.target_properties.max_molecular_weight == 450.0

    def test_pdb_id_too_short(self):
        with pytest.raises(ValidationError):
            PharmaWorkflowConfig(mode=PharmaMode.OPTIMIZATION, target_pdb_id="AB")

    def test_pdb_id_too_long(self):
        with pytest.raises(ValidationError):
            PharmaWorkflowConfig(mode=PharmaMode.OPTIMIZATION, target_pdb_id="ABCDEFGHIJK")

    def test_max_iterations_bounds(self):
        with pytest.raises(ValidationError):
            PharmaWorkflowConfig(mode=PharmaMode.OPTIMIZATION, target_pdb_id="6LU7", max_iterations=0)
        with pytest.raises(ValidationError):
            PharmaWorkflowConfig(mode=PharmaMode.OPTIMIZATION, target_pdb_id="6LU7", max_iterations=21)

    def test_nested_vqe_config_accessible(self):
        cfg = PharmaWorkflowConfig(mode=PharmaMode.OPTIMIZATION, target_pdb_id="6LU7")
        assert cfg.vqe.ansatz == AnsatzType.UCCSD
        assert cfg.qaoa.use_counterdiabatic is True
        assert cfg.qwgan.num_qubits == 15

    def test_no_extra_fields(self):
        with pytest.raises(ValidationError):
            PharmaWorkflowConfig(
                mode=PharmaMode.OPTIMIZATION, target_pdb_id="6LU7", unknown_field="x"
            )
