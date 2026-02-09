"""
Main pipeline: capture → preprocess → liveness → embedding → fusion → decision.
Single flow for enrollment (store encrypted template) and verification (match + decision).
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Optional

import numpy as np

from config import (
    ACCEPT_THRESHOLD,
    ENROLLMENT_MIN_SAMPLES,
    FUSION_WEIGHTS,
    REJECT_THRESHOLD,
)
from capture.capture_3d import capture_frame, CaptureResult
from preprocess.pipeline import preprocess_frame, PreprocessResult
from liveness.detector import check_liveness, collect_liveness_scores, LivenessResult
from embedding.extractor import extract_embedding, load_embedding_model, EmbeddingResult
from fusion.fusion import fuse_signals, FusionResult
from decision.engine import decide, DecisionResult
from storage.template_store import TemplateStore, enroll_template, verify_against_templates
from config import EMBEDDING_DIM, DEVICE, ENCRYPT_TEMPLATES, TEMPLATES_DIR


@dataclass
class PipelineResult:
    """Result of one verification or enrollment run."""
    decision: str
    confidence: float
    message: str
    liveness_score: float = 0.0
    fusion_score: float = 0.0
    components: dict = field(default_factory=dict)
    match: bool = False


def _run_single_frame(
    capture_result: CaptureResult,
    preprocess_result: PreprocessResult,
    liveness_result: LivenessResult,
    ref_rgb: Optional[np.ndarray] = None,
    ref_depth: Optional[np.ndarray] = None,
) -> tuple[EmbeddingResult, FusionResult, DecisionResult]:
    """One frame: embed, fuse with reference (if any), decide."""
    emb = extract_embedding(
        preprocess_result.face_rgb,
        preprocess_result.face_depth,
        device=DEVICE,
    )
    if ref_rgb is None:
        ref_rgb = emb.rgb_embedding
        ref_depth = emb.depth_embedding
    fusion = fuse_signals(
        emb.rgb_embedding,
        ref_rgb,
        liveness_result.score,
        depth_embedding=emb.depth_embedding,
        reference_depth_embedding=ref_depth,
        motion_consistency=liveness_result.micro_motion,
        weights=FUSION_WEIGHTS,
    )
    dec = decide(fusion, accept_threshold=ACCEPT_THRESHOLD, reject_threshold=REJECT_THRESHOLD)
    return emb, fusion, dec


def run_verification(
    user_id: str,
    num_frames: int = 5,
    store: Optional[TemplateStore] = None,
) -> PipelineResult:
    """
    Capture num_frames, preprocess, liveness, embed, fuse with stored template, decide.
    """
    if store is None:
        store = TemplateStore(base_dir=TEMPLATES_DIR, encrypt=ENCRYPT_TEMPLATES)
    loaded = store.load(user_id)
    if loaded is None:
        return PipelineResult(
            decision="reject",
            confidence=0.0,
            message="User not enrolled.",
            liveness_score=0.0,
            fusion_score=0.0,
            match=False,
        )
    ref_rgb, ref_depth = loaded

    liveness_scores: List[float] = []
    last_emb: Optional[EmbeddingResult] = None
    last_fusion: Optional[FusionResult] = None
    last_decision: Optional[DecisionResult] = None

    for _ in range(num_frames):
        cap = capture_frame()
        if cap.rgb is None:
            continue
        prep = preprocess_frame(cap.rgb, cap.depth)
        if prep.num_faces != 1:
            continue
        live = check_liveness(cap.rgb, cap.depth, prep.face_rgb, prep.face_depth)
        liveness_scores.append(live.score)
        if live.score < 0.4:
            continue
        emb, fusion, dec = _run_single_frame(cap, prep, live, ref_rgb, ref_depth)
        last_emb = emb
        last_fusion = fusion
        last_decision = dec
        if dec.decision == "accept":
            break

    if last_fusion is None or last_decision is None or last_emb is None:
        return PipelineResult(
            decision="reject",
            confidence=0.0,
            message="No valid frames or liveness failed.",
            liveness_score=float(np.mean(liveness_scores)) if liveness_scores else 0.0,
            fusion_score=0.0,
            match=False,
        )

    match, _ = verify_against_templates(
        store, user_id,
        last_emb.rgb_embedding,
        last_emb.depth_embedding,
        threshold=ACCEPT_THRESHOLD,
    )
    return PipelineResult(
        decision=last_decision.decision,
        confidence=last_decision.confidence,
        message=last_decision.message,
        liveness_score=float(np.mean(liveness_scores)) if liveness_scores else 0.0,
        fusion_score=last_fusion.score,
        components=last_fusion.components,
        match=match,
    )


def run_enrollment(
    user_id: str,
    num_samples: Optional[int] = None,
    store: Optional[TemplateStore] = None,
) -> PipelineResult:
    """
    Capture ENROLLMENT_MIN_SAMPLES (or num_samples) frames, aggregate embeddings, store encrypted template.
    """
    if num_samples is None:
        num_samples = ENROLLMENT_MIN_SAMPLES
    if store is None:
        store = TemplateStore(base_dir=TEMPLATES_DIR, encrypt=ENCRYPT_TEMPLATES)

    rgb_embeddings: List[np.ndarray] = []
    depth_embeddings: List[np.ndarray] = []
    liveness_scores: List[float] = []

    for _ in range(num_samples * 3):
        if len(rgb_embeddings) >= num_samples:
            break
        cap = capture_frame()
        if cap.rgb is None:
            continue
        prep = preprocess_frame(cap.rgb, cap.depth)
        if prep.num_faces != 1:
            continue
        live = check_liveness(cap.rgb, cap.depth, prep.face_rgb, prep.face_depth)
        if live.score < 0.5:
            continue
        emb = extract_embedding(prep.face_rgb, prep.face_depth, device=DEVICE)
        rgb_embeddings.append(emb.rgb_embedding)
        if emb.depth_embedding is not None:
            depth_embeddings.append(emb.depth_embedding)
        liveness_scores.append(live.score)

    if len(rgb_embeddings) < num_samples:
        return PipelineResult(
            decision="reject",
            confidence=0.0,
            message=f"Need at least {num_samples} live samples; got {len(rgb_embeddings)}.",
            liveness_score=float(np.mean(liveness_scores)) if liveness_scores else 0.0,
            fusion_score=0.0,
            match=False,
        )

    rgb_mean = np.mean(rgb_embeddings, axis=0).astype(np.float32)
    rgb_mean /= np.linalg.norm(rgb_mean) + 1e-8
    depth_mean = None
    if depth_embeddings:
        depth_mean = np.mean(depth_embeddings, axis=0).astype(np.float32)
        depth_mean /= np.linalg.norm(depth_mean) + 1e-8
    enroll_template(store, user_id, rgb_mean, depth_mean)
    return PipelineResult(
        decision="accept",
        confidence=1.0,
        message="Enrollment successful.",
        liveness_score=float(np.mean(liveness_scores)),
        fusion_score=1.0,
        components={},
        match=True,
    )


def run_verification_from_images(
    user_id: str,
    images: List[np.ndarray],
    depths: Optional[List[Optional[np.ndarray]]] = None,
    store: Optional[TemplateStore] = None,
) -> PipelineResult:
    """Verification using provided RGB images (and optional depth). No camera capture."""
    if store is None:
        store = TemplateStore(base_dir=TEMPLATES_DIR, encrypt=ENCRYPT_TEMPLATES)
    loaded = store.load(user_id)
    if loaded is None:
        return PipelineResult(decision="reject", confidence=0.0, message="User not enrolled.", match=False)
    ref_rgb, ref_depth = loaded
    depths = depths or [None] * len(images)
    liveness_scores = []
    last_emb = None
    last_fusion = None
    last_decision = None
    for rgb, depth in zip(images, depths):
        prep = preprocess_frame(rgb, depth)
        if prep.num_faces != 1:
            continue
        live = check_liveness(rgb, depth, prep.face_rgb, prep.face_depth)
        liveness_scores.append(live.score)
        if live.score < 0.4:
            continue
        emb = extract_embedding(prep.face_rgb, prep.face_depth, device=DEVICE)
        fusion = fuse_signals(
            emb.rgb_embedding, ref_rgb, live.score,
            depth_embedding=emb.depth_embedding, reference_depth_embedding=ref_depth,
            motion_consistency=live.micro_motion, weights=FUSION_WEIGHTS,
        )
        dec = decide(fusion, accept_threshold=ACCEPT_THRESHOLD, reject_threshold=REJECT_THRESHOLD)
        last_emb, last_fusion, last_decision = emb, fusion, dec
        if dec.decision == "accept":
            break
    if last_emb is None or last_fusion is None or last_decision is None:
        return PipelineResult(
            decision="reject",
            confidence=0.0,
            message="No valid frames or liveness failed.",
            liveness_score=float(np.mean(liveness_scores)) if liveness_scores else 0.0,
            match=False,
        )
    match, _ = verify_against_templates(store, user_id, last_emb.rgb_embedding, last_emb.depth_embedding, threshold=ACCEPT_THRESHOLD)
    return PipelineResult(
        decision=last_decision.decision,
        confidence=last_decision.confidence,
        message=last_decision.message,
        liveness_score=float(np.mean(liveness_scores)) if liveness_scores else 0.0,
        fusion_score=last_fusion.score,
        components=last_fusion.components,
        match=match,
    )


def run_enrollment_from_images(
    user_id: str,
    images: List[np.ndarray],
    depths: Optional[List[Optional[np.ndarray]]] = None,
    min_samples: Optional[int] = None,
    store: Optional[TemplateStore] = None,
) -> PipelineResult:
    """Enrollment from provided RGB images (and optional depth). No camera capture."""
    min_samples = min_samples or ENROLLMENT_MIN_SAMPLES
    if store is None:
        store = TemplateStore(base_dir=TEMPLATES_DIR, encrypt=ENCRYPT_TEMPLATES)
    rgb_embeddings = []
    depth_embeddings = []
    liveness_scores = []
    depths = depths or [None] * len(images)
    for rgb, depth in zip(images, depths):
        prep = preprocess_frame(rgb, depth)
        if prep.num_faces != 1:
            continue
        live = check_liveness(rgb, depth, prep.face_rgb, prep.face_depth)
        if live.score < 0.5:
            continue
        emb = extract_embedding(prep.face_rgb, prep.face_depth, device=DEVICE)
        rgb_embeddings.append(emb.rgb_embedding)
        if emb.depth_embedding is not None:
            depth_embeddings.append(emb.depth_embedding)
        liveness_scores.append(live.score)
        if len(rgb_embeddings) >= min_samples:
            break
    if len(rgb_embeddings) < min_samples:
        return PipelineResult(
            decision="reject",
            confidence=0.0,
            message=f"Need at least {min_samples} live samples; got {len(rgb_embeddings)}.",
            liveness_score=float(np.mean(liveness_scores)) if liveness_scores else 0.0,
            match=False,
        )
    rgb_mean = np.mean(rgb_embeddings, axis=0).astype(np.float32)
    rgb_mean /= np.linalg.norm(rgb_mean) + 1e-8
    depth_mean = None
    if depth_embeddings:
        depth_mean = np.mean(depth_embeddings, axis=0).astype(np.float32)
        depth_mean /= np.linalg.norm(depth_mean) + 1e-8
    enroll_template(store, user_id, rgb_mean, depth_mean)
    return PipelineResult(
        decision="accept",
        confidence=1.0,
        message="Enrollment successful.",
        liveness_score=float(np.mean(liveness_scores)),
        fusion_score=1.0,
        match=True,
    )


def init_pipeline() -> None:
    """Load embedding model and ensure dirs."""
    load_embedding_model(device=DEVICE, dim=EMBEDDING_DIM)
    TEMPLATES_DIR.mkdir(parents=True, exist_ok=True)
