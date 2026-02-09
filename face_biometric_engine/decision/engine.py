"""
Authentication decision: accept / reject / re-verify from fused score.
Tuned for low FAR (banking/identity) and acceptable FRR.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from ..fusion.fusion import FusionResult


@dataclass
class DecisionResult:
    """Final authentication output."""
    decision: str  # "accept" | "reject" | "re_verify"
    confidence: float
    message: str


def decide(
    fusion_result: FusionResult,
    accept_threshold: float = 0.85,
    reject_threshold: float = 0.45,
) -> DecisionResult:
    """
    Map fused score to accept / reject / re-verify.
    """
    s = fusion_result.score
    if s >= accept_threshold:
        return DecisionResult(
            decision="accept",
            confidence=s,
            message="Authentication successful.",
        )
    if s <= reject_threshold:
        return DecisionResult(
            decision="reject",
            confidence=1.0 - s,
            message="Authentication failed. Score below threshold.",
        )
    return DecisionResult(
        decision="re_verify",
        confidence=s,
        message="Uncertain. Please try again.",
    )
