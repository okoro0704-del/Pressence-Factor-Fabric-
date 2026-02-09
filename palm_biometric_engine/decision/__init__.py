"""
Authentication decision: accept / reject / re-verify from score and liveness.
"""
from .engine import decide, PalmDecisionResult

__all__ = ["decide", "PalmDecisionResult"]
