"""
Configuration for Multimodal Palm Recognition.
Tune modalities, ROI, encoders, fusion, security, and API.
"""
from pathlib import Path
from typing import Optional

# Paths
BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"
DATA_DIR = BASE_DIR / "data"
TEMPLATES_DIR = DATA_DIR / "templates"  # encrypted only
TRAINING_DIR = DATA_DIR / "training"

# Capture (edge: camera + IR + optional depth/ultrasound)
CAPTURE_RGB_RESOLUTION = (640, 480)
CAPTURE_IR_RESOLUTION = (320, 240)
CAPTURE_DEPTH_AVAILABLE = False  # set True when depth/ultrasound sensor present
PREFER_IR_FOR_VEIN = True

# Preprocessing
ROI_PALMPRINT_SIZE = (128, 128)   # palmprint ROI
ROI_VEIN_SIZE = (128, 128)        # vein ROI (from IR)
NOISE_REDUCTION_KERNEL = (5, 5)   # Gaussian/blur
SEGMENTATION_CONFIDENCE = 0.5      # palm detector threshold
NORMALIZE_PERCENTILE = (2, 98)    # clip for contrast

# Liveness
LIVENESS_TEXTURE_MIN = 0.3        # Laplacian variance (flat = spoof)
LIVENESS_IR_RESPONSE_MIN = 0.2   # IR must show vein-like structure
LIVENESS_GEOMETRY_CONSISTENCY = 0.6  # shape stability across frames

# Encoders (separate models per modality)
EMBEDDING_DIM_PALMPRINT = 256
EMBEDDING_DIM_VEIN = 256
EMBEDDING_DIM_GEOMETRY = 128
IDENTITY_DIM = 512                # fused identity vector size
DEVICE = "cpu"                    # cuda | cpu | mps

# Fusion
FUSION_TYPE = "attention"         # "late_fusion" | "attention"
FUSION_WEIGHTS = {
    "palmprint": 0.40,
    "vein": 0.35,
    "geometry": 0.25,
}
ATTENTION_DIM = 64

# Matching
MATCHING_METRIC = "cosine"        # cosine | euclidean
ACCEPT_THRESHOLD = 0.88           # low FAR
REJECT_THRESHOLD = 0.42           # clear reject
RE_VERIFY_BAND = (0.42, 0.88)
TARGET_FAR = 1e-5
TARGET_FRR = 0.01

# Training
BATCH_SIZE = 32
TRIPLET_MARGIN = 0.2
ARCFACE_SCALE = 32.0
ARCFACE_MARGIN = 0.5
LEARNING_RATE = 1e-4
EPOCHS_PALMPRINT = 50
EPOCHS_VEIN = 50
EPOCHS_GEOMETRY = 30
EPOCHS_FUSION = 20

# Security & privacy (GDPR-style, zero-trust)
ENCRYPT_TEMPLATES = True
TEMPLATE_KEY_ENV = "PALM_BIOMETRIC_TEMPLATE_KEY"
NEVER_STORE_RAW_IMAGES = True
TEMPLATE_HASH_SALT_ENV = "PALM_BIOMETRIC_TEMPLATE_SALT"
TOKEN_MAX_AGE_SEC = 300           # for future blockchain/smart-contract binding

# API (authentication requests; blockchain-ready)
API_HOST = "0.0.0.0"
API_PORT = 8010
ENROLLMENT_MIN_SAMPLES = 3
INFERENCE_TIMEOUT_SEC = 1.0       # real-time <1s
RESPONSE_INCLUDE_HASH = True      # for smart-contract verification
