"""
Configuration for the biometric face recognition system.
Tune thresholds, model paths, and security parameters here.
"""
from pathlib import Path
from typing import Optional

# Paths
BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"
TEMPLATES_DIR = BASE_DIR / "data" / "templates"  # encrypted templates only

# Capture
CAPTURE_FPS = 30
PREFER_DEPTH = True  # Use depth sensor when available (structured light / ToF / LiDAR)
DEPTH_ESTIMATION_FALLBACK = True  # RGB + depth estimation when no hardware depth
CAPTURE_RESOLUTION = (640, 480)  # width, height
DEPTH_RESOLUTION = (320, 240) if PREFER_DEPTH else None

# Liveness
LIVENESS_WINDOW_SEC = 2.0
LIVENESS_MIN_FRAMES = 45  # ~22.5 fps over 2s
BLINK_MIN_INTERVAL_SEC = 0.1
BLINK_MAX_INTERVAL_SEC = 0.4
DEPTH_CONSISTENCY_THRESHOLD = 0.15  # max normalized depth std for live face
TEXTURE_SPOOF_THRESHOLD = 0.35  # below = suspicious (flat/printed)
MICRO_MOTION_MIN_VARIANCE = 0.5  # pixel motion variance for live

# Embedding
EMBEDDING_DIM = 512  # ArcFace/MagFace typical
EMBEDDING_MODEL = "arcface"  # "arcface" | "magface" | "vit"
DEVICE = "cpu"  # "cuda" | "cpu" | "mps"
ON_DEVICE_INFERENCE = True
EDGE_FALLBACK_URL: Optional[str] = None  # optional edge/cloud verification URL

# Fusion
FUSION_WEIGHTS = {
    "rgb_embedding": 0.40,
    "depth_embedding": 0.25,
    "liveness_score": 0.20,
    "motion_consistency": 0.15,
}
USE_ATTENTION_FUSION = True  # learned attention over modalities
FUSION_MODEL_PATH: Optional[Path] = None  # optional trained fusion net

# Decision
ACCEPT_THRESHOLD = 0.85
REJECT_THRESHOLD = 0.45
RE_VERIFY_BAND = (0.45, 0.85)  # (reject, accept) — in between triggers re-verify
TARGET_FAR = 1e-5  # target false acceptance rate (banking-grade)
TARGET_FRR = 0.01  # target false rejection rate

# Security & storage
ENCRYPT_TEMPLATES = True
TEMPLATE_KEY_ENV = "BIOMETRIC_TEMPLATE_KEY"  # 32-byte hex key from env
NEVER_STORE_RAW_IMAGES = True
TEMPLATE_HASH_SALT_ENV = "BIOMETRIC_TEMPLATE_SALT"

# API
API_HOST = "0.0.0.0"
API_PORT = 8000
ENROLLMENT_MIN_SAMPLES = 3
VERIFICATION_TIMEOUT_SEC = 10
