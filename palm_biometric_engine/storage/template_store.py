"""
Store only encrypted biometric templates (identity vectors). Never raw images.
Optional template hash for blockchain/smart-contract verification.
"""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
from typing import Optional, Tuple

import numpy as np

try:
    from cryptography.fernet import Fernet
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
    from cryptography.hazmat.backends import default_backend
    FERNET_AVAILABLE = True
except ImportError:
    FERNET_AVAILABLE = False


def _get_key(salt: Optional[bytes] = None) -> bytes:
    key_hex = os.environ.get("PALM_BIOMETRIC_TEMPLATE_KEY", "")
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
        return kdf.derive(os.environ.get("PALM_BIOMETRIC_TEMPLATE_KEY", "default-palm-dev-key").encode())
    return b"0" * 32


def _make_fernet(key: bytes) -> "Fernet":
    import base64
    b64 = base64.urlsafe_b64encode(key[:32].ljust(32, b"\0"))
    return Fernet(b64)


def template_hash(vector: np.ndarray, salt: str = "") -> str:
    """Deterministic hash of template for blockchain/smart-contract binding."""
    data = vector.astype(np.float32).tobytes() + salt.encode()
    return hashlib.sha256(data).hexdigest()


def encrypt_template(data: bytes) -> bytes:
    salt = os.environ.get("PALM_BIOMETRIC_TEMPLATE_SALT", "palm-biometric-salt").encode()
    key = _get_key(salt)
    if not FERNET_AVAILABLE:
        return hashlib.sha256(data + key).digest() + data
    return _make_fernet(key).encrypt(data)


def decrypt_template(encrypted: bytes) -> bytes:
    salt = os.environ.get("PALM_BIOMETRIC_TEMPLATE_SALT", "palm-biometric-salt").encode()
    key = _get_key(salt)
    if not FERNET_AVAILABLE:
        return encrypted[32:] if len(encrypted) > 32 else b""
    return _make_fernet(key).decrypt(encrypted)


def template_to_bytes(vector: np.ndarray) -> bytes:
    """Serialize identity vector only (no images)."""
    return json.dumps({
        "vec": vector.astype(np.float32).tobytes().hex(),
        "shape": list(vector.shape),
    }).encode("utf-8")


def bytes_to_template(data: bytes) -> np.ndarray:
    raw = json.loads(data.decode("utf-8"))
    return np.frombuffer(bytes.fromhex(raw["vec"]), dtype=np.float32).reshape(raw["shape"])


class TemplateStore:
    def __init__(self, base_dir: Optional[Path] = None, encrypt: bool = True):
        self.base_dir = Path(base_dir) if base_dir else Path(__file__).resolve().parent.parent / "data" / "templates"
        self.base_dir.mkdir(parents=True, exist_ok=True)
        self.encrypt = encrypt

    def _path(self, user_id: str) -> Path:
        safe = hashlib.sha256(user_id.encode()).hexdigest()[:16]
        return self.base_dir / f"{safe}.bin"

    def save(self, user_id: str, vector: np.ndarray, store_hash: bool = True) -> str:
        data = template_to_bytes(vector)
        if store_hash:
            h = template_hash(vector)
            meta = {"hash": h}
            path_meta = self._path(user_id).with_suffix(".meta")
            path_meta.write_text(json.dumps(meta))
        if self.encrypt:
            data = encrypt_template(data)
        self._path(user_id).write_bytes(data)
        return template_hash(vector)

    def load(self, user_id: str) -> Optional[Tuple[np.ndarray, Optional[str]]]:
        p = self._path(user_id)
        if not p.exists():
            return None
        data = p.read_bytes()
        if self.encrypt:
            data = decrypt_template(data)
        vec = bytes_to_template(data)
        meta_path = p.with_suffix(".meta")
        h = None
        if meta_path.exists():
            meta = json.loads(meta_path.read_text())
            h = meta.get("hash")
        return vec, h

    def delete(self, user_id: str) -> bool:
        p = self._path(user_id)
        meta = p.with_suffix(".meta")
        ok = False
        if p.exists():
            p.unlink()
            ok = True
        if meta.exists():
            meta.unlink()
        return ok


def enroll_palm_template(store: TemplateStore, user_id: str, vector: np.ndarray) -> str:
    """Store encrypted template; return template hash for blockchain."""
    return store.save(user_id, vector, store_hash=True)


def verify_palm_template(
    store: TemplateStore,
    user_id: str,
    probe_vector: np.ndarray,
    threshold: float = 0.88,
) -> Tuple[bool, float, Optional[str]]:
    """Load template, compute similarity, return (match, score, template_hash)."""
    loaded = store.load(user_id)
    if loaded is None:
        return False, 0.0, None
    ref_vec, template_hash = loaded
    from ..matching.matcher import cosine_similarity
    score = cosine_similarity(probe_vector, ref_vec)
    return score >= threshold, float(score), template_hash
