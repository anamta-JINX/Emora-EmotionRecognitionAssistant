# app.py
# Allow both `python -m backend.scripts.<name>` and direct file execution.
from pathlib import Path
import sys

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import os
import csv
from datetime import datetime

import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model

from backend.app.config import BASE_MODEL_PATH as CONFIG_BASE_MODEL_PATH
from backend.app.config import FEEDBACK_DATA_DIR, FEEDBACK_MODEL_PATH as CONFIG_FEEDBACK_MODEL_PATH

from backend.app.services import face_detector  # original detector import, new package path

# -----------------------------
# ADD: File dialog imports
# -----------------------------
import tkinter as tk
from tkinter import filedialog
from PIL import Image, ImageTk

# ============================================================
# Two-model setup + feedback storage config (ADDED)
# ============================================================
BASE_MODEL_PATH = str(CONFIG_BASE_MODEL_PATH)       # original trained model
FEEDBACK_MODEL_PATH = str(CONFIG_FEEDBACK_MODEL_PATH)  # robust format

FEEDBACK_DIR = str(FEEDBACK_DATA_DIR)
FEEDBACK_CSV = os.path.join(FEEDBACK_DIR, "feedback.csv")

FINE_TUNE_EPOCHS = 5
FINE_TUNE_BATCH = 32
FINE_TUNE_LR = 1e-4

# How much to trust feedback model during prediction (0..1)
ENSEMBLE_ALPHA = 0.45  # slightly higher so you see effect sooner

# -----------------------------
# Load BASE model
# -----------------------------
base_model = load_model(BASE_MODEL_PATH, compile=False)
print("Base emotion model loaded successfully:", BASE_MODEL_PATH)

# -----------------------------
# Load feedback model if exists (safe)
# -----------------------------
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
    print("No feedback model found yet. It will be created after you save corrections + press T.")

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
# Correction key mapping (1..7)
# -----------------------------
KEY_TO_INDEX = {
    ord("1"): 0,
    ord("2"): 1,
    ord("3"): 2,
    ord("4"): 3,
    ord("5"): 4,
    ord("6"): 5,
    ord("7"): 6,
}

# -----------------------------
# Load Haar Cascade
# -----------------------------
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

# -----------------------------
# CLAHE for low-light enhancement
# -----------------------------
clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))

# -----------------------------
# Gamma correction function
# -----------------------------
def adjust_gamma(image, gamma=1.5):
    invGamma = 1.0 / gamma
    table = np.array([
        ((i / 255.0) ** invGamma) * 255
        for i in range(256)
    ]).astype("uint8")
    return cv2.LUT(image, table)

