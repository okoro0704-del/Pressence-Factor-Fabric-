"""
Noise reduction, palm segmentation, ROI extraction for palmprint and vein.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional, Tuple

import numpy as np

try:
    import cv2
except ImportError:
    cv2 = None

from ..config import (
    ROI_PALMPRINT_SIZE,
    ROI_VEIN_SIZE,
    NOISE_REDUCTION_KERNEL,
    SEGMENTATION_CONFIDENCE,
    NORMALIZE_PERCENTILE,
)


@dataclass
class PalmPreprocessResult:
    """Preprocessed ROIs and geometry features."""
    palmprint_roi: np.ndarray       # fixed size, normalized
    vein_roi: np.ndarray           # fixed size, normalized
    geometry_vector: np.ndarray    # hand shape/size/finger spacing
    palm_bbox: Optional[Tuple[int, int, int, int]] = None
    success: bool = True


def _noise_reduce(img: np.ndarray) -> np.ndarray:
    if cv2 is None:
        return img
    if img.ndim == 3:
        return cv2.GaussianBlur(img, NOISE_REDUCTION_KERNEL, 0)
    return cv2.GaussianBlur(img, NOISE_REDUCTION_KERNEL, 0)


def _segment_palm_rgb(rgb: np.ndarray) -> Optional[Tuple[int, int, int, int]]:
    """Rough palm region: skin color + contour. Returns (x, y, w, h) or None."""
    if cv2 is None or rgb is None:
        return None
    hsv = cv2.cvtColor(rgb, cv2.COLOR_BGR2HSV)
    # Skin range (tune for palm under typical lighting)
    low = np.array([0, 30, 60], dtype=np.uint8)
    high = np.array([25, 255, 255], dtype=np.uint8)
    mask = cv2.inRange(hsv, low, high)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8))
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        # Fallback: center crop 60% as palm
        h, w = rgb.shape[:2]
        x = int(w * 0.2)
        y = int(h * 0.2)
        return (x, y, int(w * 0.6), int(h * 0.6))
    largest = max(contours, key=cv2.contourArea)
    x, y, w, h = cv2.boundingRect(largest)
    if w < 30 or h < 30:
        h, w = rgb.shape[:2]
        return (int(w * 0.2), int(h * 0.2), int(w * 0.6), int(h * 0.6))
    return (x, y, w, h)


def _segment_palm_ir(ir: np.ndarray) -> Optional[Tuple[int, int, int, int]]:
    """Palm region from IR: threshold + largest blob."""
    if cv2 is None or ir is None:
        return None
    if ir.ndim == 3:
        ir = ir.squeeze()
    _, th = cv2.threshold(ir, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    contours, _ = cv2.findContours(th, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        h, w = ir.shape[:2]
        return (int(w * 0.2), int(h * 0.2), int(w * 0.6), int(h * 0.6))
    largest = max(contours, key=cv2.contourArea)
    return cv2.boundingRect(largest)


def _normalize_roi(roi: np.ndarray, target_size: Tuple[int, int], percentile: Tuple[float, float] = (2, 98)) -> np.ndarray:
    """Resize and contrast-normalize ROI."""
    if cv2 is None:
        return np.asarray(roi)
    if roi.ndim == 3 and roi.shape[-1] == 1:
        roi = roi.squeeze(-1)
    if roi.ndim == 2:
        lo, hi = np.percentile(roi, percentile)
        roi = np.clip((roi.astype(np.float32) - lo) / (hi - lo + 1e-8), 0, 1)
        roi = (roi * 255).astype(np.uint8)
    roi = cv2.resize(roi, target_size)
    if roi.ndim == 2:
        roi = np.expand_dims(roi, axis=-1)
    return roi.astype(np.float32) / 255.0


def extract_roi(
    rgb: np.ndarray,
    ir: Optional[np.ndarray],
    palm_bbox: Optional[Tuple[int, int, int, int]] = None,
) -> Tuple[np.ndarray, np.ndarray]:
    """Extract palmprint ROI from RGB and vein ROI from IR."""
    if palm_bbox is None:
        palm_bbox = _segment_palm_rgb(rgb)
    if palm_bbox is None:
        h, w = rgb.shape[:2]
        palm_bbox = (int(w * 0.2), int(h * 0.2), int(w * 0.6), int(h * 0.6))
    x, y, w, h = palm_bbox
    palmprint_crop = rgb[y : y + h, x : x + w]
    palmprint_crop = _noise_reduce(palmprint_crop)
    palmprint_roi = _normalize_roi(palmprint_crop, ROI_PALMPRINT_SIZE, NORMALIZE_PERCENTILE)
    if palmprint_roi.ndim == 2:
        palmprint_roi = np.stack([palmprint_roi] * 3, axis=-1)

    if ir is not None:
        # Align IR to same bbox (resize ir to rgb size then crop, or scale bbox)
        if ir.shape[:2] != rgb.shape[:2]:
            ir_resized = cv2.resize(ir.squeeze(), (rgb.shape[1], rgb.shape[0])) if cv2 else ir
            if ir_resized.ndim == 2:
                ir_resized = np.expand_dims(ir_resized, -1)
        else:
            ir_resized = ir
        vein_crop = ir_resized[y : y + h, x : x + w]
        if vein_crop.ndim == 3:
            vein_crop = vein_crop.squeeze()
        vein_crop = _noise_reduce(vein_crop)
        vein_roi = _normalize_roi(vein_crop, ROI_VEIN_SIZE, NORMALIZE_PERCENTILE)
        if vein_roi.ndim == 2:
            vein_roi = np.expand_dims(vein_roi, axis=-1)
    else:
        vein_roi = np.zeros((*ROI_VEIN_SIZE[::-1], 1), dtype=np.float32)

    return palmprint_roi, vein_roi


def _geometry_features(
    rgb: np.ndarray,
    palm_bbox: Optional[Tuple[int, int, int, int]],
) -> np.ndarray:
    """Hand geometry: aspect ratio, area ratio, simple shape stats (fixed-dim vector)."""
    if palm_bbox is None:
        return np.zeros(128, dtype=np.float32)  # placeholder dim
    x, y, w, h = palm_bbox
    aspect = w / (h + 1e-8)
    area_ratio = (w * h) / (rgb.shape[0] * rgb.shape[1] + 1e-8)
    # Pad to fixed size for encoder input
    feats = np.array([aspect, area_ratio, w, h, x, y], dtype=np.float32)
    feats = feats / (np.array([3.0, 1.0, 640.0, 480.0, 640.0, 480.0], dtype=np.float32) + 1e-8)
    out = np.zeros(128, dtype=np.float32)
    out[: min(6, len(out))] = feats[:6]
    return out


def preprocess_palm(
    rgb: np.ndarray,
    ir: Optional[np.ndarray] = None,
    depth: Optional[np.ndarray] = None,
) -> PalmPreprocessResult:
    """
    Full preprocessing: noise reduction, palm segmentation, ROI extraction, geometry.
    """
    palm_bbox = _segment_palm_rgb(rgb)
    palmprint_roi, vein_roi = extract_roi(rgb, ir, palm_bbox)
    geometry_vector = _geometry_features(rgb, palm_bbox)
    return PalmPreprocessResult(
        palmprint_roi=palmprint_roi,
        vein_roi=vein_roi,
        geometry_vector=geometry_vector,
        palm_bbox=palm_bbox,
        success=True,
    )
