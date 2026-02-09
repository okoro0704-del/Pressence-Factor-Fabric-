"""
Map similarity score + liveness to accept / reject / re-verify.
Low FAR (banking-grade), acceptable FRR.
"""
from __future__ import annotations

from dataclasses import dataclass

from ..config import ACCEPT_THRESHOLD, REJECT_THRESHOLD


@dataclass
class PalmDecisionResult:
    """Final authentication output."""
    decision: str  # accept | reject | re_verify
    confidence: float
    message: str


def decide(
    similarity_score: float,
    liveness_score: float,
    accept_threshold: float = None,
    reject_threshold: float = None,
    min_liveness: float = 0.5,
) -> PalmDecisionResult:
    """
    Require both sufficient similarity and liveness for accept.
    """
    accept_threshold = accept_threshold or ACCEPT_THRESHOLD
    reject_threshold = reject_threshold or REJECT_THRESHOLD
    if liveness_score < min_liveness:
        return PalmDecisionResult(
            decision="reject",
            confidence=1.0 - liveness_score,
            message="Liveness check failed.",
        )
    if similarity_score >= accept_threshold:
        return PalmDecisionResult(
            decision="accept",
            confidence=similarity_score,
            message="Authentication successful.",
        )
    if similarity_score <= reject_threshold:
        return PalmDecisionResult(
            decision="reject",
            confidence=1.0 - similarity_score,
            message="No match.",
        )
    return PalmDecisionResult(
        decision="re_verify",
        confidence=similarity_score,
        message="Uncertain. Please try again.",
    )
