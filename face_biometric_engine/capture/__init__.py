"""
Capture module: 3D facial data acquisition.
- Prefer depth sensors (structured light / ToF / LiDAR) when available.
- Fallback: RGB + software depth estimation.
"""
from .capture_3d import capture_frame, CaptureResult, get_capture_backend

__all__ = ["capture_frame", "CaptureResult", "get_capture_backend"]
