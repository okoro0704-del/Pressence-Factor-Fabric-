"""
Separate encoders: palmprint, palm vein, hand geometry.
Output fixed-size embeddings for fusion.
"""
from .palmprint_encoder import encode_palmprint, load_palmprint_encoder
from .vein_encoder import encode_vein, load_vein_encoder
from .geometry_encoder import encode_geometry, load_geometry_encoder
from .types import PalmprintEmbedding, VeinEmbedding, GeometryEmbedding

__all__ = [
    "encode_palmprint", "load_palmprint_encoder",
    "encode_vein", "load_vein_encoder",
    "encode_geometry", "load_geometry_encoder",
    "PalmprintEmbedding", "VeinEmbedding", "GeometryEmbedding",
]
