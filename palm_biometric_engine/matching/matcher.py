"""
Match probe identity vector to reference(s). Cosine similarity; optional euclidean.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional

import numpy as np

from ..config import MATCHING_METRIC, ACCEPT_THRESHOLD, REJECT_THRESHOLD


@dataclass
class MatchResult:
    """Similarity score and match decision."""
    score: float
    match: bool
    metric: str


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Cosine similarity in [0, 1] (assuming L2-normalized vectors)."""
    a = np.asarray(a, dtype=np.float64).ravel()
    b = np.asarray(b, dtype=np.float64).ravel()
    if len(a) != len(b):
        b = np.pad(b, (0, max(0, len(a) - len(b))))[: len(a)]
    dot = np.dot(a, b)
    na, nb = np.linalg.norm(a), np.linalg.norm(b)
    if na < 1e-10 or nb < 1e-10:
        return 0.0
    sim = dot / (na * nb)
    return float(np.clip((sim + 1) / 2, 0, 1))


def match_identity(
    probe: np.ndarray,
    reference: np.ndarray,
    threshold: Optional[float] = None,
    metric: Optional[str] = None,
) -> MatchResult:
    """
    Compare probe identity vector to single reference.
    Returns score and boolean match (above accept threshold).
    """
    threshold = threshold or ACCEPT_THRESHOLD
    metric = metric or MATCHING_METRIC
    if metric == "cosine":
        score = cosine_similarity(probe, reference)
    else:
        # euclidean: convert to similarity in [0,1]; smaller dist = higher sim
        dist = np.linalg.norm(np.asarray(probe).ravel() - np.asarray(reference).ravel())
        score = float(np.clip(1.0 / (1.0 + dist), 0, 1))
    return MatchResult(score=score, match=score >= threshold, metric=metric)


def match_identity_1_to_n(probe: np.ndarray, references: List[np.ndarray], threshold: Optional[float] = None) -> tuple[bool, float, int]:
    """Return (any_match, best_score, best_index)."""
    best_score = 0.0
    best_idx = -1
    for i, ref in enumerate(references):
        r = match_identity(probe, ref, threshold=threshold)
        if r.score > best_score:
            best_score = r.score
            best_idx = i
    return best_score >= (threshold or ACCEPT_THRESHOLD), best_score, best_idx
