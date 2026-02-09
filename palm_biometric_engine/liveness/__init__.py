"""
Liveness detection: anti-spoofing for fake palms, photos, silicone molds.
"""
from .detector import check_palm_liveness, PalmLivenessResult

__all__ = ["check_palm_liveness", "PalmLivenessResult"]
