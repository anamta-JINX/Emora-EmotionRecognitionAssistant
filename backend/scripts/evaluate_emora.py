# Allow both `python -m backend.scripts.<name>` and direct file execution.
from pathlib import Path
import sys

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import os
import numpy as np
import matplotlib.pyplot as plt

from tensorflow.keras.models import load_model
from sklearn.metrics import classification_report, confusion_matrix, ConfusionMatrixDisplay

from backend.app.config import BASE_MODEL_PATH, EVALUATION_OUTPUTS_DIR, PREPROCESSED_DIR

# -------------------------------------------------
# CONFIG
# -------------------------------------------------
MODEL_PATH = str(BASE_MODEL_PATH)
NPZ_PATH = str(PREPROCESSED_DIR / "images_labels.npz")
OUT_DIR = str(EVALUATION_OUTPUTS_DIR)

EMOTION_LABELS = [
    "Angry",
    "Disgust",
    "Fear",
    "Happy",
    "Sad",
    "Surprise",
    "Neutral"
]

os.makedirs(OUT_DIR, exist_ok=True)

# -------------------------------------------------
# LOAD NPZ (robust)
# -------------------------------------------------
def load_npz(npz_path):
    data = np.load(npz_path, allow_pickle=True)
    print("NPZ keys found:", list(data.keys()))

    # Try common names
    for x_key in ["images", "X", "X_test", "data"]:
        if x_key in data:
            X = data[x_key]
            break
    else:
        raise KeyError("❌ No image array found in NPZ")

    for y_key in ["labels", "y", "y_test", "targets"]:
        if y_key in data:
            y = data[y_key]
            break
    else:
        raise KeyError("❌ No label array found in NPZ")

    return X, y


# -------------------------------------------------
# FIX SHAPES & NORMALIZATION
# -------------------------------------------------
def prepare_arrays(X, y):
    X = X.astype("float32")

    # Normalize if needed
    if X.max() > 1.5:
        X = X / 255.0

    # Ensure shape = (N, H, W, 1)
    if len(X.shape) == 3:
        X = np.expand_dims(X, axis=-1)

    # Convert one-hot labels → integers
    if len(y.shape) == 2:
        y = np.argmax(y, axis=1)

    return X, y.astype(int)


# -------------------------------------------------
# MAIN
# -------------------------------------------------
def main():
    print("Loading model:", MODEL_PATH)
    model = load_model(MODEL_PATH)
    print("Model loaded ✅")

    X, y_true = load_npz(NPZ_PATH)
    X, y_true = prepare_arrays(X, y_true)

    print("Evaluating on", len(X), "samples")

    probs = model.predict(X, batch_size=64, verbose=1)
    y_pred = np.argmax(probs, axis=1)

    # -------------------------------------------------
    # REPORT
    # -------------------------------------------------
    print("\n--- CLASSIFICATION REPORT ---")
    report = classification_report(
        y_true,
        y_pred,
        target_names=EMOTION_LABELS,
        zero_division=0
    )
    print(report)

    # Save report
    with open(os.path.join(OUT_DIR, "classification_report.txt"), "w") as f:
        f.write(report)

    # -------------------------------------------------
    # CONFUSION MATRIX
    # -------------------------------------------------
    cm = confusion_matrix(y_true, y_pred)

    # Counts
    disp = ConfusionMatrixDisplay(cm, display_labels=EMOTION_LABELS)
    fig, ax = plt.subplots(figsize=(9, 7))
    disp.plot(ax=ax, cmap=None, values_format="d")
    ax.set_title("Confusion Matrix (Counts)")
    plt.xticks(rotation=45, ha="right")
    plt.tight_layout()
    plt.savefig(os.path.join(OUT_DIR, "confusion_counts.png"), dpi=200)
    plt.close()

    # Normalized
    cm_norm = cm.astype("float32")
    cm_norm /= cm_norm.sum(axis=1, keepdims=True)

    disp = ConfusionMatrixDisplay(cm_norm, display_labels=EMOTION_LABELS)
    fig, ax = plt.subplots(figsize=(9, 7))
    disp.plot(ax=ax, cmap=None, values_format=".2f")
    ax.set_title("Confusion Matrix (Normalized)")
    plt.xticks(rotation=45, ha="right")
    plt.tight_layout()
    plt.savefig(os.path.join(OUT_DIR, "confusion_normalized.png"), dpi=200)
    plt.close()

    # -------------------------------------------------
    # F1 BAR CHART
    # -------------------------------------------------
    report_dict = classification_report(
        y_true,
        y_pred,
        target_names=EMOTION_LABELS,
        output_dict=True,
        zero_division=0
    )

    f1_scores = [report_dict[label]["f1-score"] for label in EMOTION_LABELS]

    plt.figure(figsize=(9, 5))
    plt.bar(EMOTION_LABELS, f1_scores)
    plt.ylim(0, 1)
    plt.ylabel("F1 Score")
    plt.title("Per-class F1 Score")
    plt.xticks(rotation=45, ha="right")
    plt.tight_layout()
    plt.savefig(os.path.join(OUT_DIR, "f1_per_class.png"), dpi=200)
    plt.close()

    print("\n✅ Evaluation complete")
    print("Saved to:", OUT_DIR)


if __name__ == "__main__":
    main()
