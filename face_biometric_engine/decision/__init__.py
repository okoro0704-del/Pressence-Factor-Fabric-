"""
Decision: accept / reject / re-verify from fused score and thresholds.
"""
from .engine import decide, DecisionResult

__all__ = ["decide", "DecisionResult"]
