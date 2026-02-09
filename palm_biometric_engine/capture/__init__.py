"""
Multi-modal palm capture: RGB (palmprint), IR (vein), optional depth/ultrasound.
"""
from .multimodal_capture import capture_palm_frames, PalmCaptureResult, get_capture_backend

__all__ = ["capture_palm_frames", "PalmCaptureResult", "get_capture_backend"]
