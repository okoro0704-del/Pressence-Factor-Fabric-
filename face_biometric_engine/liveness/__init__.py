"""
Liveness detection: anti-spoofing (photo, video, mask, deepfake).
- Depth consistency, micro-motion, blink, texture analysis.
"""
from .detector import LivenessResult, check_liveness, collect_liveness_scores

__all__ = ["LivenessResult", "check_liveness", "collect_liveness_scores"]
