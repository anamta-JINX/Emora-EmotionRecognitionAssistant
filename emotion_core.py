# emotion_core.py
import os
import csv
from datetime import datetime

import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model



# -----------------------------
# Config
# -----------------------------
BASE_MODEL_PATH = "emora_model.h5"
FEEDBACK_MODEL_PATH = "feedback_model.keras"

FEEDBACK_DIR = "feedback_data"
FEEDBACK_CSV = os.path.join(FEEDBACK_DIR, "feedback.csv")

FINE_TUNE_EPOCHS = 5
FINE_TUNE_BATCH = 32
FINE_TUNE_LR = 1e-4
ENSEMBLE_ALPHA = 0.45

emotion_labels = [
    "Angry",
    "Disgust",
    "Fear",
    "Happy",
    "Sad",
    "Surprise",
    "Neutral"
]

# -----------------------------
# Load models
# -----------------------------
base_model = load_model(BASE_MODEL_PATH, compile=False)
print("Base emotion model loaded successfully:", BASE_MODEL_PATH)

feedback_model = None
if os.path.exists(FEEDBACK_MODEL_PATH):
    try:
        feedback_model = load_model(FEEDBACK_MODEL_PATH, compile=False)
        print("Feedback model loaded:", FEEDBACK_MODEL_PATH)
    except Exception as e:
        print("[WARN] Feedback model exists but could not be loaded.")
        print("Delete it and retrain. Reason:", e)
        feedback_model = None
else:
    print("No feedback model found yet. It will be created after you save corrections + train.")

# -----------------------------
# Haar Cascade + CLAHE + gamma
# -----------------------------
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)
clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))

def adjust_gamma(image, gamma=1.5):
    invGamma = 1.0 / gamma
    table = np.array([
        ((i / 255.0) ** invGamma) * 255
        for i in range(256)
    ]).astype("uint8")
    return cv2.LUT(image, table)

# -----------------------------
# Feedback helpers
# -----------------------------
def _ensure_feedback_dirs():
    os.makedirs(FEEDBACK_DIR, exist_ok=True)
    for lbl in emotion_labels:
        os.makedirs(os.path.join(FEEDBACK_DIR, lbl), exist_ok=True)

    if not os.path.exists(FEEDBACK_CSV):
        with open(FEEDBACK_CSV, "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(["timestamp", "mode", "source_path", "label", "label_index", "predicted_label"])

def save_feedback_sample(face48_u8, label_index, mode, source_path="", predicted_label=""):
    _ensure_feedback_dirs()

    ts = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    label = emotion_labels[label_index]
    out_path = os.path.join(FEEDBACK_DIR, label, f"{ts}.png")

    cv2.imwrite(out_path, face48_u8)

    with open(FEEDBACK_CSV, "a", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow([ts, mode, source_path, label, label_index, predicted_label])

    print(f"[SAVED] feedback -> {out_path} (Correct: {label})")

def load_feedback_dataset():
    if not os.path.exists(FEEDBACK_DIR):
        return None, None

    X_list, y_list = [], []
    for idx, lbl in enumerate(emotion_labels):
        folder = os.path.join(FEEDBACK_DIR, lbl)
        if not os.path.isdir(folder):
            continue

        for name in os.listdir(folder):
            if not name.lower().endswith(".png"):
                continue
            path = os.path.join(folder, name)
            img = cv2.imread(path, cv2.IMREAD_GRAYSCALE)
            if img is None:
                continue
            img = cv2.resize(img, (48, 48))
            X_list.append(img)
            y_list.append(idx)

    if not X_list:
        return None, None

    X = (np.stack(X_list).astype("float32") / 255.0).reshape(-1, 48, 48, 1)
    y = np.array(y_list, dtype=np.int32)
    return X, y

def safe_save_model(m, path):
    root, ext = os.path.splitext(path)
    tmp = f"{root}.tmp{ext}"

    if os.path.exists(tmp):
        try:
            if os.path.isdir(tmp):
                import shutil
                shutil.rmtree(tmp)
            else:
                os.remove(tmp)
        except:
            pass

    m.save(tmp)

    if os.path.exists(path):
        try:
            os.remove(path)
        except:
            pass

    os.rename(tmp, path)

def fine_tune_feedback_model():
    global feedback_model

    X, y = load_feedback_dataset()
    if X is None:
        print("[INFO] No feedback samples found yet. Correct some predictions first.")
        return

    num_classes = len(emotion_labels)
    y_onehot = tf.keras.utils.to_categorical(y, num_classes=num_classes)

    if feedback_model is None:
        feedback_model = tf.keras.models.clone_model(base_model)
        feedback_model.set_weights(base_model.get_weights())
        print("[INFO] Created feedback model starting from base model weights.")

    opt = tf.keras.optimizers.Adam(learning_rate=FINE_TUNE_LR)
    feedback_model.compile(optimizer=opt, loss="categorical_crossentropy", metrics=["accuracy"])

    print(f"[TRAIN] Fine-tuning FEEDBACK model on {len(X)} samples (epochs={FINE_TUNE_EPOCHS}) ...")
    feedback_model.fit(
        X, y_onehot,
        epochs=FINE_TUNE_EPOCHS,
        batch_size=min(FINE_TUNE_BATCH, len(X)),
        shuffle=True,
        verbose=1
    )

    safe_save_model(feedback_model, FEEDBACK_MODEL_PATH)
    print(f"[DONE] Saved feedback model as: {FEEDBACK_MODEL_PATH}")

# -----------------------------
# Prediction
# -----------------------------
def predict_emotion_ensemble(face48_float01):
    inp = face48_float01.reshape(1, 48, 48, 1).astype("float32")

    p_base = base_model.predict(inp, verbose=0)[0]

    if feedback_model is None:
        idx = int(np.argmax(p_base))
        return idx, p_base

    p_fb = feedback_model.predict(inp, verbose=0)[0]
    p_final = (1.0 - ENSEMBLE_ALPHA) * p_base + ENSEMBLE_ALPHA * p_fb
    idx = int(np.argmax(p_final))
    return idx, p_final

# -----------------------------
# Haar Cascade emotion detection ... multi-face
# -----------------------------
def detect_emotion_in_bgr_image(img_bgr):
    """
    Input: BGR image (OpenCV style)
    Returns:
      - annotated_bgr: image with rectangles + labels
      - main_label: label of the largest face or None
    """
    if img_bgr is None:
        return None, None

    # Same preprocessing you had before
    img = adjust_gamma(img_bgr, gamma=1.5)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = clahe.apply(gray)

    faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.2,
        minNeighbors=4,
        minSize=(30, 30)
    )

    if len(faces) == 0:
        return img, None

    main_label = None
    largest_area = 0

    # Loop over ALL faces
    for (x, y, w, h) in faces:
        face_crop = gray[y:y+h, x:x+w]
        if face_crop.size == 0:
            continue

        face48 = cv2.resize(face_crop, (48, 48))
        face48_f = face48.astype("float32") / 255.0

        pred_idx, _ = predict_emotion_ensemble(face48_f)
        label = emotion_labels[pred_idx]

        # Track largest face as "main"
        area = w * h
        if area > largest_area:
            largest_area = area
            main_label = label

        # Draw box + label for each face
        cv2.rectangle(img, (x, y), (x + w, y + h), (0, 255, 0), 2)
        cv2.putText(
            img,
            label,
            (x, y - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 255, 0),
            2
        )

    return img, main_label
