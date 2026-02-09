"""
Liveness: texture (ridges/surface), IR response (vein-like), geometry consistency.
Detects photos, printed palms, silicone molds.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

import numpy as np

try:
    import cv2
except ImportError:
    cv2 = None

from ..config import (
    LIVENESS_TEXTURE_MIN,
    LIVENESS_IR_RESPONSE_MIN,
    LIVENESS_GEOMETRY_CONSISTENCY,
)


@dataclass
class PalmLivenessResult:
    """Liveness score and per-cue breakdown."""
    is_live: bool
    score: float
    texture_score: float
    ir_response_score: float
    geometry_score: float
    details: str = ""


def _texture_score(palmprint_roi: np.ndarray) -> float:
    """Laplacian variance: real skin has ridges/texture; flat print is low."""
    if cv2 is None or palmprint_roi.size == 0:
        return 0.5
    if palmprint_roi.ndim == 3:
        gray = cv2.cvtColor((palmprint_roi * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)
    else:
        gray = (palmprint_roi * 255).astype(np.uint8)
    lap = cv2.Laplacian(gray, cv2.CV_64F)
    var = lap.var()
    return float(np.clip(var / 500.0, 0, 1))  # scale heuristically


def _ir_response_score(vein_roi: np.ndarray) -> float:
    """IR should show vein-like structure (variance, not flat)."""
    if vein_roi.size == 0:
        return 0.5
    v = vein_roi.squeeze()
    if v.ndim == 0:
        return 0.0
    return float(np.clip(np.std(v) * 4, 0, 1))


def _geometry_score(geometry_vector: np.ndarray, prev_geometry: Optional[np.ndarray] = None) -> float:
    """Consistency with previous frame (if any); else neutral."""
    if prev_geometry is None:
        return 0.7
    diff = np.abs(geometry_vector.astype(np.float64) - prev_geometry.astype(np.float64))
    return float(np.clip(1.0 - np.mean(diff) * 2, 0, 1))


def check_palm_liveness(
    palmprint_roi: np.ndarray,
    vein_roi: np.ndarray,
    geometry_vector: np.ndarray,
    prev_geometry: Optional[np.ndarray] = None,
) -> PalmLivenessResult:
    """
    Aggregate liveness from texture, IR response, geometry consistency.
    """
    ts = _texture_score(palmprint_roi)
    irs = _ir_response_score(vein_roi)
    gs = _geometry_score(geometry_vector, prev_geometry)

    # Hard gate: very flat texture suggests print/photo
    if ts < LIVENESS_TEXTURE_MIN:
        score = 0.0
        details = "texture_below_threshold"
    else:
        score = 0.4 * ts + 0.35 * irs + 0.25 * gs
        details = "ok"
    if irs < LIVENESS_IR_RESPONSE_MIN and vein_roi.size > 0:
        score = min(score, 0.5)
        details = "ir_response_low"

    return PalmLivenessResult(
        is_live=score >= 0.5,
        score=float(np.clip(score, 0, 1)),
        texture_score=ts,
        ir_response_score=irs,
        geometry_score=gs,
        details=details,
    )
