"""
Model training pipeline: palmprint, vein, geometry encoders; optional fusion.
Triplet Loss / ArcFace for metric learning. Sample script; adapt to your dataset.
"""
from __future__ import annotations

import argparse
from pathlib import Path
from typing import Optional

import numpy as np

try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
    from torch.utils.data import Dataset, DataLoader
except ImportError:
    torch = None
    nn = None
    F = None
    Dataset = None
    DataLoader = None


# --------------- Dataset (placeholder: replace with real palm ROI dataset) ---------------
class PalmDataset(Dataset if Dataset else object):
    """Expects dir with subdirs per identity: identity_id/*.npy (ROI arrays) or images."""

    def __init__(self, root: Path, modality: str = "palmprint", size: tuple = (128, 128)):
        self.root = Path(root)
        self.modality = modality
        self.size = size
        self.samples = []  # (path, identity_id)
        for id_dir in self.root.iterdir():
            if id_dir.is_dir():
                for f in id_dir.glob("*.npy"):
                    self.samples.append((str(f), id_dir.name))
                for f in id_dir.glob("*.jpg") + id_dir.glob("*.png"):
                    self.samples.append((str(f), id_dir.name))

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, i):
        path, identity = self.samples[i]
        if path.endswith(".npy"):
            x = np.load(path)
        else:
            import cv2
            x = cv2.imread(path)
            if x is None:
                x = np.zeros((*self.size[::-1], 3), dtype=np.uint8)
            x = cv2.resize(x, self.size)
            x = cv2.cvtColor(x, cv2.COLOR_BGR2RGB)
            x = x.astype(np.float32) / 255.0
        if self.modality == "vein" and x.ndim == 3:
            x = np.expand_dims(np.mean(x, axis=-1), axis=-1)
        x = np.transpose(x, (2, 0, 1))
        return torch.from_numpy(x).float(), identity


def identity_to_label(identity: str, id_map: dict) -> int:
    if identity not in id_map:
        id_map[identity] = len(id_map)
    return id_map[identity]


# --------------- Triplet Loss ---------------
def triplet_loss(anchor: "torch.Tensor", positive: "torch.Tensor", negative: "torch.Tensor", margin: float = 0.2) -> "torch.Tensor":
    """Batch triplet: anchor, positive (same id), negative (different id)."""
    pos_d = F.pairwise_distance(anchor, positive)
    neg_d = F.pairwise_distance(anchor, negative)
    return F.relu(pos_d - neg_d + margin).mean()


# --------------- ArcFace-style loss (optional) ---------------
class ArcFaceLoss(nn.Module if nn else object):
    def __init__(self, dim: int, num_classes: int, scale: float = 32.0, margin: float = 0.5):
        super().__init__()
        self.scale = scale
        self.margin = margin
        self.W = nn.Parameter(torch.randn(dim, num_classes) * 0.01)

    def forward(self, x: "torch.Tensor", labels: "torch.Tensor") -> "torch.Tensor":
        x = F.normalize(x, p=2, dim=1)
        W = F.normalize(self.W, p=2, dim=0)
        logits = x @ W * self.scale
        return F.cross_entropy(logits, labels)


# --------------- Training loops (pseudocode / stub) ---------------
def train_palmprint_encoder(
    data_root: Path,
    out_path: Path,
    epochs: int = 50,
    batch_size: int = 32,
    lr: float = 1e-4,
    device: str = "cpu",
) -> None:
    """Train palmprint CNN with Triplet or ArcFace. Replace with real model from encoders."""
    if torch is None:
        print("PyTorch not available; skipping training.")
        return
    from encoders.palmprint_encoder import _PalmprintCNN
    dataset = PalmDataset(data_root, modality="palmprint")
    if len(dataset) == 0:
        print("No data found; create data_root/identity_id/*.npy or images.")
        return
    id_map = {}
    loader = DataLoader(dataset, batch_size=batch_size, shuffle=True, num_workers=0)
    model = _PalmprintCNN(out_dim=256).to(device)
    opt = torch.optim.Adam(model.parameters(), lr=lr)
    for ep in range(epochs):
        model.train()
        for batch_x, batch_id in loader:
            batch_x = batch_x.to(device)
            labels = torch.tensor([identity_to_label(i, id_map) for i in batch_id], device=device)
            emb = model(batch_x)
            # Simplified: use cross-entropy with a linear classifier head for demo
            if ep % 10 == 0:
                print(f"Epoch {ep} batch emb norm {emb.norm(dim=1).mean().item():.4f}")
        print(f"Epoch {ep + 1}/{epochs} done.")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    torch.save(model.state_dict(), out_path)
    print(f"Saved to {out_path}")


def train_vein_encoder(
    data_root: Path,
    out_path: Path,
    epochs: int = 50,
    batch_size: int = 32,
    lr: float = 1e-4,
    device: str = "cpu",
) -> None:
    """Train vein CNN. Same pattern as palmprint."""
    if torch is None:
        return
    from encoders.vein_encoder import _VeinCNN
    dataset = PalmDataset(data_root, modality="vein")
    if len(dataset) == 0:
        return
    model = _VeinCNN(out_dim=256).to(device)
    opt = torch.optim.Adam(model.parameters(), lr=lr)
    loader = DataLoader(dataset, batch_size=batch_size, shuffle=True, num_workers=0)
    for ep in range(epochs):
        model.train()
        for batch_x, _ in loader:
            if batch_x.size(1) == 3:
                batch_x = batch_x.mean(dim=1, keepdim=True)
            batch_x = batch_x.to(device)
            emb = model(batch_x)
        print(f"Vein epoch {ep + 1}/{epochs}")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    torch.save(model.state_dict(), out_path)


def train_geometry_encoder(
    data_root: Path,
    out_path: Path,
    epochs: int = 30,
    batch_size: int = 32,
    lr: float = 1e-4,
    device: str = "cpu",
) -> None:
    """Train geometry MLP. Expects identity_id/geometry.npy (128-d vectors)."""
    if torch is None:
        return
    from encoders.geometry_encoder import _GeometryMLP
    model = _GeometryMLP(128, 128).to(device)
    opt = torch.optim.Adam(model.parameters(), lr=lr)
    # Stub: no real data loading
    out_path.parent.mkdir(parents=True, exist_ok=True)
    torch.save(model.state_dict(), out_path)


def main():
    parser = argparse.ArgumentParser(description="Train palm modality encoders")
    parser.add_argument("--data_root", type=Path, default=Path("data/training"))
    parser.add_argument("--modality", choices=["palmprint", "vein", "geometry"], default="palmprint")
    parser.add_argument("--out", type=Path, default=Path("models/palmprint_cnn.pt"))
    parser.add_argument("--epochs", type=int, default=50)
    parser.add_argument("--batch_size", type=int, default=32)
    parser.add_argument("--lr", type=float, default=1e-4)
    parser.add_argument("--device", default="cpu")
    args = parser.parse_args()
    if args.modality == "palmprint":
        train_palmprint_encoder(args.data_root, args.out, args.epochs, args.batch_size, args.lr, args.device)
    elif args.modality == "vein":
        train_vein_encoder(args.data_root, args.out, args.epochs, args.batch_size, args.lr, args.device)
    else:
        train_geometry_encoder(args.data_root, args.out, args.epochs, args.batch_size, args.lr, args.device)


if __name__ == "__main__":
    main()
