"""
Matching: cosine similarity or metric learning (Triplet/ArcFace in training).
"""
from .matcher import match_identity, cosine_similarity

__all__ = ["match_identity", "cosine_similarity"]
