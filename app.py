from flask import Flask, render_template, request, jsonify
import cv2
import numpy as np
import base64

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
    """
    data_url: 'data:image/png;base64,...'
    returns BGR image (OpenCV)
    """
    if "," in data_url:
        _, encoded = data_url.split(",", 1)
    else:
        encoded = data_url
    img_bytes = base64.b64decode(encoded)
    nparr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return img

@app.route("/predict_image", methods=["POST"])
def predict_image():                    
    # For file upload
    if "image" in request.files:
        file = request.files["image"]
        file_bytes = np.frombuffer(file.read(), np.uint8)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
    else:
        return jsonify({"error": "No image uploaded"}), 400

    annotated, label = detect_emotion_in_bgr_image(img)
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
    data = request.json
    if not data or "image" not in data:
        return jsonify({"error": "No image data"}), 400

    img = _decode_base64_image(data["image"])
    annotated, label = detect_emotion_in_bgr_image(img)
    if annotated is None:
        return jsonify({"error": "No face detected"}), 200

    _, buffer = cv2.imencode(".png", annotated)
    encoded = base64.b64encode(buffer).decode("utf-8")
    return jsonify({
        "label": label,
        "image_base64": "data:image/png;base64," + encoded
    })

if __name__ == "__main__":
    import os

    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000)),
        debug=False
    )
#http://127.0.0.1:5000
