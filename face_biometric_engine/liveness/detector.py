"""
Liveness detection: depth consistency, micro-motion, blink, texture.
Prevents photo, video, mask, and deepfake spoofing.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Optional

import numpy as np


@dataclass
class LivenessResult:
    """Aggregated liveness result over a short window."""
    is_live: bool
    score: float  # 0..1
    depth_consistency: float = 0.0
    micro_motion: float = 0.0
    blink_score: float = 0.0
    texture_score: float = 0.0
    details: str = ""


def _depth_consistency_score(depth_maps: List[np.ndarray]) -> float:
    """
    Real faces have stable depth; photos/screens are flat or inconsistent.
    Returns 0 (bad) .. 1 (good). Low variance in depth over time = live.
    """
    if not depth_maps or depth_maps[0] is None:
        return 0.5  # no depth: neutral
    stack = np.stack([d for d in depth_maps if d is not None])
    if stack.size == 0:
        return 0.5
    mean_per_frame = np.mean(stack, axis=(1, 2))
    std_over_time = np.std(mean_per_frame)
    # Moderate stability = live; too flat (0) or chaotic (high) = suspicious
    if std_over_time < 1e-6:
        return 0.2  # too flat
    score = min(1.0, 1.0 / (1.0 + 10 * std_over_time))
    return float(score)


def _micro_motion_score(face_crops: List[np.ndarray]) -> float:
    """
    Small motion between frames (respiration, micro-expressions) = live.
    Static = photo. Returns 0..1.
    """
    if len(face_crops) < 2:
        return 0.5
    diffs = []
    for i in range(1, len(face_crops)):
        a, b = face_crops[i - 1], face_crops[i]
        if a.shape != b.shape:
            continue
        diff = np.abs(a.astype(np.float32) - b.astype(np.float32))
        diffs.append(np.mean(diff))
    if not diffs:
        return 0.5
    variance = float(np.var(diffs))
    return min(1.0, variance * 20.0)


def _blink_score(eye_region_frames: List[np.ndarray]) -> float:
    """
    Pseudocode: detect blink (eye aspect ratio drop) over window.
    Real users blink; photos don't. Returns 0..1.
    """
    if len(eye_region_frames) < 10:
        return 0.5
    # Placeholder: variance in intensity as proxy for blink
    intensities = [np.mean(f) for f in eye_region_frames]
    return min(1.0, float(np.std(intensities)) * 5.0)


def _texture_score(face_rgb: np.ndarray) -> float:
    """
    Flat texture (paper/print) vs skin (fine pores, specular). Returns 0..1.
    High-frequency energy as proxy for real skin texture.
    """
    if face_rgb.size == 0:
        return 0.0
    gray = (
        np.dot(face_rgb[..., :3], [0.299, 0.587, 0.114])
        if face_rgb.ndim == 3 else face_rgb
    )
    # Laplacian variance: low = flat (spoof), high = texture (live)
    lap = np.abs(np.diff(gray, axis=0).astype(np.float32)).sum() + np.abs(
        np.diff(gray, axis=1).astype(np.float32)
    ).sum()
    lap = lap / (gray.size + 1e-8)
    score = min(1.0, lap * 2.0)
    return float(score)


def check_liveness(
    face_rgb_frames: List[np.ndarray],
    depth_frames: Optional[List[Optional[np.ndarray]]] = None,
    eye_region_frames: Optional[List[np.ndarray]] = None,
    depth_consistency_threshold: float = 0.15,
    texture_spoof_threshold: float = 0.35,
    micro_motion_min: float = 0.5,
) -> LivenessResult:
    """
    Fuse depth consistency, micro-motion, blink, texture into one liveness score.
    """
    depth_maps = depth_frames or []
    eye_frames = eye_region_frames or []
    dc = _depth_consistency_score(depth_maps) if depth_maps else 0.5
    mm = _micro_motion_score(face_rgb_frames)
    bl = _blink_score(eye_frames) if eye_frames else 0.5
    tx = _texture_score(face_rgb_frames[-1]) if face_rgb_frames else 0.0

    # Weights (tunable)
    w_dc, w_mm, w_bl, w_tx = 0.25, 0.35, 0.25, 0.15
    score = w_dc * dc + w_mm * mm + w_bl * bl + w_tx * tx

    # Hard checks
    if tx < texture_spoof_threshold:
        score = min(score, 0.4)
        details = "texture_too_flat"
    else:
        details = "ok"
    is_live = score >= 0.5 and tx >= texture_spoof_threshold

    return LivenessResult(
        is_live=is_live,
        score=float(np.clip(score, 0, 1)),
        depth_consistency=dc,
        micro_motion=mm,
        blink_score=bl,
        texture_score=tx,
        details=details,
    )


def collect_liveness_scores(
    face_frames: List[np.ndarray],
    depth_frames: Optional[List[Optional[np.ndarray]]] = None,
) -> float:
    """Convenience: run check_liveness and return single score for fusion."""
    r = check_liveness(face_frames, depth_frames)
    return r.score
