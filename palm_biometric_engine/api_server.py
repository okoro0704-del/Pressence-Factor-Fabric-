"""
FastAPI: enrollment and verification for multimodal palm recognition.
Blockchain-ready: responses include template_hash for smart-contract binding.
Zero-trust; no raw images stored; encrypted templates only.
"""
from __future__ import annotations

import base64
from typing import List, Optional

import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from config import API_HOST, API_PORT, ENROLLMENT_MIN_SAMPLES, RESPONSE_INCLUDE_HASH
from pipeline import (
    init_pipeline,
    run_enrollment_from_images,
    run_verification_from_images,
    PalmPipelineResult,
)
from storage import TemplateStore
from config import TEMPLATES_DIR, ENCRYPT_TEMPLATES


def decode_image(b64: str) -> np.ndarray:
    raw = base64.b64decode(b64)
    import cv2
    arr = np.frombuffer(raw, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Invalid image")
    return img


app = FastAPI(
    title="Multimodal Palm Recognition API",
    description="Palmprint + palm vein + hand geometry. Encrypted templates only; blockchain-ready.",
    version="1.0.0",
)

store = TemplateStore(base_dir=TEMPLATES_DIR, encrypt=ENCRYPT_TEMPLATES)


@app.on_event("startup")
def startup():
    init_pipeline()


class EnrollRequest(BaseModel):
    user_id: str
    images: List[str]


class VerifyRequest(BaseModel):
    user_id: str
    images: List[str]


class EnrollResponse(BaseModel):
    success: bool
    decision: str
    confidence: float
    message: str
    liveness_score: float = 0.0
    template_hash: Optional[str] = None


class VerifyResponse(BaseModel):
    success: bool
    decision: str
    confidence: float
    message: str
    match: bool
    liveness_score: float = 0.0
    similarity_score: float = 0.0
    template_hash: Optional[str] = None


@app.post("/enroll", response_model=EnrollResponse)
def enroll(req: EnrollRequest):
    if len(req.images) < ENROLLMENT_MIN_SAMPLES:
        raise HTTPException(400, detail=f"At least {ENROLLMENT_MIN_SAMPLES} images required.")
    try:
        images = [decode_image(b) for b in req.images]
    except Exception as e:
        raise HTTPException(400, detail=f"Invalid image: {e}")
    result = run_enrollment_from_images(req.user_id, images, min_samples=ENROLLMENT_MIN_SAMPLES, store=store)
    return EnrollResponse(
        success=result.decision == "accept",
        decision=result.decision,
        confidence=result.confidence,
        message=result.message,
        liveness_score=result.liveness_score,
        template_hash=result.template_hash if RESPONSE_INCLUDE_HASH else None,
    )


@app.post("/verify", response_model=VerifyResponse)
def verify(req: VerifyRequest):
    if not req.images:
        raise HTTPException(400, detail="At least one image required.")
    try:
        images = [decode_image(b) for b in req.images]
    except Exception as e:
        raise HTTPException(400, detail=f"Invalid image: {e}")
    result = run_verification_from_images(req.user_id, images, store=store)
    return VerifyResponse(
        success=result.decision == "accept" and result.match,
        decision=result.decision,
        confidence=result.confidence,
        message=result.message,
        match=result.match,
        liveness_score=result.liveness_score,
        similarity_score=result.similarity_score,
        template_hash=result.template_hash if RESPONSE_INCLUDE_HASH else None,
    )


@app.get("/health")
def health():
    return {"status": "ok"}


def run_server(host: str = API_HOST, port: int = API_PORT):
    import uvicorn
    uvicorn.run(app, host=host, port=port)


if __name__ == "__main__":
    run_server()
