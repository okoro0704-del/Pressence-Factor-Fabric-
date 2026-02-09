"""
Embedding module: extract facial embeddings (ArcFace / MagFace / ViT).
"""
from .extractor import extract_embedding, EmbeddingResult, load_embedding_model

__all__ = ["extract_embedding", "EmbeddingResult", "load_embedding_model"]
