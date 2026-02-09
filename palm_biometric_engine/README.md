# Multimodal Palm Recognition System

AI-powered multimodal palm recognition for secure identity authentication: **palmprint** (surface lines, ridges), **infrared palm vein** (subdermal), and **hand geometry** (shape, size, finger spacing). Designed for low FAR/FRR, liveness anti-spoofing, encrypted template storage, and blockchain/smart-contract–ready API.

---

## System Architecture Diagram

```
                    ┌─────────────────────────────────────────────────────────────────┐
                    │                     EDGE DEVICE (camera + IR + optional depth)    │
                    └─────────────────────────────────────────────────────────────────┘
                                                          │
         ┌───────────────────────────────────────────────┼───────────────────────────────────────────────┐
         │ CAPTURE (multimodal_capture.py)                │                                               │
         │   RGB (palmprint)  │  IR (vein)  │  Depth/Ultrasound (optional)                                │
         └───────────────────────────────────────────────┼───────────────────────────────────────────────┘
                                                          ▼
         ┌──────────────────────────────────────────────────────────────────────────────────────────────┐
         │ PREPROCESSING (preprocess/pipeline.py)                                                       │
         │   Noise reduction → Palm segmentation (skin/contour) → ROI extraction (palmprint + vein)    │
         │   Geometry features (bbox, aspect, area ratio)                                                │
         └──────────────────────────────────────────────────────────────────────────────────────────────┘
                                                          │
         ┌────────────────────────────────────────────────┼────────────────────────────────────────────┐
         │ LIVENESS (liveness/detector.py)                 │                                            │
         │   Texture (Laplacian) │ IR response │ Geometry consistency → is_live, score                 │
         └────────────────────────────────────────────────────────────────────────────────────────────┘
                                                          │
         ┌────────────────────────────────────────────────┼────────────────────────────────────────────┐
         │ FEATURE EXTRACTION (encoders/)                  │                                            │
         │   Palmprint CNN → 256-d  │  Vein CNN → 256-d  │  Geometry MLP → 128-d                       │
         └────────────────────────────────────────────────────────────────────────────────────────────┘
                                                          │
         ┌────────────────────────────────────────────────┼────────────────────────────────────────────┐
         │ FUSION (fusion/fusion.py)                      │                                            │
         │   Late-fusion or attention → single identity vector (512-d)                                   │
         └────────────────────────────────────────────────────────────────────────────────────────────┘
                                                          │
         ┌────────────────────────────────────────────────┼────────────────────────────────────────────┐
         │ MATCHING (matching/matcher.py)                  │                                            │
         │   Cosine similarity (or euclidean) probe vs reference                                        │
         └────────────────────────────────────────────────────────────────────────────────────────────┘
                                                          │
         ┌────────────────────────────────────────────────┼────────────────────────────────────────────┐
         │ DECISION (decision/engine.py)                   │                                            │
         │   accept (score ≥ 0.88 + liveness) | reject | re_verify                                      │
         └────────────────────────────────────────────────────────────────────────────────────────────┘
                                                          │
         ┌────────────────────────────────────────────────┼────────────────────────────────────────────┐
         │ STORAGE (storage/template_store.py)           │                                            │
         │   Encrypt identity vector only; template_hash for blockchain; no raw images                  │
         └────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Deliverables Overview

| Deliverable | Location |
|-------------|----------|
| **System architecture** | This README (diagram above); `config.py` |
| **Model training pipeline** | `training/train.py` (palmprint, vein, geometry; Triplet/ArcFace-ready) |
| **Inference pipeline** | `pipeline.py` (enrollment + verification from camera or images) |
| **Sample code: capture** | `capture/multimodal_capture.py` |
| **Sample code: preprocessing** | `preprocess/pipeline.py` (noise, segmentation, ROI) |
| **Sample code: matching** | `matching/matcher.py` (cosine similarity) |
| **API design** | `api_server.py` (FastAPI); see **API design** below |

---

## Model Training Pipeline

- **Palmprint**: CNN (or ViT) on 128×128 ROI; output 256-d. Train with Triplet Loss or ArcFace on identity labels.
- **Vein**: CNN on 128×128 IR ROI; 256-d. Same metric learning.
- **Geometry**: MLP on 128-d geometry feature vector; 128-d. Cross-entropy or metric learning.

Run from package root (`palm_biometric_engine`):

```bash
# Palmprint encoder
python training/train.py --modality palmprint --data_root data/training --out models/palmprint_cnn.pt --epochs 50

# Vein encoder
python training/train.py --modality vein --data_root data/training --out models/vein_cnn.pt --epochs 50

