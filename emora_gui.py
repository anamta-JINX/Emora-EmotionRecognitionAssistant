# emora_gui.py
import os
import threading
from datetime import datetime

import cv2
import numpy as np
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from PIL import Image, ImageTk

import tensorflow as tf
from tensorflow.keras.models import load_model


# =========================
# CONFIG
# =========================
BASE_MODEL_PATH = "emora_model.h5"

# You asked .h5 specifically:
FEEDBACK_MODEL_PATH = "feedback_model.h5"

# Feedback samples live here:
FEEDBACK_DIR = "feedback_data"

# Blend base+feedback during prediction
ENSEMBLE_ALPHA = 0.45

# Fine-tune settings
FINE_TUNE_EPOCHS = 5
FINE_TUNE_BATCH = 32
FINE_TUNE_LR = 1e-4

IMG_SIZE = (48, 48)
EMOTION_LABELS = ["Angry", "Disgust", "Fear", "Happy", "Sad", "Surprise", "Neutral"]

# Enhancements (like your app.py)
clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))


# =========================
# Helpers
# =========================
def adjust_gamma(image, gamma=1.5):
    invGamma = 1.0 / gamma
    table = np.array([((i / 255.0) ** invGamma) * 255 for i in range(256)]).astype("uint8")
    return cv2.LUT(image, table)


def prep_face48(gray_face_u8):
    """Return face48_u8 (48x48 uint8) + face48_f (1,48,48,1 float32 [0,1])"""
    face48 = cv2.resize(gray_face_u8, IMG_SIZE)
    face48_f = (face48.astype("float32") / 255.0).reshape(1, 48, 48, 1)
    return face48, face48_f


def ensure_feedback_dirs():
    os.makedirs(FEEDBACK_DIR, exist_ok=True)
    for lbl in EMOTION_LABELS:
        os.makedirs(os.path.join(FEEDBACK_DIR, lbl), exist_ok=True)


def save_feedback_face48(face48_u8, label_index):
    """
    Save 48x48 grayscale PNG into feedback_data/<Label>/timestamp.png
    """
    ensure_feedback_dirs()
    ts = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    label = EMOTION_LABELS[label_index]
    out_path = os.path.join(FEEDBACK_DIR, label, f"{ts}.png")
    cv2.imwrite(out_path, face48_u8)
    return out_path


def load_feedback_dataset():
    """
    Load feedback_data/<Label>/*.png
    Returns X: (N,48,48,1) float32 [0,1], y: (N,) int
    """
    if not os.path.isdir(FEEDBACK_DIR):
        return None, None

    X_list, y_list = [], []
    for idx, lbl in enumerate(EMOTION_LABELS):
        folder = os.path.join(FEEDBACK_DIR, lbl)
        if not os.path.isdir(folder):
            continue

        for fn in os.listdir(folder):
            if not fn.lower().endswith(".png"):
                continue
            p = os.path.join(folder, fn)
            img = cv2.imread(p, cv2.IMREAD_GRAYSCALE)
            if img is None:
                continue
            img = cv2.resize(img, IMG_SIZE)
            X_list.append(img)
            y_list.append(idx)

    if not X_list:
        return None, None

    X = (np.stack(X_list).astype("float32") / 255.0).reshape(-1, 48, 48, 1)
    y = np.array(y_list, dtype=np.int32)
    return X, y


def safe_save_model_h5(model, path_h5):
    """
    Safe overwrite: save to tmp then rename.
    """
    if not path_h5.lower().endswith(".h5"):
        raise ValueError("Feedback model path must end with .h5")

    tmp = path_h5.replace(".h5", ".tmp.h5")
    try:
        if os.path.exists(tmp):
            os.remove(tmp)
    except Exception:
        pass

    model.save(tmp)

    try:
        if os.path.exists(path_h5):
            os.remove(path_h5)
    except Exception:
        pass

    os.rename(tmp, path_h5)


