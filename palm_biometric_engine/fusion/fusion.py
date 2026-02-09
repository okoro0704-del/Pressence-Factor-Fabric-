"""
Fuse palmprint, vein, geometry embeddings into single identity vector.
Late-fusion (weighted concat + projection) or attention over modalities.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

import numpy as np

try:
    import torch
    import torch.nn as nn
except ImportError:
    torch = None
    nn = None

from ..config import (
    FUSION_TYPE,
    FUSION_WEIGHTS,
    IDENTITY_DIM,
    EMBEDDING_DIM_PALMPRINT,
    EMBEDDING_DIM_VEIN,
    EMBEDDING_DIM_GEOMETRY,
    ATTENTION_DIM,
    DEVICE,
)


@dataclass
class IdentityVector:
    """Fused identity embedding and per-modality scores (for audit)."""
    vector: np.ndarray
    dim: int
    components: dict  # palmprint_sim, vein_sim, geometry_sim if verification


_FUSION_MODEL = None


class _LateFusion(nn.Module if nn else object):
    """Concat [palmprint, vein, geometry] -> linear -> identity_dim, L2-norm."""

    def __init__(self):
        super().__init__()
        in_d = EMBEDDING_DIM_PALMPRINT + EMBEDDING_DIM_VEIN + EMBEDDING_DIM_GEOMETRY
        self.proj = nn.Linear(in_d, IDENTITY_DIM)

    def forward(self, pp: "torch.Tensor", v: "torch.Tensor", g: "torch.Tensor"):
        x = torch.cat([pp, v, g], dim=1)
        x = self.proj(x)
        return x / (x.norm(dim=1, keepdim=True) + 1e-8)


class _AttentionFusion(nn.Module if nn else object):
    """Learnable attention over three modality embeddings then weighted sum + projection."""

    def __init__(self):
        super().__init__()
        self.attn = nn.Sequential(
            nn.Linear(EMBEDDING_DIM_PALMPRINT + EMBEDDING_DIM_VEIN + EMBEDDING_DIM_GEOMETRY, ATTENTION_DIM),
            nn.Tanh(),
            nn.Linear(ATTENTION_DIM, 3),
        )
        self.proj = nn.Linear(EMBEDDING_DIM_PALMPRINT + EMBEDDING_DIM_VEIN + EMBEDDING_DIM_GEOMETRY, IDENTITY_DIM)

    def forward(self, pp: "torch.Tensor", v: "torch.Tensor", g: "torch.Tensor"):
        cat = torch.cat([pp, v, g], dim=1)
        w = torch.softmax(self.attn(cat), dim=1)
        fused_flat = torch.cat([pp, v, g], dim=1)
        x = self.proj(fused_flat)
        return x / (x.norm(dim=1, keepdim=True) + 1e-8)


def load_fusion_model(device: str = "cpu") -> None:
    global _FUSION_MODEL
    if torch is not None and nn is not None:
        _FUSION_MODEL = _AttentionFusion() if FUSION_TYPE == "attention" else _LateFusion()
        _FUSION_MODEL.eval()
        _FUSION_MODEL.to(device)
    else:
        _FUSION_MODEL = None


def fuse_modalities(
    palmprint_emb: np.ndarray,
    vein_emb: np.ndarray,
    geometry_emb: np.ndarray,
    device: str = "cpu",
) -> IdentityVector:
    """
    Fuse three modality embeddings into single identity vector (512-d).
    """
    pp = np.asarray(palmprint_emb, dtype=np.float32).ravel()
    v = np.asarray(vein_emb, dtype=np.float32).ravel()
    g = np.asarray(geometry_emb, dtype=np.float32).ravel()
    # Pad/trim to expected dims
    pp = pp[:EMBEDDING_DIM_PALMPRINT] if len(pp) >= EMBEDDING_DIM_PALMPRINT else np.pad(pp, (0, EMBEDDING_DIM_PALMPRINT - len(pp)))
    v = v[:EMBEDDING_DIM_VEIN] if len(v) >= EMBEDDING_DIM_VEIN else np.pad(v, (0, EMBEDDING_DIM_VEIN - len(v)))
    g = g[:EMBEDDING_DIM_GEOMETRY] if len(g) >= EMBEDDING_DIM_GEOMETRY else np.pad(g, (0, EMBEDDING_DIM_GEOMETRY - len(g)))

    if torch is not None and _FUSION_MODEL is not None:
        t_pp = torch.from_numpy(pp[np.newaxis, :]).float().to(device)
        t_v = torch.from_numpy(v[np.newaxis, :]).float().to(device)
        t_g = torch.from_numpy(g[np.newaxis, :]).float().to(device)
        with torch.no_grad():
            vec = _FUSION_MODEL(t_pp, t_v, t_g).cpu().numpy().squeeze()
        vec = vec.astype(np.float32)
    else:
        # Weighted concat then normalize
        w = FUSION_WEIGHTS
        combined = np.concatenate([
            pp * w["palmprint"],
            v * w["vein"],
            g * w["geometry"],
        ])
        if len(combined) >= IDENTITY_DIM:
            vec = combined[:IDENTITY_DIM]
        else:
            vec = np.pad(combined, (0, IDENTITY_DIM - len(combined)))
        vec = vec / (np.linalg.norm(vec) + 1e-8)
    return IdentityVector(vector=vec, dim=vec.shape[0], components={})
