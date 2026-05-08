"""QUBO matrix construction and QUBO→Ising conversion for fragment docking."""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np


@dataclass(frozen=True)
class IsingHamiltonian:
    """Ising parameters derived from QUBO via x = (1 - σ^z) / 2."""

    h: np.ndarray       # Linear biases, shape (n,)
    J: np.ndarray       # Coupling matrix, shape (n, n) upper-triangular
    constant: float     # Energy offset


def qubo_to_ising(Q: np.ndarray) -> IsingHamiltonian:
    """Convert symmetric QUBO matrix Q to Ising h, J, constant.

    Derivation: x = (1 - σ^z) / 2
      h_i     = -Q_ii/2 - (1/2) Σ_{j≠i} Q_ij
      J_ij    = Q_ij / 4
      constant = Σ_i Q_ii/2 + Σ_{i<j} Q_ij/2
    """
    n = Q.shape[0]
    h = np.zeros(n)
    J = np.zeros((n, n))
    constant = 0.0

    for i in range(n):
        h[i] = -Q[i, i] / 2.0
        for j in range(n):
            if j != i:
                h[i] -= Q[i, j] / 2.0
        constant += Q[i, i] / 2.0

    for i in range(n):
        for j in range(i + 1, n):
            J[i, j] = Q[i, j] / 4.0
            constant += Q[i, j] / 2.0

    return IsingHamiltonian(h=h, J=J, constant=constant)


def build_qubo_matrix(
    *,
    n_fragments: int,
    n_sites: int,
    interaction_energies: np.ndarray,   # shape (n_fragments, n_sites)
    clash_matrix: np.ndarray,            # shape (n_sites, n_sites)
    bond_pairs: list[tuple[int, int]],   # adjacent fragment index pairs
    one_hot_penalty: float = 10.0,
    clash_penalty: float = 5.0,
    bond_penalty: float = 3.0,
) -> np.ndarray:
    """Build QUBO matrix for fragment-based docking.

    Variable layout: x[frag * n_sites + site] ∈ {0, 1}
    Objective minimizes interaction energy subject to:
      1) One-hot: each fragment placed at exactly one site
      2) Clash: penalize placing two fragments at overlapping sites
      3) Bond geometry: penalize large spatial gaps between bonded fragments
    """
    n_vars = n_fragments * n_sites
    Q = np.zeros((n_vars, n_vars))

    # Term 1: Interaction energies (diagonal)
    for f in range(n_fragments):
        for s in range(n_sites):
            idx = f * n_sites + s
            Q[idx, idx] += interaction_energies[f, s]

    # Term 2: One-hot penalty — each fragment must occupy exactly one site
    for f in range(n_fragments):
        for s1 in range(n_sites):
            for s2 in range(s1 + 1, n_sites):
                i = f * n_sites + s1
                j = f * n_sites + s2
                Q[i, j] += one_hot_penalty
                Q[j, i] += one_hot_penalty

    # Term 3: Clash penalty — penalize two different fragments at clashing sites
    for f1 in range(n_fragments):
        for f2 in range(f1 + 1, n_fragments):
            for s1 in range(n_sites):
                for s2 in range(n_sites):
                    if clash_matrix[s1, s2] > 0:
                        i = f1 * n_sites + s1
                        j = f2 * n_sites + s2
                        Q[i, j] += clash_penalty * clash_matrix[s1, s2]
                        Q[j, i] += clash_penalty * clash_matrix[s1, s2]

    # Term 4: Bond geometry — adjacent fragments should be at spatially close sites
    for f1, f2 in bond_pairs:
        for s1 in range(n_sites):
            for s2 in range(n_sites):
                if s1 != s2:
                    i = f1 * n_sites + s1
                    j = f2 * n_sites + s2
                    Q[i, j] += bond_penalty
                    Q[j, i] += bond_penalty

    return Q
