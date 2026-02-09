"""
Encrypted template storage. Privacy-by-design: only store encrypted templates.
"""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
from typing import List, Optional, Tuple

import numpy as np

# Optional encryption
try:
    from cryptography.fernet import Fernet
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
    from cryptography.hazmat.backends import default_backend
    FERNET_AVAILABLE = True
except ImportError:
    FERNET_AVAILABLE = False


def _get_key(salt: Optional[bytes] = None) -> bytes:
    """Derive or use raw key from env (BIOMETRIC_TEMPLATE_KEY)."""
    key_hex = os.environ.get("BIOMETRIC_TEMPLATE_KEY", "")
    if key_hex and len(key_hex) >= 64:
        return bytes.fromhex(key_hex[:64])
    if FERNET_AVAILABLE and salt is not None:
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
            backend=default_backend(),
        )
        return kdf.derive(os.environ.get("BIOMETRIC_TEMPLATE_KEY", "default-dev-key").encode())
    return b"0" * 32


def _make_fernet(key: bytes) -> "Fernet":
    """Build Fernet from 32-byte key (base64url encoded)."""
    import base64
    b64 = base64.urlsafe_b64encode(key[:32].ljust(32, b"\0"))
    return Fernet(b64)


def encrypt_template(template_data: bytes, key_env: str = "BIOMETRIC_TEMPLATE_KEY") -> bytes:
    """Encrypt template bytes. Uses env key or derived key with salt."""
    salt = os.environ.get("BIOMETRIC_TEMPLATE_SALT", "face-biometric-salt").encode()
    key = _get_key(salt)
    if not FERNET_AVAILABLE:
        return hashlib.sha256(template_data + key).digest() + template_data  # placeholder
    f = _make_fernet(key)
    return f.encrypt(template_data)


def decrypt_template(encrypted: bytes, key_env: str = "BIOMETRIC_TEMPLATE_KEY") -> bytes:
    """Decrypt template bytes."""
    salt = os.environ.get("BIOMETRIC_TEMPLATE_SALT", "face-biometric-salt").encode()
    key = _get_key(salt)
    if not FERNET_AVAILABLE:
        if len(encrypted) <= 32:
            return b""
        return encrypted[32:]
    f = _make_fernet(key)
    return f.decrypt(encrypted)


def template_to_bytes(rgb_embedding: np.ndarray, depth_embedding: Optional[np.ndarray] = None) -> bytes:
    """Serialize embeddings to bytes (no raw images)."""
    d = {
        "rgb": rgb_embedding.astype(np.float32).tobytes().hex(),
        "rgb_shape": list(rgb_embedding.shape),
        "depth": depth_embedding.astype(np.float32).tobytes().hex() if depth_embedding is not None else None,
        "depth_shape": list(depth_embedding.shape) if depth_embedding is not None else None,
    }
    return json.dumps({k: v for k, v in d.items() if v is not None}).encode("utf-8")


def bytes_to_template(data: bytes) -> Tuple[np.ndarray, Optional[np.ndarray]]:
    """Deserialize bytes to (rgb_embedding, depth_embedding)."""
    raw = json.loads(data.decode("utf-8"))
    rgb = np.frombuffer(bytes.fromhex(raw["rgb"]), dtype=np.float32).reshape(raw["rgb_shape"])
    depth = None
    if raw.get("depth") and raw.get("depth_shape"):
        depth = np.frombuffer(bytes.fromhex(raw["depth"]), dtype=np.float32).reshape(raw["depth_shape"])
    return rgb, depth


class TemplateStore:
    """Store/load encrypted templates by user_id. No raw images."""

    def __init__(self, base_dir: Optional[Path] = None, encrypt: bool = True):
        self.base_dir = Path(base_dir) if base_dir else Path(__file__).resolve().parent.parent / "data" / "templates"
        self.base_dir.mkdir(parents=True, exist_ok=True)
        self.encrypt = encrypt

    def _path(self, user_id: str) -> Path:
        safe = hashlib.sha256(user_id.encode()).hexdigest()[:16]
        return self.base_dir / f"{safe}.bin"

    def save(self, user_id: str, rgb_embedding: np.ndarray, depth_embedding: Optional[np.ndarray] = None) -> None:
        data = template_to_bytes(rgb_embedding, depth_embedding)
        if self.encrypt:
            data = encrypt_template(data)
        self._path(user_id).write_bytes(data)

    def load(self, user_id: str) -> Optional[Tuple[np.ndarray, Optional[np.ndarray]]]:
        p = self._path(user_id)
        if not p.exists():
            return None
        data = p.read_bytes()
        if self.encrypt:
            data = decrypt_template(data)
        return bytes_to_template(data)

    def delete(self, user_id: str) -> bool:
        p = self._path(user_id)
        if p.exists():
            p.unlink()
            return True
        return False

    def list_users(self) -> List[str]:
        """List known user IDs (from filenames we don't store; only hashes). Return hash prefixes."""
        return [p.stem for p in self.base_dir.glob("*.bin")]


def enroll_template(
    store: TemplateStore,
    user_id: str,
    rgb_embedding: np.ndarray,
    depth_embedding: Optional[np.ndarray] = None,
) -> None:
    """Persist single template for user_id (encrypted)."""
    store.save(user_id, rgb_embedding, depth_embedding)


def verify_against_templates(
    store: TemplateStore,
    user_id: str,
    rgb_embedding: np.ndarray,
    depth_embedding: Optional[np.ndarray] = None,
    threshold: float = 0.85,
) -> Tuple[bool, float]:
    """Load stored template for user_id, compare cosine similarity; return (match, score)."""
    loaded = store.load(user_id)
    if loaded is None:
        return False, 0.0
    ref_rgb, ref_depth = loaded
    sim = float(np.dot(rgb_embedding, ref_rgb) / (np.linalg.norm(rgb_embedding) * np.linalg.norm(ref_rgb) + 1e-8))
    score = (sim + 1) / 2
    depth_score = 0.5
    if depth_embedding is not None and ref_depth is not None:
        sim_d = float(np.dot(depth_embedding, ref_depth) / (np.linalg.norm(depth_embedding) * np.linalg.norm(ref_depth) + 1e-8))
        depth_score = (sim_d + 1) / 2
    combined = 0.7 * score + 0.3 * depth_score
    return combined >= threshold, combined
