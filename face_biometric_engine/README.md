# Secure Biometric Face Recognition Engine

AI-powered 3D face scanning with liveness detection and deep-learning fusion. Suitable for banking, identity, and access-control systems.

## Architecture (modular pipeline)

```
Capture → Preprocess → Liveness → Embedding → Fusion → Decision
    ↓           ↓           ↓           ↓          ↓          ↓
 (3D/depth)  (align)   (anti-spoof)  (ArcFace)  (weighted)  (accept/reject/re-verify)
                                                      ↓
                                              [Encrypted template storage]
```

- **Capture**: Depth sensors (structured light / ToF / LiDAR) when available; fallback to RGB + depth estimation.
- **Preprocess**: Face detection, crop, align, resize to 112×112 (RGB and depth).
- **Liveness**: Depth consistency, micro-motion, blink, texture analysis to resist photos, videos, masks, deepfakes.
- **Embedding**: 512-d normalized vectors (ArcFace/MagFace/ViT-style; placeholder CNN included).
- **Fusion**: Weighted combination of RGB similarity, depth similarity, liveness score, motion consistency.
- **Decision**: Accept (score ≥ 0.85), Reject (≤ 0.45), Re-verify (in between).
- **Storage**: Only encrypted facial templates; raw images are never stored (privacy-by-design).

## Model selection rationale

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Embedding** | ArcFace / MagFace / ViT | ArcFace: strong angular margin, SOTA on LFW/CFP. MagFace: magnitude-aware for quality. ViT: good for transfer and robustness. Default 512-d fits all. |
| **Liveness** | Multi-cue (depth + motion + texture + blink) | Single-cue spoofing is easy; fusion of depth consistency, micro-motion, texture (Laplacian), and blink reduces photo/video/mask attacks. |
| **Fusion** | Weighted (configurable) + optional attention | Interpretable weights (e.g. 0.4 RGB, 0.25 depth, 0.2 liveness, 0.15 motion); attention can be added for learned modality importance. |
| **Decision** | Two thresholds + band | Accept threshold (0.85) for low FAR; reject (0.45) for clear denies; band triggers re-verify to reduce FRR in edge cases. |

## Pseudocode

### Enrollment
```
1. Capture N ≥ ENROLLMENT_MIN_SAMPLES frames (or receive N images via API).
2. For each frame:
   a. Preprocess → face_rgb, face_depth, one face required.
   b. Liveness check → skip if score < 0.5.
   c. Extract embedding (RGB + optional depth).
3. Aggregate: mean(rgb_embeddings) → ref_rgb; mean(depth_embeddings) → ref_depth; L2-normalize.
4. Serialize (ref_rgb, ref_depth) → bytes; encrypt with BIOMETRIC_TEMPLATE_KEY.
5. Store encrypted template by user_id (never store raw images).
6. Return success / failure and liveness score.
```

### Verification
```
1. Load encrypted template for user_id; decrypt to (ref_rgb, ref_depth).
2. Capture one or more frames (or receive images via API).
3. For each frame:
   a. Preprocess → face_rgb, face_depth.
   b. Liveness check → skip if score < 0.4.
   c. Extract embedding.
   d. Fuse: score = w_rgb*sim(rgb,ref_rgb) + w_depth*sim(depth,ref_depth) + w_live*liveness + w_motion*motion.
   e. Decide: accept if score ≥ 0.85, reject if ≤ 0.45, else re_verify.
   f. If accept, break.
4. Optionally compare final embedding to stored template again for match flag.
5. Return decision, confidence, message, liveness_score, fusion_score.
```

## Security considerations

- **Templates only**: Only encrypted facial templates (embeddings) are stored; raw images are never persisted.
- **Encryption**: Template bytes encrypted with key from `BIOMETRIC_TEMPLATE_KEY` (32-byte hex); optional salt via `BIOMETRIC_TEMPLATE_SALT`. Use Fernet (cryptography) when available.
- **FAR/FRR**: Tune `ACCEPT_THRESHOLD` (default 0.85) and `REJECT_THRESHOLD` (0.45) for target FAR (e.g. 1e-5) and FRR (e.g. 1%). Higher accept threshold → lower FAR, higher FRR.
- **Liveness**: Reduces photo, video, mask, and simple deepfake attacks via depth + motion + texture + blink.
- **On-device**: Embedding and liveness run on-device by default; optional edge/cloud fallback via `EDGE_FALLBACK_URL` for heavy models.

## API

- **POST /enroll**: Body `{ "user_id": "<id>", "images": [ "<base64>" ] }`. At least `ENROLLMENT_MIN_SAMPLES` images. Returns `decision`, `confidence`, `message`, `liveness_score`.
- **POST /verify**: Body `{ "user_id": "<id>", "images": [ "<base64>" ] }`. Returns `decision`, `confidence`, `match`, `liveness_score`, `fusion_score`.
- **GET /health**: Health check.

Run from package root:
```bash
cd face_biometric_engine
pip install -r requirements.txt
set BIOMETRIC_TEMPLATE_KEY=<32-byte-hex>   # optional; dev uses default
python -m api_server
# or: uvicorn api_server:app --host 0.0.0.0 --port 8000
```

## Configuration (`config.py`)

- Capture: `PREFER_DEPTH`, `DEPTH_ESTIMATION_FALLBACK`, `CAPTURE_RESOLUTION`.
- Liveness: `TEXTURE_SPOOF_THRESHOLD`, `DEPTH_CONSISTENCY_THRESHOLD`, `MICRO_MOTION_MIN_VARIANCE`.
- Embedding: `EMBEDDING_DIM` (512), `EMBEDDING_MODEL`, `DEVICE`.
- Fusion: `FUSION_WEIGHTS`, `USE_ATTENTION_FUSION`.
- Decision: `ACCEPT_THRESHOLD`, `REJECT_THRESHOLD`, `RE_VERIFY_BAND`.
- Security: `ENCRYPT_TEMPLATES`, `TEMPLATE_KEY_ENV`, `NEVER_STORE_RAW_IMAGES`.
- API: `API_HOST`, `API_PORT`, `ENROLLMENT_MIN_SAMPLES`.

## Optimisation notes

- **Accuracy**: Use production embedding models (ArcFace/MagFace/ViT) and train fusion weights on your dataset; tune thresholds for target FAR/FRR.
- **Real-time**: On-device inference with PyTorch/TensorFlow; reduce resolution and batch size; optional TensorRT/ONNX for deployment.
- **Low FAR**: Increase `ACCEPT_THRESHOLD` and enforce strong liveness (e.g. reject if liveness < 0.6).
