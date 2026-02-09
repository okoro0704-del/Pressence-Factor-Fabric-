"""
Palm vein feature extraction from IR ROI. CNN output 256-d.
"""
from __future__ import annotations

import numpy as np
from ..config import EMBEDDING_DIM_VEIN, ROI_VEIN_SIZE, DEVICE
from .types import VeinEmbedding

try:
    import torch
    import torch.nn as nn
except ImportError:
    torch = None
    nn = None

_VEIN_MODEL = None


def _placeholder_emb(x: np.ndarray, dim: int) -> np.ndarray:
    rng = np.random.default_rng(int(x.astype(np.float64).sum() * 1e6) % (2 ** 32))
    e = rng.standard_normal(dim).astype(np.float32)
    return e / (np.linalg.norm(e) + 1e-8)


class _VeinCNN(nn.Module if nn else object):
    """1-channel vein ROI -> 256-d."""

    def __init__(self, out_dim: int = 256):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(1, 32, 3, 2, 1),
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


def load_vein_encoder(device: str = "cpu", dim: int = 256) -> None:
    global _VEIN_MODEL
    if torch is not None and nn is not None:
        _VEIN_MODEL = _VeinCNN(out_dim=dim)
        _VEIN_MODEL.eval()
        _VEIN_MODEL.to(device)
    else:
        _VEIN_MODEL = None


def encode_vein(vein_roi: np.ndarray, device: str = "cpu") -> VeinEmbedding:
    """IR vein ROI (H,W,1) float [0,1] -> 256-d."""
    if vein_roi.ndim == 2:
        vein_roi = np.expand_dims(vein_roi, axis=-1)
    if vein_roi.shape[:2] != ROI_VEIN_SIZE[::-1]:
        import cv2
        vein_roi = cv2.resize(vein_roi.squeeze(), ROI_VEIN_SIZE)
        if vein_roi.ndim == 2:
            vein_roi = np.expand_dims(vein_roi, axis=-1)
    x = np.transpose(vein_roi, (2, 0, 1))[np.newaxis, ...].astype(np.float32)
    if torch is not None and _VEIN_MODEL is not None:
        t = torch.from_numpy(x).float().to(device)
        with torch.no_grad():
            emb = _VEIN_MODEL(t).cpu().numpy().squeeze()
        emb = emb.astype(np.float32)
    else:
        emb = _placeholder_emb(vein_roi, EMBEDDING_DIM_VEIN)
    return VeinEmbedding(embedding=emb, dim=emb.shape[0])
