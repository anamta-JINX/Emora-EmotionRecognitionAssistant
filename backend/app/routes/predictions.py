"""Image and webcam prediction API routes."""

from __future__ import annotations

from flask import Flask, current_app, jsonify, request

from backend.app.services.emotion_service import detect_emotion_in_bgr_image
from backend.app.utils.images import (
    decode_base64_image,
    decode_uploaded_image,
    encode_jpeg_data_url,
    encode_png_data_url,
)


def _prediction_response(image, *, fast: bool = False):
    if image is None:
        return jsonify({"error": "Invalid or unsupported image data"}), 400

    try:
        annotated, label = detect_emotion_in_bgr_image(image, fast=fast)
    except FileNotFoundError as exc:
        current_app.logger.error("EMORA model is missing: %s", exc)
        return jsonify({
            "error": "Emotion model is not configured",
            "details": str(exc),
        }), 503
    except Exception as exc:  # keep API failures readable instead of exposing a traceback
        current_app.logger.exception("Emotion prediction failed")
        return jsonify({"error": "Emotion prediction failed", "details": str(exc)}), 500

    if annotated is None:
        return jsonify({"error": "No face detected"}), 200

    return jsonify({
        "label": label,
        "image_base64": (
            encode_jpeg_data_url(annotated) if fast else encode_png_data_url(annotated)
        ),
    })


def predict_image():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400
    return _prediction_response(decode_uploaded_image(request.files["image"]))


def predict_webcam():
    data = request.get_json(silent=True)
    if not data or "image" not in data:
        return jsonify({"error": "No image data"}), 400
    return _prediction_response(decode_base64_image(data["image"]), fast=True)


def register_prediction_routes(app: Flask) -> None:
    app.add_url_rule(
        "/predict_image",
        endpoint="predict_image",
        view_func=predict_image,
        methods=["POST"],
    )
    app.add_url_rule(
        "/predict_webcam",
        endpoint="predict_webcam",
        view_func=predict_webcam,
        methods=["POST"],
    )
