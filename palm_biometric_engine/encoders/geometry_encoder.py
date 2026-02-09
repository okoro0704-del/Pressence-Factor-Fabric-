"""
Hand geometry encoder: shape, size, finger spacing -> 128-d.
"""
from __future__ import annotations

import numpy as np
from ..config import EMBEDDING_DIM_GEOMETRY, DEVICE
from .types import GeometryEmbedding

try:
    import torch
    import torch.nn as nn
except ImportError:
    torch = None
    nn = None

_GEOMETRY_MODEL = None


def _placeholder_emb(x: np.ndarray, dim: int) -> np.ndarray:
    rng = np.random.default_rng(int(x.astype(np.float64).sum() * 1e6) % (2 ** 32))
    e = rng.standard_normal(dim).astype(np.float32)
    return e / (np.linalg.norm(e) + 1e-8)


class _GeometryMLP(nn.Module if nn else object):
    """Geometry vector (e.g. 128-d) -> 128-d embedding."""

    def __init__(self, in_dim: int = 128, out_dim: int = 128):
        super().__init__()
        self.mlp = nn.Sequential(
            nn.Linear(in_dim, 64),
            nn.ReLU(inplace=True),
            nn.Linear(64, out_dim),
        )

    def forward(self, x):
        x = self.mlp(x)
        return x / (x.norm(dim=1, keepdim=True) + 1e-8)


def load_geometry_encoder(device: str = "cpu", dim: int = 128) -> None:
    global _GEOMETRY_MODEL
    if torch is not None and nn is not None:
        _GEOMETRY_MODEL = _GeometryMLP(in_dim=128, out_dim=dim)
        _GEOMETRY_MODEL.eval()
        _GEOMETRY_MODEL.to(device)
    else:
        _GEOMETRY_MODEL = None


def encode_geometry(geometry_vector: np.ndarray, device: str = "cpu") -> GeometryEmbedding:
    """Geometry feature vector -> 128-d normalized embedding."""
    if geometry_vector.size < 128:
        pad = np.zeros(128, dtype=np.float32)
        pad[: geometry_vector.size] = geometry_vector.ravel()
        geometry_vector = pad
    else:
        geometry_vector = geometry_vector.ravel()[:128].astype(np.float32)
    x = geometry_vector[np.newaxis, ...]
    if torch is not None and _GEOMETRY_MODEL is not None:
        t = torch.from_numpy(x).float().to(device)
        with torch.no_grad():
            emb = _GEOMETRY_MODEL(t).cpu().numpy().squeeze()
        emb = emb.astype(np.float32)
    else:
        emb = _placeholder_emb(geometry_vector, EMBEDDING_DIM_GEOMETRY)
    return GeometryEmbedding(embedding=emb, dim=emb.shape[0])
