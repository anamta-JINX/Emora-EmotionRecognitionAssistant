import base64
import os

import cv2
import numpy as np
from flask import Flask, jsonify, render_template, request

from emotion_core import detect_emotion_in_bgr_image

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("home.html")


@app.route("/home")
def home():
    return render_template("home.html")


@app.route("/team")
def team():
    return render_template("team.html")


@app.route("/features")
def features():
    return render_template("features.html")


@app.route("/research")
def research():
    return render_template("research.html")


@app.route("/faq")
def faq():
    return render_template("faq.html")


@app.route("/feedback")
def feedback():
    return render_template("feedback.html")


@app.route("/profile")
def profile():
    return render_template("profile.html")


def _decode_base64_image(data_url):
    if "," in data_url:
        _, encoded = data_url.split(",", 1)
    else:
        encoded = data_url

    image_bytes = base64.b64decode(encoded)
    image_array = np.frombuffer(image_bytes, np.uint8)

    return cv2.imdecode(image_array, cv2.IMREAD_COLOR)


@app.route("/predict_image", methods=["POST"])
def predict_image():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    file = request.files["image"]
    file_bytes = np.frombuffer(file.read(), np.uint8)
    image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

    annotated, label = detect_emotion_in_bgr_image(image)

    if annotated is None:
        return jsonify({"error": "No face detected"}), 200

    _, buffer = cv2.imencode(".png", annotated)
    encoded = base64.b64encode(buffer).decode("utf-8")

    return jsonify({
        "label": label,
        "image_base64": "data:image/png;base64," + encoded
    })


@app.route("/predict_webcam", methods=["POST"])
def predict_webcam():
    data = request.get_json(silent=True)

    if not data or "image" not in data:
        return jsonify({"error": "No image data"}), 400

    image = _decode_base64_image(data["image"])
    annotated, label = detect_emotion_in_bgr_image(image)

    if annotated is None:
        return jsonify({"error": "No face detected"}), 200

    _, buffer = cv2.imencode(".png", annotated)
    encoded = base64.b64encode(buffer).decode("utf-8")

    return jsonify({
        "label": label,
        "image_base64": "data:image/png;base64," + encoded
    })


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000)),
        debug=False
    )
