"""Unit tests — QUBO matrix builder + Ising conversion (real signatures)."""
from __future__ import annotations
import numpy as np
import pytest
from quantum_backend_v2.pharma.qubo_builder import IsingHamiltonian, build_qubo_matrix, qubo_to_ising


def make_qubo(n_fragments: int = 2, n_sites: int = 3) -> np.ndarray:
    interaction = np.random.uniform(-1, 0, (n_fragments, n_sites))
    clash = np.zeros((n_sites, n_sites))
    clash[0, 0] = 1.0  # site 0 clashes with itself (if two fragments)
    return build_qubo_matrix(
        n_fragments=n_fragments,
        n_sites=n_sites,
        interaction_energies=interaction,
        clash_matrix=clash,
        bond_pairs=[],
    )


class TestQUBOBuilder:
    def test_returns_numpy_array(self):
        Q = make_qubo()
        assert isinstance(Q, np.ndarray)

    def test_square_matrix(self):
        Q = make_qubo(3, 4)
        assert Q.shape[0] == Q.shape[1]

    def test_size_is_fragments_times_sites(self):
        Q = make_qubo(n_fragments=2, n_sites=3)
        assert Q.shape == (6, 6)

    def test_symmetry(self):
        Q = make_qubo(n_fragments=3, n_sites=4)
        np.testing.assert_allclose(Q, Q.T, atol=1e-10)

    def test_single_fragment(self):
        interaction = np.array([[-2.0, -1.5, -1.0]])
        clash = np.zeros((3, 3))
        Q = build_qubo_matrix(
            n_fragments=1, n_sites=3,
            interaction_energies=interaction,
            clash_matrix=clash, bond_pairs=[],
        )
        assert Q.shape == (3, 3)

    def test_bond_pair_adds_off_diagonal(self):
        interaction = np.ones((2, 2)) * -1.0
        clash = np.zeros((2, 2))
        Q_no_bond = build_qubo_matrix(
            n_fragments=2, n_sites=2, interaction_energies=interaction,
            clash_matrix=clash, bond_pairs=[],
        )
        Q_bond = build_qubo_matrix(
            n_fragments=2, n_sites=2, interaction_energies=interaction,
            clash_matrix=clash, bond_pairs=[(0, 1)],
        )
        # Bond penalty should make some off-diagonals larger
        assert not np.allclose(Q_no_bond, Q_bond)

    def test_one_hot_penalty_increases_off_diagonal(self):
        interaction = np.ones((1, 3)) * -1.0
        clash = np.zeros((3, 3))
        Q = build_qubo_matrix(
            n_fragments=1, n_sites=3, interaction_energies=interaction,
            clash_matrix=clash, bond_pairs=[], one_hot_penalty=100.0,
        )
        # Off-diagonal within fragment block should reflect penalty
        assert Q[0, 1] == pytest.approx(100.0)

    def test_clash_penalty_applied(self):
        interaction = np.ones((2, 2)) * -1.0
        clash = np.array([[1.0, 0.0], [0.0, 0.0]])
        Q = build_qubo_matrix(
            n_fragments=2, n_sites=2, interaction_energies=interaction,
            clash_matrix=clash, bond_pairs=[], clash_penalty=50.0,
        )
        # Fragment 0 site 0 vs Fragment 1 site 0 should carry clash
        assert Q[0, 2] != 0.0 or Q[2, 0] != 0.0


class TestQUBOToIsing:
    def test_returns_ising_hamiltonian(self):
        Q = np.array([[-2.0, 0.5], [0.5, -1.5]])
        ising = qubo_to_ising(Q)
        assert isinstance(ising, IsingHamiltonian)

    def test_offset_is_float(self):
        Q = np.array([[-2.0, 0.5], [0.5, -1.5]])
        ising = qubo_to_ising(Q)
        assert isinstance(ising.constant, float)

    def test_h_length_matches_n(self):
        n = 4
        Q = np.eye(n) * -2.0
        ising = qubo_to_ising(Q)
        assert len(ising.h) == n

    def test_j_shape(self):
        n = 3
        Q = np.eye(n) * -2.0
        ising = qubo_to_ising(Q)
        assert ising.J.shape == (n, n)

    def test_single_qubit(self):
        Q = np.array([[-3.0]])
        ising = qubo_to_ising(Q)
        assert len(ising.h) == 1

    def test_3x3_ising(self):
        Q = np.array([[-3.0, 1.0, 0.5], [1.0, -2.0, 0.3], [0.5, 0.3, -1.5]])
        ising = qubo_to_ising(Q)
        assert len(ising.h) == 3
        assert ising.J.shape == (3, 3)

    def test_diagonal_qubo_gives_zero_j_couplings(self):
        Q = np.diag([-2.0, -1.5, -3.0])
        ising = qubo_to_ising(Q)
        # Upper triangular J should be all zeros for diagonal QUBO
        upper = ising.J[np.triu_indices(3, k=1)]
        np.testing.assert_allclose(upper, 0.0, atol=1e-12)
