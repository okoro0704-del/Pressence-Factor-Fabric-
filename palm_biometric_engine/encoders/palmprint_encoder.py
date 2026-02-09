"""
Palmprint feature extraction: CNN / Vision Transformer.
Output 256-d embedding for matching (cosine / ArcFace).
"""
from __future__ import annotations

import numpy as np
from ..config import EMBEDDING_DIM_PALMPRINT, ROI_PALMPRINT_SIZE, DEVICE
from .types import PalmprintEmbedding

try:
    import torch
    import torch.nn as nn
except ImportError:
    torch = None
    nn = None

_PALMPRINT_MODEL = None


def _placeholder_emb(x: np.ndarray, dim: int) -> np.ndarray:
    rng = np.random.default_rng(int(x.astype(np.float64).sum() * 1e6) % (2 ** 32))
    e = rng.standard_normal(dim).astype(np.float32)
    return e / (np.linalg.norm(e) + 1e-8)


class _PalmprintCNN(nn.Module if nn else object):
    """Small CNN: 128x128x3 -> 256-d. Replace with ViT/ResNet in production."""

    def __init__(self, out_dim: int = 256):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(3, 32, 3, 2, 1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.Conv2d(32, 64, 3, 2, 1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.Conv2d(64, 128, 3, 2, 1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.AdaptiveAvgPool2d(1),
        )
        self.fc = nn.Linear(128, out_dim)

    def forward(self, x):
        x = self.conv(x)
        x = x.view(x.size(0), -1)
        x = self.fc(x)
        return x / (x.norm(dim=1, keepdim=True) + 1e-8)


def load_palmprint_encoder(device: str = "cpu", dim: int = 256) -> None:
    global _PALMPRINT_MODEL
    if torch is not None and nn is not None:
        _PALMPRINT_MODEL = _PalmprintCNN(out_dim=dim)
        _PALMPRINT_MODEL.eval()
        _PALMPRINT_MODEL.to(device)
    else:
        _PALMPRINT_MODEL = None


def encode_palmprint(palmprint_roi: np.ndarray, device: str = "cpu") -> PalmprintEmbedding:
    """Extract 256-d normalized embedding from palmprint ROI (H,W,3) float [0,1]."""
    if palmprint_roi.ndim == 2:
        palmprint_roi = np.stack([palmprint_roi] * 3, axis=-1)
    if palmprint_roi.shape[:2] != ROI_PALMPRINT_SIZE[::-1]:
        import cv2
        palmprint_roi = cv2.resize(palmprint_roi, ROI_PALMPRINT_SIZE)
    x = np.transpose(palmprint_roi, (2, 0, 1))[np.newaxis, ...].astype(np.float32)
    if torch is not None and _PALMPRINT_MODEL is not None:
        t = torch.from_numpy(x).float().to(device)
        with torch.no_grad():
            emb = _PALMPRINT_MODEL(t).cpu().numpy().squeeze()
        emb = emb.astype(np.float32)
    else:
        emb = _placeholder_emb(palmprint_roi, EMBEDDING_DIM_PALMPRINT)
    return PalmprintEmbedding(embedding=emb, dim=emb.shape[0])
