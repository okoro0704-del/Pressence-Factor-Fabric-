"""
Inference pipeline: capture -> preprocess -> liveness -> encode (x3) -> fuse -> match -> decision.
Real-time target <1s; no raw images stored.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional

import numpy as np

from config import (
    ACCEPT_THRESHOLD,
    REJECT_THRESHOLD,
    ENROLLMENT_MIN_SAMPLES,
    TEMPLATES_DIR,
    ENCRYPT_TEMPLATES,
    DEVICE,
)
from capture.multimodal_capture import capture_palm_frames, PalmCaptureResult
from preprocess.pipeline import preprocess_palm, PalmPreprocessResult
from liveness.detector import check_palm_liveness, PalmLivenessResult
from encoders import encode_palmprint, encode_vein, encode_geometry
from encoders.types import PalmprintEmbedding, VeinEmbedding, GeometryEmbedding
from fusion.fusion import fuse_modalities, load_fusion_model, IdentityVector
from matching.matcher import match_identity, cosine_similarity
from decision.engine import decide, PalmDecisionResult
from storage.template_store import TemplateStore, enroll_palm_template, verify_palm_template


@dataclass
class PalmPipelineResult:
    decision: str
    confidence: float
    message: str
    match: bool
    liveness_score: float = 0.0
    similarity_score: float = 0.0
    template_hash: Optional[str] = None


def _run_single(
    prep: PalmPreprocessResult,
    liveness: PalmLivenessResult,
    ref_vector: Optional[np.ndarray] = None,
    store: Optional[TemplateStore] = None,
    user_id: Optional[str] = None,
) -> tuple[IdentityVector, float, PalmDecisionResult, bool, Optional[str]]:
    """Encode, fuse, match (if ref/store), decide."""
    pp_emb = encode_palmprint(prep.palmprint_roi, device=DEVICE)
    v_emb = encode_vein(prep.vein_roi, device=DEVICE)
    g_emb = encode_geometry(prep.geometry_vector, device=DEVICE)
    identity = fuse_modalities(
        pp_emb.embedding, v_emb.embedding, g_emb.embedding, device=DEVICE,
    )
    similarity = 0.0
    match = False
    template_hash = None
    if ref_vector is not None:
        mr = match_identity(identity.vector, ref_vector, threshold=ACCEPT_THRESHOLD)
        similarity = mr.score
        match = mr.match
    elif store is not None and user_id:
        match, similarity, template_hash = verify_palm_template(store, user_id, identity.vector, threshold=ACCEPT_THRESHOLD)
    dec = decide(similarity, liveness.score, ACCEPT_THRESHOLD, REJECT_THRESHOLD)
    return identity, similarity, dec, match, template_hash


def run_enrollment(
    user_id: str,
    num_samples: Optional[int] = None,
    store: Optional[TemplateStore] = None,
) -> PalmPipelineResult:
    """Capture multiple frames, aggregate identity vectors, store encrypted template."""
    num_samples = num_samples or ENROLLMENT_MIN_SAMPLES
    if store is None:
        store = TemplateStore(base_dir=TEMPLATES_DIR, encrypt=ENCRYPT_TEMPLATES)

    captures = capture_palm_frames(num_frames=num_samples * 2, require_ir=False)
    vectors: List[np.ndarray] = []
    liveness_scores: List[float] = []
    prev_geometry = None

    for cap in captures:
        if cap.rgb is None:
            continue
        prep = preprocess_palm(cap.rgb, cap.ir, cap.depth)
        live = check_palm_liveness(
            prep.palmprint_roi, prep.vein_roi, prep.geometry_vector, prev_geometry,
        )
        if live.score < 0.5:
            continue
        identity, _, _, _, _ = _run_single(prep, live)
        vectors.append(identity.vector)
        liveness_scores.append(live.score)
        prev_geometry = prep.geometry_vector.copy()
        if len(vectors) >= num_samples:
            break

    if len(vectors) < num_samples:
        return PalmPipelineResult(
            decision="reject",
            confidence=0.0,
            message=f"Need at least {num_samples} live samples; got {len(vectors)}.",
            match=False,
            liveness_score=float(np.mean(liveness_scores)) if liveness_scores else 0.0,
        )

    mean_vec = np.mean(vectors, axis=0).astype(np.float32)
    mean_vec /= np.linalg.norm(mean_vec) + 1e-8
    template_hash = enroll_palm_template(store, user_id, mean_vec)
    return PalmPipelineResult(
        decision="accept",
        confidence=1.0,
        message="Enrollment successful.",
        match=True,
        liveness_score=float(np.mean(liveness_scores)),
        similarity_score=1.0,
        template_hash=template_hash,
    )


def run_verification(
    user_id: str,
    num_frames: int = 3,
    store: Optional[TemplateStore] = None,
) -> PalmPipelineResult:
    """Capture frames, encode, fuse, match to stored template, decide."""
    if store is None:
        store = TemplateStore(base_dir=TEMPLATES_DIR, encrypt=ENCRYPT_TEMPLATES)
    loaded = store.load(user_id)
    if loaded is None:
        return PalmPipelineResult(decision="reject", confidence=0.0, message="User not enrolled.", match=False)
    ref_vector, _ = loaded

    captures = capture_palm_frames(num_frames=num_frames, require_ir=False)
    best_score = 0.0
    best_decision = None
    best_match = False
    best_hash = None
    liveness_scores = []
    for cap in captures:
        if cap.rgb is None:
            continue
        prep = preprocess_palm(cap.rgb, cap.ir, cap.depth)
        live = check_palm_liveness(prep.palmprint_roi, prep.vein_roi, prep.geometry_vector)
        if live.score < 0.4:
            continue
        liveness_scores.append(live.score)
        identity, similarity, dec, match, template_hash = _run_single(prep, live, ref_vector=ref_vector)
        if similarity > best_score:
            best_score = similarity
            best_decision = dec
            best_match = match
            best_hash = template_hash
        if dec.decision == "accept":
            break

    if best_decision is None:
        return PalmPipelineResult(
            decision="reject",
            confidence=0.0,
            message="No valid frames or liveness failed.",
            match=False,
            liveness_score=float(np.mean(liveness_scores)) if liveness_scores else 0.0,
        )
    return PalmPipelineResult(
        decision=best_decision.decision,
        confidence=best_decision.confidence,
        message=best_decision.message,
        match=best_match,
        liveness_score=float(np.mean(liveness_scores)) if liveness_scores else 0.0,
        similarity_score=best_score,
        template_hash=best_hash,
    )


def run_verification_from_images(
    user_id: str,
    rgb_images: List[np.ndarray],
    ir_images: Optional[List[Optional[np.ndarray]]] = None,
    store: Optional[TemplateStore] = None,
) -> PalmPipelineResult:
    """Verification using provided RGB (and optional IR) images."""
    if store is None:
        store = TemplateStore(base_dir=TEMPLATES_DIR, encrypt=ENCRYPT_TEMPLATES)
    loaded = store.load(user_id)
    if loaded is None:
        return PalmPipelineResult(decision="reject", confidence=0.0, message="User not enrolled.", match=False)
    ref_vector, _ = loaded
    ir_images = ir_images or [None] * len(rgb_images)
    best_score = 0.0
    best_decision = None
    best_match = False
    best_hash = None
    liveness_scores = []
    for rgb, ir in zip(rgb_images, ir_images):
        prep = preprocess_palm(rgb, ir)
        live = check_palm_liveness(prep.palmprint_roi, prep.vein_roi, prep.geometry_vector)
        if live.score < 0.4:
            continue
        liveness_scores.append(live.score)
        identity, similarity, dec, match, template_hash = _run_single(prep, live, ref_vector=ref_vector)
        if similarity > best_score:
            best_score = similarity
            best_decision = dec
            best_match = match
            best_hash = template_hash
        if dec.decision == "accept":
            break
    if best_decision is None:
        return PalmPipelineResult(
            decision="reject",
            confidence=0.0,
            message="No valid frames or liveness failed.",
            match=False,
            liveness_score=float(np.mean(liveness_scores)) if liveness_scores else 0.0,
        )
    return PalmPipelineResult(
        decision=best_decision.decision,
        confidence=best_decision.confidence,
        message=best_decision.message,
        match=best_match,
        liveness_score=float(np.mean(liveness_scores)) if liveness_scores else 0.0,
        similarity_score=best_score,
        template_hash=best_hash,
    )


def run_enrollment_from_images(
    user_id: str,
    rgb_images: List[np.ndarray],
    ir_images: Optional[List[Optional[np.ndarray]]] = None,
    min_samples: Optional[int] = None,
    store: Optional[TemplateStore] = None,
) -> PalmPipelineResult:
    """Enrollment from provided images."""
    min_samples = min_samples or ENROLLMENT_MIN_SAMPLES
    if store is None:
        store = TemplateStore(base_dir=TEMPLATES_DIR, encrypt=ENCRYPT_TEMPLATES)
    ir_images = ir_images or [None] * len(rgb_images)
    vectors = []
    liveness_scores = []
    for rgb, ir in zip(rgb_images, ir_images):
        prep = preprocess_palm(rgb, ir)
        live = check_palm_liveness(prep.palmprint_roi, prep.vein_roi, prep.geometry_vector)
        if live.score < 0.5:
            continue
        pp_emb = encode_palmprint(prep.palmprint_roi, device=DEVICE)
        v_emb = encode_vein(prep.vein_roi, device=DEVICE)
        g_emb = encode_geometry(prep.geometry_vector, device=DEVICE)
        identity = fuse_modalities(pp_emb.embedding, v_emb.embedding, g_emb.embedding, device=DEVICE)
        vectors.append(identity.vector)
        liveness_scores.append(live.score)
        if len(vectors) >= min_samples:
            break
    if len(vectors) < min_samples:
        return PalmPipelineResult(
            decision="reject",
            confidence=0.0,
            message=f"Need at least {min_samples} live samples; got {len(vectors)}.",
            match=False,
            liveness_score=float(np.mean(liveness_scores)) if liveness_scores else 0.0,
        )
    mean_vec = np.mean(vectors, axis=0).astype(np.float32)
    mean_vec /= np.linalg.norm(mean_vec) + 1e-8
    template_hash = enroll_palm_template(store, user_id, mean_vec)
    return PalmPipelineResult(
        decision="accept",
        confidence=1.0,
        message="Enrollment successful.",
        match=True,
        liveness_score=float(np.mean(liveness_scores)),
        similarity_score=1.0,
        template_hash=template_hash,
    )


def init_pipeline() -> None:
    """Load encoders and fusion model; ensure dirs."""
    from encoders import load_palmprint_encoder, load_vein_encoder, load_geometry_encoder
    from config import EMBEDDING_DIM_PALMPRINT, EMBEDDING_DIM_VEIN, EMBEDDING_DIM_GEOMETRY
    load_palmprint_encoder(device=DEVICE, dim=EMBEDDING_DIM_PALMPRINT)
    load_vein_encoder(device=DEVICE, dim=EMBEDDING_DIM_VEIN)
    load_geometry_encoder(device=DEVICE, dim=EMBEDDING_DIM_GEOMETRY)
    load_fusion_model(device=DEVICE)
    TEMPLATES_DIR.mkdir(parents=True, exist_ok=True)
