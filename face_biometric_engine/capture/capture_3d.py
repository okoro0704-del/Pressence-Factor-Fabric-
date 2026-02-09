"""
3D face capture: depth sensors (structured light / ToF / LiDAR) with RGB + depth-estimation fallback.
Pseudocode and real structure; depth hardware access is platform-specific (e.g. pyrealsense2, OpenNI).
"""
from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Optional, Tuple

import numpy as np

# Optional: import cv2 only when used (allows headless install)
try:
    import cv2
except ImportError:
    cv2 = None  # type: ignore


@dataclass
class CaptureResult:
    """Single frame result: RGB + optional depth."""
    rgb: np.ndarray      # HxWx3 BGR
    depth: Optional[np.ndarray] = None  # HxW float32 (meters or normalized)
    depth_available: bool = False
    timestamp: float = 0.0
    source: str = "rgb"  # "rgb" | "structured_light" | "tof" | "lidar" | "estimated"


def _estimate_depth_from_rgb(rgb: np.ndarray) -> np.ndarray:
    """
    Fallback depth estimation from RGB (e.g. simple gradient-based or placeholder).
    Production: replace with MiDaS / DPT / or similar lightweight depth estimator.
    """
    if cv2 is None:
        h, w = rgb.shape[:2]
        return np.zeros((h, w), dtype=np.float32)
    gray = cv2.cvtColor(rgb, cv2.COLOR_BGR2GRAY)
    # Placeholder: Laplacian variance as proxy for "depth-like" structure
    lap = cv2.Laplacian(gray, cv2.CV_64F)
    depth_proxy = np.abs(lap)
    depth_proxy = (depth_proxy - depth_proxy.min()) / (depth_proxy.max() - depth_proxy.min() + 1e-8)
    return depth_proxy.astype(np.float32)


def _try_depth_sensor(width: int, height: int) -> Tuple[Optional[np.ndarray], Optional[np.ndarray], str]:
    """
    Attempt to read from a real depth sensor (RealSense, ToF, LiDAR).
    Returns (rgb, depth, source) or (None, None, "") if unavailable.
    """
    # PSEUDOCODE: platform-specific
    # if realsense_available:
    #     pipeline = rs.pipeline()
    #     frames = pipeline.wait_for_frames()
    #     rgb = np.asarray(frames.get_color_frame().get_data()).reshape(h,w,3)
    #     depth = np.asarray(frames.get_depth_frame().get_data())
    #     return rgb, depth, "structured_light"
    # if tof_available: ...
    # if lidar_available: ...
    return None, None, ""


def capture_frame(
    width: int = 640,
    height: int = 480,
    use_depth_fallback: bool = True,
) -> CaptureResult:
    """
    Capture one frame: prefer 3D sensor, else RGB + optional depth estimation.
    """
    ts = time.time()
    rgb_frame = None
    depth_frame = None
    source = "rgb"

    # 1) Try hardware depth (RealSense / ToF / LiDAR)
    rgb_frame, depth_frame, source = _try_depth_sensor(width, height)

    # 2) Fallback: RGB camera only
    if rgb_frame is None and cv2 is not None:
        cap = cv2.VideoCapture(0)
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, width)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, height)
        ret, rgb_frame = cap.read()
        cap.release()
        if ret and rgb_frame is not None:
            if use_depth_fallback:
                depth_frame = _estimate_depth_from_rgb(rgb_frame)
                source = "estimated"
            else:
                depth_frame = None
        else:
            rgb_frame = np.zeros((height, width, 3), dtype=np.uint8)

    if rgb_frame is None:
        rgb_frame = np.zeros((height, width, 3), dtype=np.uint8)

    return CaptureResult(
        rgb=rgb_frame,
        depth=depth_frame,
        depth_available=depth_frame is not None,
        timestamp=ts,
        source=source,
    )


def get_capture_backend() -> str:
    """Return which capture backend is active (for logging/config)."""
    rgb, depth, source = _try_depth_sensor(640, 480)
    if rgb is not None and depth is not None:
        return source or "depth_sensor"
    return "rgb_with_estimated_depth" if cv2 else "none"
