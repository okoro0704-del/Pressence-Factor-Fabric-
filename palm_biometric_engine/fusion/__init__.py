"""
Multimodal fusion: late-fusion or attention-based -> single identity vector.
"""
from .fusion import fuse_modalities, IdentityVector, load_fusion_model

__all__ = ["fuse_modalities", "IdentityVector", "load_fusion_model"]
