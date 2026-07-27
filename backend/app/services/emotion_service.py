"""Core EMORA emotion-recognition and feedback-training logic."""

from __future__ import annotations

import csv
import os
import shutil
import threading
from datetime import datetime
from pathlib import Path

import cv2
import numpy as np

from backend.app.config import BASE_MODEL_PATH, FEEDBACK_DATA_DIR, FEEDBACK_MODEL_PATH

FINE_TUNE_EPOCHS = 5
FINE_TUNE_BATCH = 32
FINE_TUNE_LR = 1e-4
ENSEMBLE_ALPHA = 0.45

EMOTION_LABELS = [
    "Angry",
    "Disgust",
    "Fear",
    "Happy",
    "Sad",
    "Surprise",
    "Neutral",
]
# Backwards-compatible name used by the original scripts.
emotion_labels = EMOTION_LABELS

FEEDBACK_DIR = Path(FEEDBACK_DATA_DIR)
FEEDBACK_CSV = FEEDBACK_DIR / "feedback.csv"

_base_model = None
_feedback_model = None
_models_loaded = False
_model_lock = threading.Lock()

face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)
clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
_GAMMA_15_TABLE = np.array([
    ((value / 255.0) ** (1.0 / 1.5)) * 255 for value in range(256)
]).astype("uint8")
WEBCAM_MAX_WIDTH = 640


def _load_model(path: Path, *, compile_model: bool = False):
    from tensorflow.keras.models import load_model

    return load_model(str(path), compile=compile_model)


def _run_model(model, model_input):
    """Run one tiny batch without Keras predict() dataset/setup overhead."""
    try:
        output = model(model_input, training=False)
        if hasattr(output, "numpy"):
            output = output.numpy()
        return np.asarray(output)[0]
    except (TypeError, AttributeError):
        return model.predict(model_input, verbose=0)[0]


def _warm_model(model) -> None:
    """Trace/allocate the model once so the first real frame stays fast."""
    if model is not None:
        _run_model(model, np.zeros((1, 48, 48, 1), dtype="float32"))


def _load_models(force: bool = False):
    """Load the base/feedback models once, on the first prediction request."""
    global _base_model, _feedback_model, _models_loaded

    if _models_loaded and not force:
        return _base_model, _feedback_model

    with _model_lock:
        if _models_loaded and not force:
            return _base_model, _feedback_model

        base_path = Path(BASE_MODEL_PATH)
        if not base_path.exists():
            raise FileNotFoundError(
                f"Missing base model: {base_path}. "
                "Place emora_model.h5 inside backend/models/."
            )

        _base_model = _load_model(base_path)
        _warm_model(_base_model)
        print("Base emotion model loaded and warmed successfully:", base_path)

        feedback_path = Path(FEEDBACK_MODEL_PATH)
        _feedback_model = None
        if feedback_path.exists():
            try:
                _feedback_model = _load_model(feedback_path)
                _warm_model(_feedback_model)
                print("Feedback model loaded and warmed:", feedback_path)
            except Exception as exc:
                print("[WARN] Feedback model exists but could not be loaded.")
                print("Delete it and retrain. Reason:", exc)
        else:
            print("No feedback model found yet. It will be created after feedback training.")

        _models_loaded = True
        return _base_model, _feedback_model


def preload_models():
    """Load and warm models before Flask starts accepting requests."""
    return _load_models()


def reload_models():
    """Reload model files after they are replaced on disk."""
    return _load_models(force=True)


def adjust_gamma(image, gamma: float = 1.5):
    if gamma == 1.5:
        return cv2.LUT(image, _GAMMA_15_TABLE)
    inv_gamma = 1.0 / gamma
    table = np.array([
        ((i / 255.0) ** inv_gamma) * 255 for i in range(256)
    ]).astype("uint8")
    return cv2.LUT(image, table)


def _ensure_feedback_dirs() -> None:
    FEEDBACK_DIR.mkdir(parents=True, exist_ok=True)
    for label in EMOTION_LABELS:
        (FEEDBACK_DIR / label).mkdir(parents=True, exist_ok=True)

    if not FEEDBACK_CSV.exists():
        with FEEDBACK_CSV.open("w", newline="", encoding="utf-8") as file:
            writer = csv.writer(file)
            writer.writerow([
                "timestamp",
                "mode",
                "source_path",
                "label",
                "label_index",
                "predicted_label",
            ])


