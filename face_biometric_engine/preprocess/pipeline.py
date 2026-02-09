"""
Preprocessing pipeline: detect face, align, crop, normalize.
Input: RGB (+ optional depth). Output: aligned face crop(s) + ROI depth for downstream.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional, Tuple

import numpy as np

try:
    import cv2
except ImportError:
    cv2 = None


@dataclass
class PreprocessResult:
    """Aligned face(s) and optional depth ROI for one frame."""
    face_rgb: np.ndarray           # 112x112 or 224x224 normalized for embedding
    face_depth: Optional[np.ndarray] = None  # same crop region from depth
    bbox: Optional[Tuple[int, int, int, int]] = None  # x,y,w,h
    landmarks: Optional[np.ndarray] = None  # 5 or 68 pts
    num_faces: int = 1


def _detect_face_cascade(rgb: np.ndarray) -> List[Tuple[int, int, int, int]]:
    """Simple Haar cascade fallback. Production: use MTCNN / RetinaFace / YOLO."""
    if cv2 is None:
        h, w = rgb.shape[:2]
        return [(0, 0, w, h)]
    gray = cv2.cvtColor(rgb, cv2.COLOR_BGR2GRAY)
    cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    )
    boxes = cascade.detectMultiScale(gray, 1.1, 5, minSize=(80, 80))
    if len(boxes) == 0:
        h, w = rgb.shape[:2]
        return [(0, 0, w, h)]
    return [(int(x), int(y), int(w), int(h)) for (x, y, w, h) in boxes]


def _align_and_crop(
    rgb: np.ndarray,
    bbox: Tuple[int, int, int, int],
    depth: Optional[np.ndarray],
    output_size: int = 112,
) -> Tuple[np.ndarray, Optional[np.ndarray]]:
    """Crop and resize face to output_size x output_size; same region for depth."""
    x, y, w, h = bbox
    if cv2 is None:
        face_rgb = rgb[y : y + h, x : x + w]
        face_depth = depth[y : y + h, x : x + w] if depth is not None else None
    else:
        face_rgb = cv2.resize(rgb[y : y + h, x : x + w], (output_size, output_size))
        face_depth = (
            cv2.resize(depth[y : y + h, x : x + w], (output_size, output_size))
            if depth is not None else None
        )
    # Normalize to [0,1] or standard mean/std for the embedding model
    face_rgb = face_rgb.astype(np.float32) / 255.0
    return face_rgb, face_depth


def preprocess_frame(
    rgb: np.ndarray,
    depth: Optional[np.ndarray] = None,
    output_size: int = 112,
    max_faces: int = 1,
) -> PreprocessResult:
    """
    Detect face(s), align, crop to output_size, normalize.
    Returns the first (or primary) face for embedding/liveness.
    """
    boxes = _detect_face_cascade(rgb)
    if not boxes:
        h, w = rgb.shape[:2]
        boxes = [(0, 0, w, h)]
    # Take largest face
    primary = max(boxes, key=lambda b: b[2] * b[3])
    face_rgb, face_depth = _align_and_crop(rgb, primary, depth, output_size)
    return PreprocessResult(
        face_rgb=face_rgb,
        face_depth=face_depth,
        bbox=primary,
        num_faces=len(boxes),
    )
