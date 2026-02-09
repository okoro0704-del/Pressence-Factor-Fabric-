"""
Multi-modal fusion: RGB + depth + liveness + motion.
Weighted or attention-based combination for final similarity/liveness score.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Optional

import numpy as np


@dataclass
class FusionResult:
    """Fused score and per-modality contributions."""
    score: float  # 0..1
    components: Dict[str, float]
    decision: str  # "accept" | "reject" | "re_verify"


def fuse_signals(
    rgb_embedding: np.ndarray,
    reference_embedding: np.ndarray,
    liveness_score: float,
    depth_embedding: Optional[np.ndarray] = None,
    reference_depth_embedding: Optional[np.ndarray] = None,
    motion_consistency: float = 0.5,
    weights: Optional[Dict[str, float]] = None,
) -> FusionResult:
    """
    Fuse: similarity(rgb, ref) + depth similarity + liveness + motion.
    Weights default to config (rgb 0.4, depth 0.25, liveness 0.2, motion 0.15).
    """
    if weights is None:
        weights = {
            "rgb_embedding": 0.40,
            "depth_embedding": 0.25,
            "liveness_score": 0.20,
            "motion_consistency": 0.15,
        }

    # Cosine similarity RGB
    rgb_sim = float(
        np.dot(rgb_embedding, reference_embedding)
        / (np.linalg.norm(rgb_embedding) * np.linalg.norm(reference_embedding) + 1e-8)
    )
    rgb_sim = (rgb_sim + 1) / 2  # map [-1,1] -> [0,1]

    comp = {"rgb_embedding": rgb_sim, "liveness_score": liveness_score, "motion_consistency": motion_consistency}
    depth_sim = 0.5
    if (
        depth_embedding is not None
        and reference_depth_embedding is not None
        and depth_embedding.size > 0
    ):
        depth_sim = float(
            np.dot(depth_embedding, reference_depth_embedding)
            / (
                np.linalg.norm(depth_embedding)
                * np.linalg.norm(reference_depth_embedding)
                + 1e-8
            )
        )
        depth_sim = (depth_sim + 1) / 2
    comp["depth_embedding"] = depth_sim

    score = (
        weights["rgb_embedding"] * comp["rgb_embedding"]
        + weights["depth_embedding"] * comp["depth_embedding"]
        + weights["liveness_score"] * comp["liveness_score"]
        + weights["motion_consistency"] * comp["motion_consistency"]
    )
    score = float(np.clip(score, 0, 1))

    if score >= 0.85:
        decision = "accept"
    elif score <= 0.45:
        decision = "reject"
    else:
        decision = "re_verify"

    return FusionResult(score=score, components=comp, decision=decision)