# =========================
# GUI
# =========================
class EMORAGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("EMORA - Emotion Recognition")
        self.root.geometry("1000x720")
        self.root.minsize(900, 620)

        # Theme
        self.bg = "#101422"
        self.panel = "#151c2f"
        self.accent = "#00b4d8"
        self.text = "#dfe7fd"
        self.muted = "#9aa4c7"
        self.good = "#2a9d8f"
        self.warn = "#e9c46a"
        self.bad = "#e76f51"

        self.root.configure(bg=self.bg)

        # Models + detector
        self.base_model = None
        self.feedback_model = None
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )

        # Webcam state
        self.cap = None
        self.webcam_running = False
        self.webcam_job = None

        # Training lock (prevents double-training)
        self.training_in_progress = False

        # Latest detection state (for Feedback button)
        self.latest_mode = "webcam"          # "webcam" or "image"
        self.latest_source_path = ""         # image path if image mode
        self.latest_gray = None              # enhanced gray frame
        self.latest_faces = []               # list of (x,y,w,h)
        self.latest_pred_for_largest = ""    # predicted label for largest face

        self._build_ui()
        self._load_models_async()

        self.root.protocol("WM_DELETE_WINDOW", self.on_close)

    # -------------------------
    # UI
    # -------------------------
    def _build_ui(self):
        outer = tk.Frame(self.root, bg=self.bg)
        outer.pack(fill="both", expand=True, padx=18, pady=18)

        # Header
        header = tk.Frame(outer, bg=self.panel, height=110)
        header.pack(fill="x")
        header.pack_propagate(False)

        title = tk.Label(header, text="EMORA", font=("Segoe UI", 34, "bold"), fg=self.accent, bg=self.panel)
        title.pack(pady=(14, 0))

        subtitle = tk.Label(
            header,
            text="Because ‘just read the room’ isn’t helpful.",
            font=("Segoe UI", 12),
            fg=self.muted,
            bg=self.panel
        )
        subtitle.pack()

        # Body
        body = tk.Frame(outer, bg=self.bg)
        body.pack(fill="both", expand=True, pady=(16, 0))

        self.left = tk.Frame(body, bg=self.panel, width=320)
        self.left.pack(side="left", fill="y")
        self.left.pack_propagate(False)

        self.right = tk.Frame(body, bg=self.panel)
        self.right.pack(side="right", fill="both", expand=True, padx=(14, 0))

        # Left controls
        tk.Label(self.left, text="CONTROLS", font=("Segoe UI", 16, "bold"),
                 fg=self.accent, bg=self.panel).pack(pady=(18, 10))

        self.status_var = tk.StringVar(value="Loading models...")
        self.status_lbl = tk.Label(self.left, textvariable=self.status_var,
                                   font=("Segoe UI", 10), fg=self.warn, bg=self.panel)
        self.status_lbl.pack(pady=(0, 14))

        self.btn_start = self._btn(self.left, "📷 Start Webcam", self.start_webcam, self.accent)
        self.btn_start.pack(fill="x", padx=18, pady=7)

        self.btn_stop = self._btn(self.left, "⏹ Stop Webcam", self.stop_webcam, "#355070")
        self.btn_stop.pack(fill="x", padx=18, pady=7)

        self.btn_image = self._btn(self.left, "🖼 Analyze Image", self.pick_image, self.good)
        self.btn_image.pack(fill="x", padx=18, pady=7)

        # ✅ Feedback button
        self.btn_feedback = self._btn(self.left, "🧠 Feedback (Correct + Train)", self.on_feedback_click, "#6d597a")
        self.btn_feedback.pack(fill="x", padx=18, pady=7)

        self.btn_reload = self._btn(self.left, "🔄 Reload Models", self.reload_models_async, "#4a4e69")
        self.btn_reload.pack(fill="x", padx=18, pady=7)

        ttk.Separator(self.left, orient="horizontal").pack(fill="x", pady=18, padx=18)

        info = tk.Label(
            self.left,
            text="Feedback tip:\n• Show a face → click Feedback\n• Pick real emotion → Save+Train\n• Next runs improve automatically",
            justify="left",
            font=("Segoe UI", 10),
            fg=self.muted,
            bg=self.panel
        )
        info.pack(padx=18, pady=(0, 18), anchor="w")

        self.btn_exit = self._btn(self.left, "🚪 Exit", self.on_close, self.bad)
        self.btn_exit.pack(fill="x", padx=18, pady=(0, 18))

        # Right preview
        self.preview_title = tk.Label(self.right, text="Preview", font=("Segoe UI", 14, "bold"),
                                      fg=self.text, bg=self.panel)
        self.preview_title.pack(anchor="w", padx=16, pady=(14, 8))

        self.video_label = tk.Label(self.right, bg="#0b1020", bd=0)
        self.video_label.pack(fill="both", expand=True, padx=16)

        # Results scroller
        self.results_container = tk.Frame(self.right, bg=self.panel)
        self.results_container.pack(fill="x", padx=16, pady=(10, 14))
        self._build_results_scroller()

        self._set_buttons_enabled(False)

    def _btn(self, parent, text, cmd, color):
        return tk.Button(
            parent, text=text, command=cmd,
            font=("Segoe UI", 12, "bold"),
            bg=color, fg="white",
            activebackground=color, activeforeground="white",
            relief="flat", bd=0,
            padx=12, pady=10,
            cursor="hand2"
        )

    def _build_results_scroller(self):
        tk.Label(self.results_container, text="Results", font=("Segoe UI", 12, "bold"),
                 fg=self.text, bg=self.panel).pack(anchor="w", pady=(0, 6))

        self.res_canvas = tk.Canvas(self.results_container, bg=self.panel, highlightthickness=0, height=150)
        self.res_scroll = ttk.Scrollbar(self.results_container, orient="vertical", command=self.res_canvas.yview)
        self.res_frame = tk.Frame(self.res_canvas, bg=self.panel)

        self.res_frame.bind("<Configure>", lambda e: self.res_canvas.configure(scrollregion=self.res_canvas.bbox("all")))
        self.res_canvas.create_window((0, 0), window=self.res_frame, anchor="nw")
        self.res_canvas.configure(yscrollcommand=self.res_scroll.set)

        self.res_canvas.pack(side="left", fill="both", expand=True)
        self.res_scroll.pack(side="right", fill="y")

        self._clear_results("No results yet.")

    def _clear_results(self, msg=""):
        for w in self.res_frame.winfo_children():
            w.destroy()
        if msg:
            tk.Label(self.res_frame, text=msg, font=("Segoe UI", 10),
                     fg=self.muted, bg=self.panel, justify="left").pack(anchor="w", padx=6, pady=6)

    def _add_result_row(self, i, emotion, conf, box):
        x, y, w, h = box
        row = tk.Frame(self.res_frame, bg=self.panel)
        row.pack(fill="x", pady=4, padx=6)

        tk.Label(row, text=f"Face #{i}", font=("Segoe UI", 10, "bold"),
                 fg=self.text, bg=self.panel, width=10, anchor="w").pack(side="left")

        tk.Label(row, text=emotion, font=("Segoe UI", 10, "bold"),
                 fg=self.accent, bg=self.panel, width=10, anchor="w").pack(side="left", padx=(8, 0))

        color = self.good if conf >= 70 else self.warn if conf >= 50 else self.bad
        tk.Label(row, text=f"{conf:.1f}%", font=("Segoe UI", 10),
                 fg=color, bg=self.panel, width=8, anchor="w").pack(side="left", padx=(8, 0))

        tk.Label(row, text=f"({x},{y}) {w}x{h}", font=("Segoe UI", 9),
                 fg=self.muted, bg=self.panel, anchor="w").pack(side="left", padx=(10, 0))

    def _set_buttons_enabled(self, enabled: bool):
        state = "normal" if enabled else "disabled"
        self.btn_start.config(state=state)
        self.btn_stop.config(state=state)
        self.btn_image.config(state=state)
        self.btn_feedback.config(state=state)
        self.btn_reload.config(state="normal")  # allow reload anytime

    # -------------------------
    # Model loading
    # -------------------------
    def _load_models_async(self):
        def worker():
            try:
                if not os.path.exists(BASE_MODEL_PATH):
                    raise FileNotFoundError(f"Missing {BASE_MODEL_PATH} in project root.")
                self.base_model = load_model(BASE_MODEL_PATH, compile=False)

                self.feedback_model = None
                if os.path.exists(FEEDBACK_MODEL_PATH):
                    try:
                        self.feedback_model = load_model(FEEDBACK_MODEL_PATH, compile=False)
                    except Exception:
                        self.feedback_model = None

                self.root.after(0, self._on_models_ready)
            except Exception as e:
                err = str(e)
                self.root.after(0, lambda err=err: self._on_models_fail(err))

        threading.Thread(target=worker, daemon=True).start()

    def reload_models_async(self):
        self.status_var.set("Reloading models...")
        self.status_lbl.config(fg=self.warn)
        self._set_buttons_enabled(False)
        self._load_models_async()

    def _on_models_ready(self):
        fb = "LOADED" if self.feedback_model is not None else "NONE"
        self.status_var.set(f"Ready ✅ | Feedback: {fb} | alpha={ENSEMBLE_ALPHA}")
        self.status_lbl.config(fg=self.good)
        self._set_buttons_enabled(True)

    def _on_models_fail(self, err):
        self.status_var.set("❌ Model load failed")
        self.status_lbl.config(fg=self.bad)
        messagebox.showerror("Model Load Error", err)
        self._set_buttons_enabled(False)

    # -------------------------
    # Prediction (ensemble)
    # -------------------------
    def predict_ensemble(self, face48_float01):
        p_base = self.base_model.predict(face48_float01, verbose=0)[0]
        if self.feedback_model is None:
            p = p_base
        else:
            p_fb = self.feedback_model.predict(face48_float01, verbose=0)[0]
            p = (1.0 - ENSEMBLE_ALPHA) * p_base + ENSEMBLE_ALPHA * p_fb

        idx = int(np.argmax(p))
        conf = float(np.max(p)) * 100.0
        return idx, conf

    # -------------------------
    # Webcam
    # -------------------------
    def start_webcam(self):
        if self.webcam_running:
            return
        if self.base_model is None:
            messagebox.showwarning("Not Ready", "Model is still loading. Please wait.")
            return

        self.cap = cv2.VideoCapture(0)
        if not self.cap.isOpened():
            messagebox.showerror("Webcam Error", "Could not open webcam (VideoCapture(0)).")
            self.cap = None
            return

        self.latest_mode = "webcam"
        self.latest_source_path = ""
        self.webcam_running = True
        self.status_var.set("Webcam running 🎥")
        self.status_lbl.config(fg=self.accent)
        self._clear_results("Webcam running...")

        self._webcam_loop()

    def stop_webcam(self):
        self.webcam_running = False
        if self.webcam_job is not None:
            try:
                self.root.after_cancel(self.webcam_job)
            except Exception:
                pass
            self.webcam_job = None

        if self.cap is not None:
            try:
                self.cap.release()
            except Exception:
                pass
            self.cap = None

        self.status_var.set("Ready ✅")
        self.status_lbl.config(fg=self.good)

    def _webcam_loop(self):
        if not self.webcam_running or self.cap is None:
            return

        ret, frame = self.cap.read()
        if not ret:
            self.stop_webcam()
            return

        # preprocessing (like app.py)
        frame = adjust_gamma(frame, gamma=1.5)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray = clahe.apply(gray)

        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.2,
            minNeighbors=4,
            minSize=(30, 30)
        )
        faces = list(faces) if faces is not None else []
        self.latest_gray = gray
        self.latest_faces = faces

        results = []
        largest_box = max(faces, key=lambda b: b[2] * b[3]) if len(faces) > 0 else None
        largest_pred = ""

        for (x, y, w, h) in faces:
            face = gray[y:y+h, x:x+w]
            if face.size == 0:
                continue

            _, face48_f = prep_face48(face)
            idx, conf = self.predict_ensemble(face48_f)
            emotion = EMOTION_LABELS[idx]

            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
            cv2.putText(frame, f"{emotion} {conf:.0f}%", (x, y - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

            results.append((emotion, conf, (x, y, w, h)))

            if largest_box is not None and (x, y, w, h) == tuple(largest_box):
                largest_pred = emotion

        self.latest_pred_for_largest = largest_pred

        # update results panel
        self._clear_results("" if results else "No face detected.")
        for i, (emo, conf, box) in enumerate(results, 1):
            self._add_result_row(i, emo, conf, box)

        # render to GUI
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        im = Image.fromarray(rgb)

        panel_w = max(1, self.video_label.winfo_width())
        panel_h = max(1, self.video_label.winfo_height())
        im.thumbnail((panel_w, panel_h), Image.Resampling.LANCZOS)

        imgtk = ImageTk.PhotoImage(im)
        self.video_label.imgtk = imgtk
        self.video_label.config(image=imgtk)

        self.webcam_job = self.root.after(15, self._webcam_loop)

    # -------------------------
    # Image mode
    # -------------------------
    def pick_image(self):
        if self.base_model is None:
            messagebox.showwarning("Not Ready", "Model is still loading. Please wait.")
            return

        path = filedialog.askopenfilename(
            title="Select Image",
            filetypes=[
                ("Image Files", "*.jpg *.jpeg *.png *.bmp *.jfif *.tif *.tiff"),
                ("All Files", "*.*")
            ]
        )
        if not path:
            return

        self.stop_webcam()
        self.latest_mode = "image"
        self.latest_source_path = path

        try:
            data = np.fromfile(path, dtype=np.uint8)
            img = cv2.imdecode(data, cv2.IMREAD_COLOR)
            if img is None:
                raise ValueError("Could not decode image.")

            img = adjust_gamma(img, gamma=1.5)
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            gray = clahe.apply(gray)

            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.2,
                minNeighbors=4,
                minSize=(30, 30)
            )
            faces = list(faces) if faces is not None else []
            self.latest_gray = gray
            self.latest_faces = faces

            display = img.copy()
            results = []

            largest_box = max(faces, key=lambda b: b[2] * b[3]) if len(faces) > 0 else None
            largest_pred = ""

            for (x, y, w, h) in faces:
                face = gray[y:y+h, x:x+w]
                if face.size == 0:
                    continue

                _, face48_f = prep_face48(face)
                idx, conf = self.predict_ensemble(face48_f)
                emotion = EMOTION_LABELS[idx]

                cv2.rectangle(display, (x, y), (x+w, y+h), (0, 255, 0), 2)
                cv2.putText(display, f"{emotion} {conf:.0f}%", (x, y - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

                results.append((emotion, conf, (x, y, w, h)))

                if largest_box is not None and (x, y, w, h) == tuple(largest_box):
                    largest_pred = emotion

            self.latest_pred_for_largest = largest_pred

            self._clear_results("" if results else "No face detected.")
            for i, (emo, conf, box) in enumerate(results, 1):
                self._add_result_row(i, emo, conf, box)

            rgb = cv2.cvtColor(display, cv2.COLOR_BGR2RGB)
            im = Image.fromarray(rgb)

            panel_w = max(1, self.video_label.winfo_width())
            panel_h = max(1, self.video_label.winfo_height())
            im.thumbnail((panel_w, panel_h), Image.Resampling.LANCZOS)

            imgtk = ImageTk.PhotoImage(im)
            self.video_label.imgtk = imgtk
            self.video_label.config(image=imgtk)

            self.status_var.set(f"Done ✅ | Faces: {len(results)} (Use Feedback to correct)")
            self.status_lbl.config(fg=self.good)

        except Exception as e:
            self.status_var.set("❌ Image analysis failed")
            self.status_lbl.config(fg=self.bad)
            messagebox.showerror("Image Error", str(e))

    # -------------------------
    # Feedback button flow
    # -------------------------
    def on_feedback_click(self):
        if self.training_in_progress:
            messagebox.showinfo("Training", "Training is already running.")
            return

        if self.base_model is None:
            messagebox.showwarning("Not Ready", "Model is still loading.")
            return

        if self.latest_gray is None or not self.latest_faces:
            messagebox.showinfo("Feedback", "No face detected yet.\nShow a face first, then click Feedback.")
            return

        (x, y, w, h) = max(self.latest_faces, key=lambda b: b[2] * b[3])
        face = self.latest_gray[y:y+h, x:x+w]
        if face.size == 0:
            messagebox.showinfo("Feedback", "Face crop failed. Try again.")
            return

        face48_u8, face48_f = prep_face48(face)
        idx, conf = self.predict_ensemble(face48_f)
        predicted = f"{EMOTION_LABELS[idx]} ({conf:.0f}%)"

        self._open_feedback_popup(face48_u8, predicted)

    def _open_feedback_popup(self, face48_u8, predicted_str):
        pop = tk.Toplevel(self.root)
        pop.title("Feedback: Correct Emotion")
        pop.geometry("380x320")
        pop.resizable(False, False)
        pop.transient(self.root)
        pop.grab_set()

        tk.Label(pop, text=f"Predicted: {predicted_str}", font=("Segoe UI", 10, "bold")).pack(pady=(12, 6))
        tk.Label(pop, text="Select the REAL emotion:", font=("Segoe UI", 10)).pack(pady=(0, 8))

        selected = tk.StringVar(value="Happy")
        combo = ttk.Combobox(pop, values=EMOTION_LABELS, textvariable=selected, state="readonly")
        combo.pack(padx=16, fill="x")

        prev = cv2.resize(face48_u8, (120, 120), interpolation=cv2.INTER_NEAREST)
        prev_rgb = cv2.cvtColor(prev, cv2.COLOR_GRAY2RGB)
        im = Image.fromarray(prev_rgb)
        imtk = ImageTk.PhotoImage(im)

        img_lbl = tk.Label(pop, image=imtk)
        img_lbl.image = imtk
        img_lbl.pack(pady=12)

        status = tk.StringVar(value="")
        tk.Label(pop, textvariable=status, font=("Segoe UI", 9), fg="#555").pack()

        btn_row = tk.Frame(pop)
        btn_row.pack(pady=12)

        def start_save_and_train():
            try:
                correct_label = selected.get()
                correct_idx = EMOTION_LABELS.index(correct_label)
                saved_path = save_feedback_face48(face48_u8, correct_idx)
                status.set(f"Saved: {saved_path}")

                pop.grab_release()
                pop.destroy()

                self._train_feedback_in_background()

            except Exception as e:
                messagebox.showerror("Feedback Error", str(e))

        ttk.Button(btn_row, text="Save + Train", command=start_save_and_train).pack(side="left", padx=8)
        ttk.Button(btn_row, text="Cancel", command=lambda: pop.destroy()).pack(side="left", padx=8)

    def _train_feedback_in_background(self):
        if self.training_in_progress:
            return
        self.training_in_progress = True

        self._set_buttons_enabled(False)
        self.status_var.set("Training feedback model... (don’t close)")
        self.status_lbl.config(fg=self.warn)
        self._clear_results("Training feedback model...")

        def worker():
            try:
                X, y = load_feedback_dataset()
                if X is None:
                    raise ValueError(
                        "No feedback samples found.\n"
                        "feedback_data/<Label>/*.png must exist."
                    )

                y_onehot = tf.keras.utils.to_categorical(y, num_classes=len(EMOTION_LABELS))

                if self.feedback_model is None:
                    fb = tf.keras.models.clone_model(self.base_model)
                    fb.set_weights(self.base_model.get_weights())
                    self.feedback_model = fb

                opt = tf.keras.optimizers.Adam(learning_rate=FINE_TUNE_LR)
                self.feedback_model.compile(optimizer=opt, loss="categorical_crossentropy", metrics=["accuracy"])

                self.feedback_model.fit(
                    X, y_onehot,
                    epochs=FINE_TUNE_EPOCHS,
                    batch_size=min(FINE_TUNE_BATCH, len(X)),
                    shuffle=True,
                    verbose=1
                )

                safe_save_model_h5(self.feedback_model, FEEDBACK_MODEL_PATH)

                # reload from disk to ensure it can be loaded
                try:
                    self.feedback_model = load_model(FEEDBACK_MODEL_PATH, compile=False)
                except Exception:
                    pass

                self.root.after(0, lambda n=len(X): self._train_done(n))

            except Exception as e:
                # ✅ FIX: capture err string into lambda default arg
                err = str(e)
                self.root.after(0, lambda err=err: self._train_fail(err))

        threading.Thread(target=worker, daemon=True).start()

    def _train_done(self, n_samples):
        self.training_in_progress = False
        self.status_var.set(f"✅ Feedback trained on {n_samples} samples | saved: {FEEDBACK_MODEL_PATH}")
        self.status_lbl.config(fg=self.good)
        self._set_buttons_enabled(True)
        self._clear_results("Done. Predictions now use updated feedback model (ensemble).")

    def _train_fail(self, err):
        self.training_in_progress = False
        self.status_var.set("❌ Feedback training failed")
        self.status_lbl.config(fg=self.bad)
        self._set_buttons_enabled(True)
        messagebox.showerror("Training Error", err)
        self._clear_results("Training failed. Check the error message.")

    # -------------------------
    # Close
    # -------------------------
    def on_close(self):
        try:
            self.webcam_running = False
            if self.webcam_job is not None:
                try:
                    self.root.after_cancel(self.webcam_job)
                except Exception:
                    pass
                self.webcam_job = None

            if self.cap is not None:
                try:
                    self.cap.release()
                except Exception:
                    pass
                self.cap = None
        except Exception:
            pass

        self.root.destroy()


def main():
    root = tk.Tk()
    style = ttk.Style()
    try:
        style.theme_use("clam")
    except Exception:
        pass

    EMORAGUI(root)
    root.mainloop()


if __name__ == "__main__":
    main()
