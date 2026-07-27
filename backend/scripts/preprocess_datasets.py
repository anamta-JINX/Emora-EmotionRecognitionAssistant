# preprocess_datasets.py
# Allow both `python -m backend.scripts.<name>` and direct file execution.
from pathlib import Path
import sys

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import os
import cv2
import numpy as np
import pandas as pd
from tensorflow.keras.utils import to_categorical

from backend.app.config import DATASETS_DIR, PREPROCESSED_DIR

# -----------------------------
# Paths (match your screenshot)
# -----------------------------
DATASET_ROOT_CANDIDATES = [
    DATASETS_DIR,
    DATASETS_DIR / "Facial Expressions",
]


def _dataset_path(*parts):
    for root in DATASET_ROOT_CANDIDATES:
        candidate = root.joinpath(*parts)
        if candidate.exists():
            return candidate
    return DATASET_ROOT_CANDIDATES[0].joinpath(*parts)


FER_PATH = _dataset_path("fer", "fer2013.csv")
CK_ROOT = _dataset_path("ck")
RAF_ROOT = _dataset_path("rafdb")  # DATASET/train/1..7 and DATASET/test/1..7

PREPROCESSED_PATH = PREPROCESSED_DIR
PREPROCESSED_PATH.mkdir(parents=True, exist_ok=True)

# -----------------------------
# Unified 7-class label order
# -----------------------------
# 0 Angry, 1 Disgust, 2 Fear, 3 Happy, 4 Sad, 5 Surprise, 6 Neutral
CLASS_NAMES = ["angry", "disgust", "fear", "happy", "sad", "surprise", "neutral"]
N_CLASSES = 7
IMG_SIZE = (48, 48)

def is_image_file(fn: str) -> bool:
    fn = fn.lower()
    return fn.endswith((".png", ".jpg", ".jpeg", ".bmp", ".tif", ".tiff"))

def add_image(X_list, y_list, img_gray, label_idx):
    img_gray = cv2.resize(img_gray, IMG_SIZE)
    img_gray = img_gray.astype(np.float32) / 255.0
    img_gray = np.expand_dims(img_gray, axis=-1)  # (48,48,1)
    X_list.append(img_gray)
    y_list.append(label_idx)

# -----------------------------
# 1) FER2013
# -----------------------------
print("Loading FER2013...")
fer_df = pd.read_csv(FER_PATH)

X_fer, y_fer = [], []
for _, row in fer_df.iterrows():
    pixels = np.fromstring(row["pixels"], sep=" ", dtype=np.uint8).reshape(48, 48)
    label = int(row["emotion"])  # FER order: angry, disgust, fear, happy, sad, surprise, neutral
    add_image(X_fer, y_fer, pixels, label)

X_fer = np.array(X_fer, dtype=np.float32)
y_fer = to_categorical(np.array(y_fer, dtype=np.int32), num_classes=N_CLASSES)
print(f"FER: X={X_fer.shape}, y={y_fer.shape}")

# -----------------------------
# 2) CK+ (folder-based)
# -----------------------------
print("Loading CK+...")

ck_name_to_label = {
    "anger": 0,
    "angry": 0,
    "disgust": 1,
    "fear": 2,
    "happy": 3,
    "happiness": 3,
    "sad": 4,
    "sadness": 4,
    "surprise": 5,
    "neutral": 6,
    # "contempt" not in our 7 classes -> ignore
}

ck_candidate_roots = [
    os.path.join(CK_ROOT, "CK+48"),
    os.path.join(CK_ROOT, "ck"),
    os.path.join(CK_ROOT, "CK+"),
]

X_ck, y_ck = [], []
for base in ck_candidate_roots:
    if not os.path.isdir(base):
        continue

    for folder in os.listdir(base):
        folder_path = os.path.join(base, folder)
        if not os.path.isdir(folder_path):
            continue

        key = folder.strip().lower()
        if key not in ck_name_to_label:
            continue

        label_idx = ck_name_to_label[key]
        for fn in os.listdir(folder_path):
            if not is_image_file(fn):
                continue
            img_path = os.path.join(folder_path, fn)
            img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
            if img is None:
                continue
            add_image(X_ck, y_ck, img, label_idx)

X_ck = np.array(X_ck, dtype=np.float32)
y_ck = to_categorical(np.array(y_ck, dtype=np.int32), num_classes=N_CLASSES)
print(f"CK+: X={X_ck.shape}, y={y_ck.shape}")

# -----------------------------
# 3) RAF-DB (YOUR folder labels)
# -----------------------------
print("Loading RAF-DB...")

# Your mapping:
# 1 Angry, 2 Disgust, 3 Fear, 4 Happy, 5 Neutral, 6 Sad, 7 Surprise
# Our unified labels:
# 0 Angry, 1 Disgust, 2 Fear, 3 Happy, 4 Sad, 5 Surprise, 6 Neutral
raf_folder_to_label = {
    "1": 0,  # angry
    "2": 1,  # disgust
    "3": 2,  # fear
    "4": 3,  # happy
    "5": 6,  # neutral
    "6": 4,  # sad
    "7": 5,  # surprise
}

raf_splits = [
    os.path.join(RAF_ROOT, "DATASET", "train"),
    os.path.join(RAF_ROOT, "DATASET", "test"),
]

X_raf, y_raf = [], []
for split_dir in raf_splits:
    if not os.path.isdir(split_dir):
        continue

    for class_folder in os.listdir(split_dir):
        class_path = os.path.join(split_dir, class_folder)
        if not os.path.isdir(class_path):
            continue

        if class_folder not in raf_folder_to_label:
            continue

        label_idx = raf_folder_to_label[class_folder]

        for fn in os.listdir(class_path):
            if not is_image_file(fn):
                continue
            img_path = os.path.join(class_path, fn)
            img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
            if img is None:
                continue
            add_image(X_raf, y_raf, img, label_idx)

X_raf = np.array(X_raf, dtype=np.float32)
y_raf = to_categorical(np.array(y_raf, dtype=np.int32), num_classes=N_CLASSES)
print(f"RAF-DB: X={X_raf.shape}, y={y_raf.shape}")

# -----------------------------
# 4) Combine + overwrite NPZ
# -----------------------------
X_all = np.concatenate([X_fer, X_ck, X_raf], axis=0)
y_all = np.concatenate([y_fer, y_ck, y_raf], axis=0)

out_path = os.path.join(PREPROCESSED_PATH, "images_labels.npz")
np.savez_compressed(out_path, X=X_all, y=y_all)

print("\n✅ Done!")
print(f"Combined: X={X_all.shape}, y={y_all.shape}")
print(f"Saved (overwritten): {out_path}")