def save_feedback_sample(
    face48_u8,
    label_index: int,
    mode: str,
    source_path: str = "",
    predicted_label: str = "",
):
    _ensure_feedback_dirs()

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    label = EMOTION_LABELS[label_index]
    output_path = FEEDBACK_DIR / label / f"{timestamp}.png"
    cv2.imwrite(str(output_path), face48_u8)

    with FEEDBACK_CSV.open("a", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow([
            timestamp,
            mode,
            source_path,
            label,
            label_index,
            predicted_label,
        ])

    print(f"[SAVED] feedback -> {output_path} (Correct: {label})")
    return output_path


def load_feedback_dataset():
    if not FEEDBACK_DIR.exists():
        return None, None

    images, labels = [], []
    for index, label in enumerate(EMOTION_LABELS):
        folder = FEEDBACK_DIR / label
        if not folder.is_dir():
            continue

        for path in folder.glob("*.png"):
            image = cv2.imread(str(path), cv2.IMREAD_GRAYSCALE)
            if image is None:
                continue
            images.append(cv2.resize(image, (48, 48)))
            labels.append(index)

    if not images:
        return None, None

    x_values = (
        np.stack(images).astype("float32") / 255.0
    ).reshape(-1, 48, 48, 1)
    y_values = np.array(labels, dtype=np.int32)
    return x_values, y_values


def safe_save_model(model, path: str | Path) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f"{path.stem}.tmp{path.suffix}")

    if temporary.exists():
        if temporary.is_dir():
            shutil.rmtree(temporary)
        else:
            temporary.unlink()

    model.save(str(temporary))

    if path.exists():
        if path.is_dir():
            shutil.rmtree(path)
        else:
            path.unlink()

    os.replace(temporary, path)


def fine_tune_feedback_model() -> None:
    """Train the feedback model without modifying the base model."""
    global _feedback_model

    base_model, feedback_model = _load_models()
    x_values, y_values = load_feedback_dataset()
    if x_values is None:
        print("[INFO] No feedback samples found yet. Correct some predictions first.")
        return

    import tensorflow as tf

    y_onehot = tf.keras.utils.to_categorical(
        y_values,
        num_classes=len(EMOTION_LABELS),
    )

    if feedback_model is None:
        feedback_model = tf.keras.models.clone_model(base_model)
        feedback_model.set_weights(base_model.get_weights())
        print("[INFO] Created feedback model from the base model weights.")

    feedback_model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=FINE_TUNE_LR),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    feedback_model.fit(
        x_values,
        y_onehot,
        epochs=FINE_TUNE_EPOCHS,
        batch_size=min(FINE_TUNE_BATCH, len(x_values)),
        shuffle=True,
        verbose=1,
    )

    safe_save_model(feedback_model, FEEDBACK_MODEL_PATH)
    _feedback_model = feedback_model
    print("[DONE] Saved feedback model as:", FEEDBACK_MODEL_PATH)


def predict_emotion_ensemble(face48_float01):
    base_model, feedback_model = _load_models()
    model_input = face48_float01.reshape(1, 48, 48, 1).astype("float32")

    base_probabilities = _run_model(base_model, model_input)
    if feedback_model is None:
        index = int(np.argmax(base_probabilities))
        return index, base_probabilities

    feedback_probabilities = _run_model(feedback_model, model_input)
    final_probabilities = (
        (1.0 - ENSEMBLE_ALPHA) * base_probabilities
        + ENSEMBLE_ALPHA * feedback_probabilities
    )
    index = int(np.argmax(final_probabilities))
    return index, final_probabilities


def detect_emotion_in_bgr_image(img_bgr, *, fast: bool = False):
    """Detect emotions; webcam fast mode predicts only the largest visible face."""
    if img_bgr is None:
        return None, None

    image = img_bgr
    if fast and image.shape[1] > WEBCAM_MAX_WIDTH:
        scale = WEBCAM_MAX_WIDTH / float(image.shape[1])
        image = cv2.resize(
            image,
            (WEBCAM_MAX_WIDTH, max(1, int(image.shape[0] * scale))),
            interpolation=cv2.INTER_AREA,
        )

    image = adjust_gamma(image, gamma=1.5)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray = clahe.apply(gray)

    faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.2,
        minNeighbors=4,
        minSize=(30, 30),
    )

    if len(faces) == 0:
        return image, None

    if fast:
        faces = [max(faces, key=lambda face: int(face[2]) * int(face[3]))]

    main_label = None
    largest_area = 0

    for x, y, width, height in faces:
        face_crop = gray[y:y + height, x:x + width]
        if face_crop.size == 0:
            continue

        face48 = cv2.resize(face_crop, (48, 48), interpolation=cv2.INTER_AREA)
        face48_float = face48.astype("float32") / 255.0
        prediction_index, _ = predict_emotion_ensemble(face48_float)
        label = EMOTION_LABELS[prediction_index]

        area = width * height
        if area > largest_area:
            largest_area = area
            main_label = label

        cv2.rectangle(
            image,
            (x, y),
            (x + width, y + height),
            (0, 255, 0),
            2,
        )
        cv2.putText(
            image,
            label,
            (x, max(22, y - 10)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 255, 0),
            2,
        )

    return image, main_label
