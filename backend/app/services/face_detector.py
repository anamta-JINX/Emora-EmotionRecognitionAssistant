import cv2
import numpy as np

from backend.app.config import DNN_MODEL_PATH, DNN_PROTOTXT_PATH

# ==============================
# DNN Face Detector
# ==============================

PROTO_PATH = str(DNN_PROTOTXT_PATH)
MODEL_PATH = str(DNN_MODEL_PATH)

# Lower threshold = better multi-face detection
CONFIDENCE_THRESHOLD = 0.20

# Load DNN safely
try:
    net = cv2.dnn.readNetFromCaffe(PROTO_PATH, MODEL_PATH)
    print("DNN face detector loaded successfully.")
except Exception as e:
    print("[ERROR] Could not load DNN face detector:", e)
    net = None


# ==============================
# Gentle low-light enhancement
# ==============================
def enhance_low_light(frame):
    """
    Gentle low-light enhancement using LAB + CLAHE.
    Safe for emotion model.
    """
    try:
        lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)

        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        cl = clahe.apply(l)

        enhanced = cv2.merge((cl, a, b))
        enhanced = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)
        return enhanced
    except:
        return frame


# ==============================
# DNN Face Detection
# ==============================
def detect_faces(frame):
    """
    Detects faces using DNN.
    Returns: list of (x1, y1, x2, y2)
    Never crashes — returns [] on failure.
    """
    if net is None or frame is None:
        return []

    h, w = frame.shape[:2]

    # Use RAW frame for DNN (more accurate)
    resized = cv2.resize(frame, (300, 300))

    try:
        blob = cv2.dnn.blobFromImage(
            resized,
            1.0,
            (300, 300),
            (104.0, 177.0, 123.0)
        )
    except:
        return []

    try:
        net.setInput(blob)
        detections = net.forward()
    except:
        return []

    faces = []

    for i in range(detections.shape[2]):
        confidence = float(detections[0, 0, i, 2])

        if confidence < CONFIDENCE_THRESHOLD:
            continue

        box = detections[0, 0, i, 3:7] * np.array([w, h, w, h])
        x1, y1, x2, y2 = box.astype("int")

        # Clamp to image bounds
        x1 = max(0, x1)
        y1 = max(0, y1)
        x2 = min(w, x2)
        y2 = min(h, y2)

        # Skip invalid boxes
        if x2 - x1 < 20 or y2 - y1 < 20:
            continue

        faces.append((x1, y1, x2, y2))

    return faces
