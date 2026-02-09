"""Embedding types for each modality."""
from dataclasses import dataclass
from typing import Optional
import numpy as np


@dataclass
class PalmprintEmbedding:
    embedding: np.ndarray
    dim: int = 256


@dataclass
class VeinEmbedding:
    embedding: np.ndarray
    dim: int = 256


@dataclass
class GeometryEmbedding:
    embedding: np.ndarray
    dim: int = 128
