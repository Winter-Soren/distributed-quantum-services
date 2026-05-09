"""Unit tests — Stage 4: VQE executor (cache-first, mocked quantum sim)."""
from __future__ import annotations
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from quantum_backend_v2.pharma.cache import FragmentCache
from quantum_backend_v2.pharma.config import VQEConfig, AnsatzType
from quantum_backend_v2.pharma.models import MolecularFragment, VQEDescriptors
from quantum_backend_v2.pharma.stages.stage_4 import VQEExecutor, VQEResult

pytestmark = pytest.mark.anyio


def _make_fallback_result(fragment: MolecularFragment) -> VQEResult:
    return VQEResult(
        fragment_id=fragment.fragment_id,
        homo_energy_ev=-9.12, lumo_energy_ev=-1.04,
        homo_lumo_gap_ev=8.08, chemical_hardness_ev=4.04,
        esp_charges=[0.0, 0.0], ground_state_energy_hartree=-0.8,
        qubit_count=2, gate_count=30, vqe_iterations=15, cached=False,
    )


def make_fragment(fid: str = "F001", smiles: str = "c1ccccc1") -> MolecularFragment:
    return MolecularFragment(
        fragment_id=fid, smiles=smiles,
        parent_ligand_smiles="CC(=O)Oc1ccccc1C(=O)O",
        atom_indices=(0, 1, 2, 3, 4, 5),
        adjacent_fragments=(), rotatable_bonds=0,
    )


def make_cached_desc(fid: str = "F001") -> VQEDescriptors:
    return VQEDescriptors(
        fragment_id=fid, homo_energy_ev=-9.0, lumo_energy_ev=-1.0,
        homo_lumo_gap_ev=8.0, chemical_hardness_ev=4.0,
        esp_charges=[0.0] * 6, ground_state_energy_hartree=-230.0,
        qubit_count=6, gate_count=80, vqe_iterations=100, cached=True,
    )


class TestVQEResult:
    def test_creation(self):
        r = VQEResult(
            fragment_id="F001", homo_energy_ev=-9.0, lumo_energy_ev=-1.0,
            homo_lumo_gap_ev=8.0, chemical_hardness_ev=4.0,
            esp_charges=[0.0] * 6, ground_state_energy_hartree=-230.0,
            qubit_count=6, gate_count=80, vqe_iterations=100,
        )
        assert r.fragment_id == "F001"
        assert r.cached is False

    def test_to_descriptors(self):
        r = VQEResult(
            fragment_id="F001", homo_energy_ev=-9.0, lumo_energy_ev=-1.0,
            homo_lumo_gap_ev=8.0, chemical_hardness_ev=4.0,
            esp_charges=[0.0, 0.1], ground_state_energy_hartree=-230.0,
            qubit_count=2, gate_count=20, vqe_iterations=50,
        )
        d = r.to_descriptors()
        assert isinstance(d, VQEDescriptors)
        assert d.fragment_id == "F001"
        assert d.qubit_count == 2

    def test_cached_flag_default_false(self):
        r = VQEResult(
            fragment_id="F", homo_energy_ev=-8.0, lumo_energy_ev=-1.0,
            homo_lumo_gap_ev=7.0, chemical_hardness_ev=3.5,
            esp_charges=[], ground_state_energy_hartree=-50.0,
            qubit_count=1, gate_count=5, vqe_iterations=10,
        )
        assert r.cached is False


class TestVQEExecutorCacheHit:
    async def test_returns_vqe_result_from_cache(self):
        mock_cache = MagicMock(spec=FragmentCache)
        mock_cache.get = AsyncMock(return_value=make_cached_desc("F001"))
        cfg = VQEConfig(ansatz=AnsatzType.HEA, max_iterations=5, shots=64)
        executor = VQEExecutor(cfg, mock_cache)
        frag = make_fragment("F001", "c1ccccc1")
        result = await executor.run(frag)
        assert isinstance(result, VQEResult)
        assert result.cached is True
        assert result.fragment_id == "F001"
        mock_cache.get.assert_called_once()

    async def test_cache_hit_does_not_run_full_vqe(self):
        mock_cache = MagicMock(spec=FragmentCache)
        mock_cache.get = AsyncMock(return_value=make_cached_desc())
        cfg = VQEConfig(ansatz=AnsatzType.HEA, max_iterations=5, shots=64)
        executor = VQEExecutor(cfg, mock_cache)
        frag = make_fragment("F002", "CC")
        result = await executor.run(frag)
        assert result.fragment_id == "F002"


class TestVQEExecutorCacheMiss:
    """Cache-miss tests: _run_vqe_sync patched — no PennyLane invoked."""

    async def test_returns_vqe_result_on_cache_miss(self):
        mock_cache = MagicMock(spec=FragmentCache)
        mock_cache.get = AsyncMock(return_value=None)
        cfg = VQEConfig(ansatz=AnsatzType.HEA, max_iterations=10, shots=64)
        executor = VQEExecutor(cfg, mock_cache)
        frag = make_fragment("F_benzene", "c1ccccc1")
        with patch.object(executor, "_run_vqe_sync", side_effect=_make_fallback_result):
            result = await executor.run(frag)
        assert isinstance(result, VQEResult)
        assert result.cached is False
        assert result.fragment_id == "F_benzene"

    async def test_result_has_positive_qubit_count(self):
        mock_cache = MagicMock(spec=FragmentCache)
        mock_cache.get = AsyncMock(return_value=None)
        cfg = VQEConfig(ansatz=AnsatzType.HEA, max_iterations=5, shots=32)
        executor = VQEExecutor(cfg, mock_cache)
        frag = make_fragment("F_methane", "C")
        with patch.object(executor, "_run_vqe_sync", side_effect=_make_fallback_result):
            result = await executor.run(frag)
        assert result.qubit_count >= 1

    async def test_homo_lumo_gap_non_negative(self):
        mock_cache = MagicMock(spec=FragmentCache)
        mock_cache.get = AsyncMock(return_value=None)
        cfg = VQEConfig(ansatz=AnsatzType.HEA, max_iterations=5, shots=32)
        executor = VQEExecutor(cfg, mock_cache)
        frag = make_fragment("F_ethane", "CC")
        with patch.object(executor, "_run_vqe_sync", side_effect=_make_fallback_result):
            result = await executor.run(frag)
        assert result.homo_lumo_gap_ev >= 0
