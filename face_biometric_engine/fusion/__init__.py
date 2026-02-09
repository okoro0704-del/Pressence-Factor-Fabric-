"""
Fusion: combine RGB embedding, depth embedding, liveness, motion into one score.
"""
from .fusion import fuse_signals, FusionResult

__all__ = ["fuse_signals", "FusionResult"]
