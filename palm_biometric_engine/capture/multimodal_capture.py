"""
Edge device capture: RGB palmprint, IR palm vein, optional depth/ultrasound.
Stubs for real hardware; fallbacks for dev (single camera / synthetic IR).
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
    CAPTURE_RGB_RESOLUTION,
    CAPTURE_IR_RESOLUTION,
    CAPTURE_DEPTH_AVAILABLE,
)


@dataclass
class PalmCaptureResult:
    """One frame of multi-modal palm data."""
    rgb: Optional[np.ndarray] = None      # HxWx3 BGR/RGB palmprint
    ir: Optional[np.ndarray] = None       # HxW IR for vein
    depth: Optional[np.ndarray] = None    # HxW depth if sensor available
    timestamp: float = 0.0
    source: str = "camera"


_capture_backend = "opencv"  # or "realsense", "tof", "synthetic"


def _try_rgb_camera() -> Optional[np.ndarray]:
    """Capture one RGB frame. Prefer back camera for palm (user facing)."""
    if cv2 is None:
        return None
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        return None
    ret, frame = cap.read()
    cap.release()
    if not ret or frame is None:
        return None
    if (frame.shape[1], frame.shape[0]) != CAPTURE_RGB_RESOLUTION:
        frame = cv2.resize(frame, CAPTURE_RGB_RESOLUTION)
    return frame


def _synthetic_ir_from_rgb(rgb: np.ndarray) -> np.ndarray:
    """Simulate IR from RGB for dev (vein-like structure via edge + invert)."""
    if cv2 is None:
        return np.zeros((*CAPTURE_IR_RESOLUTION[::-1], 1), dtype=np.uint8)
    gray = cv2.cvtColor(rgb, cv2.COLOR_BGR2GRAY) if rgb.ndim == 3 else rgb
    gray = cv2.resize(gray, CAPTURE_IR_RESOLUTION)
    # Vein-like: dark vessels on lighter background simulation
    blur = cv2.GaussianBlur(gray, (15, 15), 0)
    ir = cv2.subtract(blur, gray)
    ir = cv2.normalize(ir, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
    return np.expand_dims(ir, axis=-1)


def _try_ir_sensor() -> Optional[np.ndarray]:
    """Try dedicated IR camera (e.g. second device). Returns None if not available."""
    if cv2 is None:
        return None
    cap = cv2.VideoCapture(1)  # often IR on multi-camera setups
    if not cap.isOpened():
        return None
    ret, frame = cap.read()
    cap.release()
    if not ret or frame is None:
        return None
    if frame.ndim == 3:
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    frame = cv2.resize(frame, CAPTURE_IR_RESOLUTION)
    return np.expand_dims(frame, axis=-1)


def _try_depth_sensor() -> Optional[np.ndarray]:
    """Stub: RealSense / ToF / ultrasound depth. Return None if not available."""
    return None


def capture_palm_frames(
    num_frames: int = 1,
    require_ir: bool = False,
) -> list[PalmCaptureResult]:
    """
    Capture one or more multi-modal palm frames.
    RGB always attempted; IR from sensor or synthetic from RGB; depth if configured.
    """
    results = []
    for _ in range(num_frames):
        rgb = _try_rgb_camera()
        ir = _try_ir_sensor()
        if ir is None and rgb is not None:
            ir = _synthetic_ir_from_rgb(rgb)
        depth = _try_depth_sensor() if CAPTURE_DEPTH_AVAILABLE else None
        import time
        results.append(PalmCaptureResult(
            rgb=rgb,
            ir=ir,
            depth=depth,
            timestamp=time.time(),
            source=_capture_backend,
        ))
    return results


def get_capture_backend() -> str:
    return _capture_backend