# ============================================================
# Feedback helpers + two-model prediction (ADDED)
# ============================================================
def _ensure_feedback_dirs():
    os.makedirs(FEEDBACK_DIR, exist_ok=True)
    for lbl in emotion_labels:
        os.makedirs(os.path.join(FEEDBACK_DIR, lbl), exist_ok=True)

    if not os.path.exists(FEEDBACK_CSV):
        with open(FEEDBACK_CSV, "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(["timestamp", "mode", "source_path", "label", "label_index", "predicted_label"])

def save_feedback_sample(face48_u8, label_index, mode, source_path="", predicted_label=""):
    """
    face48_u8: uint8 grayscale (48,48)
    """
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
    """
    Loads feedback_data/<label>/*.png
    Returns X: (N,48,48,1) float32 [0,1], y: (N,) int
    """
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
    """
    Safe save for .keras/.h5 without creating invalid extensions.
    Keras requires the filename to end in .keras or .h5
    """
    root, ext = os.path.splitext(path)
    tmp = f"{root}.tmp{ext}"  # e.g. feedback_model.tmp.keras

    # remove old tmp if exists
    if os.path.exists(tmp):
        try:
            if os.path.isdir(tmp):
                import shutil
                shutil.rmtree(tmp)
            else:
                os.remove(tmp)
        except:
            pass

    m.save(tmp)  # extension is valid (.keras or .h5)

    # replace old file
    if os.path.exists(path):
        try:
            os.remove(path)
        except:
            pass

    os.rename(tmp, path)

def fine_tune_feedback_model():
    """
    Trains/updates feedback_model.keras ONLY.
    Base model remains unchanged.
    """
    global feedback_model

    X, y = load_feedback_dataset()
    if X is None:
        print("[INFO] No feedback samples found yet. Correct some predictions first.")
        return

    num_classes = len(emotion_labels)
    y_onehot = tf.keras.utils.to_categorical(y, num_classes=num_classes)

    # If feedback model doesn't exist yet, clone base model weights into it
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

def predict_emotion_ensemble(face48_float01):
    """
    Uses BOTH models if feedback_model exists:
    final_probs = (1-a)*base + a*feedback
    """
    inp = face48_float01.reshape(1, 48, 48, 1).astype("float32")

    p_base = base_model.predict(inp, verbose=0)[0]

    if feedback_model is None:
        idx = int(np.argmax(p_base))
        return idx, p_base

    p_fb = feedback_model.predict(inp, verbose=0)[0]

    p_final = (1.0 - ENSEMBLE_ALPHA) * p_base + ENSEMBLE_ALPHA * p_fb
    idx = int(np.argmax(p_final))
    return idx, p_final

def _draw_help_overlay(img):
    lines = [
        "Keys: Q=quit | 1..7=correct&save | T=train feedback model | R=reload base model",
        "1 Angry  2 Disgust  3 Fear  4 Happy  5 Sad  6 Surprise  7 Neutral",
        f"Feedback: {'LOADED' if feedback_model is not None else 'NONE'} | alpha={ENSEMBLE_ALPHA}",
    ]
    y = 20
    for s in lines:
        cv2.putText(img, s, (10, y), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2)
        y += 22


def _resize_for_screen(pil_image, max_width, max_height):
    """Resize while preserving aspect ratio so large frames fit the display."""
    width, height = pil_image.size
    if width <= max_width and height <= max_height:
        return pil_image

    scale = min(max_width / width, max_height / height)
    new_size = (max(1, int(width * scale)), max(1, int(height * scale)))
    return pil_image.resize(new_size, Image.Resampling.LANCZOS)


def _bgr_to_photo(image_bgr, max_width, max_height):
    """Convert an OpenCV BGR frame into a Tkinter-compatible image."""
    image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    pil_image = Image.fromarray(image_rgb)
    pil_image = _resize_for_screen(pil_image, max_width, max_height)
    return ImageTk.PhotoImage(pil_image)


def _show_image_window(image_bgr, title):
    """
    Show a processed image using Tkinter instead of cv2.imshow.

    This works with both opencv-python and opencv-python-headless, avoiding the
    Windows HighGUI error raised by cv2.imshow when a headless OpenCV build is
    installed.
    """
    window = tk.Tk()
    window.title(title)
    window.minsize(640, 480)

    help_text = (
        "Q: quit   |   1-7: save correction   |   "
        "T: train feedback model   |   R: reload base model"
    )
    help_label = tk.Label(window, text=help_text, padx=10, pady=8)
    help_label.pack(fill="x")

    max_width = max(320, window.winfo_screenwidth() - 120)
    max_height = max(240, window.winfo_screenheight() - 180)
    photo = _bgr_to_photo(image_bgr, max_width, max_height)

    image_label = tk.Label(window, image=photo)
    image_label.image = photo
    image_label.pack(expand=True, fill="both")

    result = {"key": ord("q")}
    valid_chars = set("qtr1234567")

    def handle_key(event):
        char = (event.char or "").lower()
        if char in valid_chars:
            result["key"] = ord(char)
            window.destroy()

    def close_window():
        result["key"] = ord("q")
        window.destroy()

    window.bind_all("<Key>", handle_key)
    window.protocol("WM_DELETE_WINDOW", close_window)
    window.after(100, window.focus_force)
    window.mainloop()
    return result["key"]

# -----------------------------
# Mode selection
# -----------------------------
print("\nSelect Mode:")
print("1) Live Webcam")
print("2) Input Image")
mode = input("Enter 1 or 2: ").strip()

# -----------------------------
# Input Image Mode
# -----------------------------
if mode == "2":
    root = tk.Tk()
    root.withdraw()
    root.update()

    # Bring dialog to front (prevents freezing illusion)
    root.attributes("-topmost", True)

    img_path = filedialog.askopenfilename(
        parent=root,
        title="Select an Image",
        filetypes=[
            ("Image Files", "*.jpg *.jpeg *.png *.bmp *.jfif"),
            ("All Files", "*.*")
        ]
    )

    root.destroy()  # MUST destroy root or it hangs

    if not img_path:
        print("No image selected.")
        exit()

    # Robust image loading (handles spaces & jfif)
    data = np.fromfile(img_path, dtype=np.uint8)
    img = cv2.imdecode(data, cv2.IMREAD_COLOR)

    if img is None:
        print("ERROR: Could not read image.")
        exit()

    # Gamma correction (brighten image)
    img = adjust_gamma(img, gamma=1.5)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Apply CLAHE
    gray = clahe.apply(gray)

    faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.2,
        minNeighbors=4,
        minSize=(30, 30)
    )

    # Store largest face for correction
    chosen_face48_u8 = None
    chosen_pred_label = ""

    if len(faces) > 0:
        (cx, cy, cw, ch) = max(faces, key=lambda b: b[2] * b[3])
        face_crop = gray[cy:cy+ch, cx:cx+cw]
        if face_crop.size != 0:
            chosen_face48_u8 = cv2.resize(face_crop, (48, 48))
            chosen_face48_f = chosen_face48_u8.astype("float32") / 255.0
            chosen_pred_idx, _ = predict_emotion_ensemble(chosen_face48_f)
            chosen_pred_label = emotion_labels[chosen_pred_idx]

    for (x, y, w, h) in faces:
        face = gray[y:y+h, x:x+w]
        if face.size == 0:
            continue

        face48 = cv2.resize(face, (48, 48))
        face48_f = face48.astype("float32") / 255.0

        pred_idx, _ = predict_emotion_ensemble(face48_f)
        emotion = emotion_labels[pred_idx]

        cv2.rectangle(img, (x, y), (x+w, y+h), (0, 255, 0), 2)
        cv2.putText(
            img,
            emotion,
            (x, y - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.9,
            (0, 255, 0),
            2
        )

    _draw_help_overlay(img)
    key = _show_image_window(
        img,
        "EMORA - Image Emotion Detection (1..7 correct | T train | R reload | Q quit)",
    )

    # correction + training controls
    if key in KEY_TO_INDEX and chosen_face48_u8 is not None:
        correct_idx = KEY_TO_INDEX[key]
        save_feedback_sample(
            chosen_face48_u8,
            correct_idx,
            mode="image",
            source_path=img_path,
            predicted_label=chosen_pred_label
        )
        print(f"[INFO] Predicted: {chosen_pred_label} | Corrected: {emotion_labels[correct_idx]}")
    elif key == ord('t'):
        fine_tune_feedback_model()
    elif key == ord('r'):
        base_model = load_model(BASE_MODEL_PATH, compile=False)
        print("[INFO] Reloaded base model:", BASE_MODEL_PATH)

    exit()

# -----------------------------
# Start Webcam
# -----------------------------
def run_webcam_mode():
    """Run live detection in a Tkinter window without OpenCV HighGUI."""
    global base_model

    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("ERROR: Webcam not detected")
        return

    print("Webcam started.")
    print("Controls: Q=quit | 1..7=correct&save | T=train feedback model | R=reload base model")

    window = tk.Tk()
    window.title("EMORA - Low Light Emotion Detection")
    window.minsize(720, 520)

    status_var = tk.StringVar(
        value="Q: quit | 1..7: correct & save | T: train feedback model | R: reload base model"
    )
    status_label = tk.Label(window, textvariable=status_var, padx=10, pady=8)
    status_label.pack(fill="x")

    image_label = tk.Label(window)
    image_label.pack(expand=True, fill="both")

    max_width = max(480, window.winfo_screenwidth() - 100)
    max_height = max(360, window.winfo_screenheight() - 180)

    state = {
        "running": True,
        "last_face48_u8": None,
        "last_pred_label": "",
    }

    def close_window():
        if not state["running"]:
            return
        state["running"] = False
        try:
            cap.release()
        finally:
            window.destroy()

    def handle_key(event):
        global base_model

        char = (event.char or "").lower()
        if not char:
            return

        if char == "q":
            close_window()
            return

        if char in "1234567":
            face = state["last_face48_u8"]
            if face is None:
                status_var.set("No face is available to label right now.")
                print("[INFO] No face to label right now.")
                return

            correct_idx = int(char) - 1
            save_feedback_sample(
                face,
                correct_idx,
                mode="webcam",
                source_path="",
                predicted_label=state["last_pred_label"],
            )
            message = (
                f"Predicted: {state['last_pred_label']} | "
                f"Corrected: {emotion_labels[correct_idx]}"
            )
            status_var.set(message)
            print(f"[INFO] {message}")
            return

        if char == "t":
            status_var.set("Training feedback model... check the terminal for progress.")
            window.update_idletasks()
            try:
                fine_tune_feedback_model()
                status_var.set("Feedback model training completed.")
            except Exception as exc:
                status_var.set(f"Training failed: {exc}")
                print(f"[ERROR] Feedback training failed: {exc}")
            return

        if char == "r":
            try:
                base_model = load_model(BASE_MODEL_PATH, compile=False)
                status_var.set("Base model reloaded successfully.")
                print("[INFO] Reloaded base model:", BASE_MODEL_PATH)
            except Exception as exc:
                status_var.set(f"Could not reload base model: {exc}")
                print(f"[ERROR] Could not reload base model: {exc}")

    def update_frame():
        if not state["running"]:
            return

        ret, frame = cap.read()
        if not ret:
            status_var.set("Could not read a frame from the webcam.")
            window.after(100, update_frame)
            return

        # Gamma correction (brighten image)
        frame = adjust_gamma(frame, gamma=1.5)

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        # Apply CLAHE
        gray = clahe.apply(gray)

        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.2,
            minNeighbors=4,
            minSize=(30, 30),
        )

        state["last_face48_u8"] = None
        state["last_pred_label"] = ""
        chosen_box = max(faces, key=lambda b: b[2] * b[3]) if len(faces) > 0 else None

        for (x, y, w, h) in faces:
            face = gray[y:y+h, x:x+w]
            if face.size == 0:
                continue

            face48 = cv2.resize(face, (48, 48))
            face48_f = face48.astype("float32") / 255.0

            pred_idx, _ = predict_emotion_ensemble(face48_f)
            emotion = emotion_labels[pred_idx]

            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
            cv2.putText(
                frame,
                emotion,
                (x, y - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.9,
                (0, 255, 0),
                2,
            )

            if chosen_box is not None and (x, y, w, h) == tuple(chosen_box):
                state["last_face48_u8"] = face48
                state["last_pred_label"] = emotion

        _draw_help_overlay(frame)

        photo = _bgr_to_photo(frame, max_width, max_height)
        image_label.configure(image=photo)
        image_label.image = photo

        window.after(15, update_frame)

    window.bind_all("<Key>", handle_key)
    window.protocol("WM_DELETE_WINDOW", close_window)
    window.after(100, window.focus_force)
    window.after(0, update_frame)
    window.mainloop()

    if cap.isOpened():
        cap.release()


run_webcam_mode()