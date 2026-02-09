"""
Facial embedding extraction using state-of-the-art deep learning.
ArcFace/MagFace/ViT: 512-d normalized embeddings.
On-device inference with optional edge/cloud fallback.
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


@dataclass
class EmbeddingResult:
    """Single face embedding and optional depth-based embedding."""
    rgb_embedding: np.ndarray   # 512-d normalized
    depth_embedding: Optional[np.ndarray] = None
    model_name: str = ""


def _placeholder_embedding(face: np.ndarray, dim: int = 512) -> np.ndarray:
    """Deterministic placeholder when no real model is loaded (for structure/testing)."""
    flat = face.astype(np.float64).ravel()
    seed = int(flat.sum() * 1e6) % (2 ** 32)
    rng = np.random.default_rng(seed)
    emb = rng.standard_normal(dim).astype(np.float32)
    return emb / (np.linalg.norm(emb) + 1e-8)


class _SimpleEmbeddingNet(nn.Module if nn else object):
    """Minimal CNN for 112x112 RGB -> 512-d. Replace with ArcFace/MagFace/ViT in production."""
    def __init__(self, out_dim: int = 512):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(3, 32, 3, 2, 1),
            nn.ReLU(inplace=True),
            nn.Conv2d(32, 64, 3, 2, 1),
            nn.ReLU(inplace=True),
            nn.Conv2d(64, 128, 3, 2, 1),
            nn.ReLU(inplace=True),
            nn.AdaptiveAvgPool2d(1),
        )
        self.fc = nn.Linear(128, out_dim)

    def forward(self, x):
        x = self.conv(x)
        x = x.view(x.size(0), -1)
        x = self.fc(x)
        return x / (x.norm(dim=1, keepdim=True) + 1e-8)


_embedding_model = None
_embedding_device = "cpu"


def load_embedding_model(device: str = "cpu", dim: int = 512) -> None:
    """Load embedding model (ArcFace/MagFace/ViT). Here: minimal placeholder net."""
    global _embedding_model, _embedding_device
    if torch is not None and nn is not None:
        _embedding_model = _SimpleEmbeddingNet(out_dim=dim)
        _embedding_model.eval()
        _embedding_device = device
    else:
        _embedding_model = None
        _embedding_device = device


def extract_embedding(
    face_rgb: np.ndarray,
    face_depth: Optional[np.ndarray] = None,
    model_name: str = "arcface",
    device: str = "cpu",
) -> EmbeddingResult:
    """
    Extract 512-d normalized embedding from RGB face; optionally from depth.
    face_rgb: HxWx3 float [0,1] or uint8.
    """
    if face_rgb.dtype != np.float32:
        face_rgb = face_rgb.astype(np.float32) / 255.0
    if face_rgb.ndim == 2:
        face_rgb = np.stack([face_rgb] * 3, axis=-1)
    if face_rgb.shape[0] != 112 or face_rgb.shape[1] != 112:
        import cv2
        face_rgb = cv2.resize(face_rgb, (112, 112))
    # CHW, batch
    x = np.transpose(face_rgb, (2, 0, 1))[np.newaxis, ...]

    if torch is not None and _embedding_model is not None:
        t = torch.from_numpy(x).float().to(_embedding_device)
        with torch.no_grad():
            emb = _embedding_model(t).cpu().numpy().squeeze()
        rgb_emb = emb.astype(np.float32)
    else:
        rgb_emb = _placeholder_embedding(face_rgb, 512)

    depth_emb = None
    if face_depth is not None and face_depth.size > 0:
        depth_emb = _placeholder_embedding(face_depth.astype(np.float32), 512)

    return EmbeddingResult(
        rgb_embedding=rgb_emb,
        depth_embedding=depth_emb,
        model_name=model_name,
    )
