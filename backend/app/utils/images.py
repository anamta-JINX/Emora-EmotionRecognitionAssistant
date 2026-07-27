"""Image conversion helpers used by the prediction routes."""

from __future__ import annotations

import base64

import cv2
import numpy as np


def decode_base64_image(data_url: str):
    """Decode a base64 data URL into an OpenCV BGR image."""
    encoded = data_url.split(",", 1)[1] if "," in data_url else data_url
    image_bytes = base64.b64decode(encoded, validate=False)
    image_array = np.frombuffer(image_bytes, np.uint8)
    return cv2.imdecode(image_array, cv2.IMREAD_COLOR)


def decode_uploaded_image(file_storage):
    """Read a Flask upload into an OpenCV BGR image."""
    file_bytes = np.frombuffer(file_storage.read(), np.uint8)
    return cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)


def encode_png_data_url(image) -> str:
    """Encode an OpenCV BGR image as a PNG data URL."""
    ok, buffer = cv2.imencode(".png", image)
    if not ok:
        raise ValueError("Could not encode the processed image.")
    encoded = base64.b64encode(buffer).decode("utf-8")
    return "data:image/png;base64," + encoded


def encode_jpeg_data_url(image, quality: int = 85) -> str:
    """Encode an OpenCV BGR image as a compact JPEG data URL."""
    quality = max(50, min(95, int(quality)))
    ok, buffer = cv2.imencode(".jpg", image, [cv2.IMWRITE_JPEG_QUALITY, quality])
    if not ok:
        raise ValueError("Could not encode the processed image.")
    encoded = base64.b64encode(buffer).decode("utf-8")
    return "data:image/jpeg;base64," + encoded