# Geometry encoder
python training/train.py --modality geometry --out models/geometry_mlp.pt --epochs 30
```

Dataset layout: `data/training/<identity_id>/*.npy` or `*.jpg` (ROI or full palm images). Replace with your own data loader and loss (e.g. ArcFace) as needed.

---

## Inference Pipeline

1. **Capture** multi-modal frames (RGB, IR, optional depth).
2. **Preprocess**: noise reduction, palm segmentation, ROI extraction, geometry features.
3. **Liveness**: texture + IR response + geometry consistency; reject if below threshold.
4. **Encode**: palmprint → 256-d, vein → 256-d, geometry → 128-d.
5. **Fuse**: late-fusion or attention → 512-d identity vector.
6. **Match**: cosine similarity with stored template.
7. **Decision**: accept / reject / re_verify using config thresholds and liveness.

Entry points:

- `run_enrollment(user_id)` / `run_enrollment_from_images(user_id, rgb_images, ir_images=None)`
- `run_verification(user_id)` / `run_verification_from_images(user_id, rgb_images, ir_images=None)`

---

## API Design (Authentication Requests)

Designed for **zero-trust** and future **blockchain/smart-contract** integration (e.g. binding claims to template hash).

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/enroll` | `{ "user_id": "<id>", "images": [ "<base64>" ] }` | `success`, `decision`, `confidence`, `message`, `liveness_score`, `template_hash` (optional) |
| POST | `/verify` | `{ "user_id": "<id>", "images": [ "<base64>" ] }` | `success`, `decision`, `match`, `confidence`, `similarity_score`, `liveness_score`, `template_hash` (optional) |
| GET | `/health` | - | `{ "status": "ok" }` |

- **Enrollment**: at least `ENROLLMENT_MIN_SAMPLES` images; server computes identity vector, stores **encrypted template only**, returns `template_hash` for on-chain binding.
- **Verification**: 1+ images; server compares to stored template; returns `match`, `similarity_score`, and optionally `template_hash` so a smart contract can verify the same template was used (hash commitment).
- **Blockchain use**: Store `template_hash` on-chain at enrollment; on verify, include hash in response so contract can check consistency without exposing the template.

Run API (from repository root so package imports resolve):

```bash
cd palm_biometric_engine
pip install -r requirements.txt
set PALM_BIOMETRIC_TEMPLATE_KEY=<32-byte-hex>
python api_server.py
# Or from repo root: python -m palm_biometric_engine.api_server
# Or: uvicorn api_server:app --host 0.0.0.0 --port 8010  (from palm_biometric_engine dir)
```

---

## Security & Privacy (GDPR-Style; Zero-Trust)

- **No raw biometric images** stored after enrollment; only encrypted identity vectors (templates).
- **Encryption**: Templates encrypted with key from `PALM_BIOMETRIC_TEMPLATE_KEY`; optional salt via `PALM_BIOMETRIC_TEMPLATE_SALT`.
- **Template hash**: Deterministic SHA-256 of template (with salt) for commitment/verification in smart contracts; no reverse from hash.
- **Liveness**: Reduces spoofing (photos, prints, silicone molds) via texture, IR response, and geometry consistency.
- **FAR/FRR**: Tune `ACCEPT_THRESHOLD` (default 0.88) and `REJECT_THRESHOLD` (0.42) in `config.py` for target FAR (e.g. 1e-5) and FRR.

---

## Configuration (`config.py`)

- **Capture**: resolutions for RGB/IR, depth on/off.
- **Preprocessing**: ROI sizes, noise kernel, segmentation threshold.
- **Liveness**: texture/IR/geometry thresholds.
- **Encoders**: embedding dims (256, 256, 128), device.
- **Fusion**: type (late_fusion / attention), weights, identity dim (512).
- **Matching**: metric (cosine / euclidean), accept/reject thresholds.
- **Security**: encrypt flag, key/salt env vars.
- **API**: host, port, min enrollment samples, `RESPONSE_INCLUDE_HASH` for blockchain.

---

## Real-Time and Accuracy

- **&lt;1 s response**: Inference pipeline is sequential; for real-time, run on GPU (`DEVICE=cuda`), reduce ROI size or batch encoders; optional TensorRT/ONNX export.
- **Low FAR**: Increase `ACCEPT_THRESHOLD`; enforce minimum liveness.
- **Low FRR**: Slightly lower accept threshold; ensure good ROI and lighting in capture; train encoders with Triplet/ArcFace on your dataset.

This system is ready to integrate with **blockchain-based identity** or **smart-contract execution** by using `template_hash` in enroll/verify responses for commitment and verification without exposing biometric data.
