"""Regression checks for the instant webcam prediction path."""

from pathlib import Path
import sys
import types

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

# The sandbox does not install Flask; service tests do not need a real web app.
if "flask" not in sys.modules:
    flask_stub = types.ModuleType("flask")
    flask_stub.Flask = type("Flask", (), {})
    flask_stub.current_app = types.SimpleNamespace(logger=types.SimpleNamespace(error=lambda *a, **k: None, exception=lambda *a, **k: None))
    flask_stub.jsonify = lambda *args, **kwargs: None
    flask_stub.request = types.SimpleNamespace()
    flask_stub.send_from_directory = lambda *args, **kwargs: None
    sys.modules["flask"] = flask_stub

from backend.app.services import emotion_service


class _TensorLike:
    def __init__(self, value):
        self._value = value

    def numpy(self):
        return self._value


class _CallableModel:
    def __init__(self):
        self.calls = 0

    def __call__(self, model_input, training=False):
        self.calls += 1
        assert model_input.shape == (1, 48, 48, 1)
        assert training is False
        return _TensorLike(np.array([[0.05, 0.05, 0.05, 0.7, 0.05, 0.05, 0.05]], dtype=np.float32))


class _FakeCascade:
    def detectMultiScale(self, *_args, **_kwargs):
        # The second face is larger and must be the only prediction in fast mode.
        return np.array([[10, 10, 80, 80], [200, 80, 180, 180]], dtype=np.int32)


def test_direct_model_call_avoids_predict_setup():
    model = _CallableModel()
    result = emotion_service._run_model(model, np.zeros((1, 48, 48, 1), dtype=np.float32))
    assert model.calls == 1
    assert int(np.argmax(result)) == 3


def test_webcam_fast_mode_resizes_and_predicts_largest_face_once(monkeypatch):
    calls = []
    monkeypatch.setattr(emotion_service, "face_cascade", _FakeCascade())

    def fake_predict(face):
        calls.append(face.shape)
        return 3, np.array([0, 0, 0, 1, 0, 0, 0], dtype=np.float32)

    monkeypatch.setattr(emotion_service, "predict_emotion_ensemble", fake_predict)
    image = np.full((720, 1280, 3), 128, dtype=np.uint8)

    annotated, label = emotion_service.detect_emotion_in_bgr_image(image, fast=True)

    assert annotated.shape[1] == 640
    assert label == "Happy"
    assert calls == [(48, 48)]


def test_startup_preload_and_compressed_capture_are_wired():
    app_factory = (ROOT / "backend" / "app" / "__init__.py").read_text(encoding="utf-8")
    routes = (ROOT / "backend" / "app" / "routes" / "predictions.py").read_text(encoding="utf-8")
    workspace = (ROOT / "frontend" / "src" / "components" / "EmotionWorkspace.jsx").read_text(encoding="utf-8")
    production = (ROOT / "frontend" / "dist" / "assets" / "app" / "components" / "EmotionWorkspace.js").read_text(encoding="utf-8")

    assert "preload_models()" in app_factory
    assert 'EMORA_PRELOAD_MODEL", "1"' in app_factory
    assert "fast=True" in routes
    assert "encode_jpeg_data_url(annotated) if fast" in routes
    assert "WEBCAM_CAPTURE_MAX_WIDTH = 640" in workspace
    assert "toDataURL('image/jpeg', WEBCAM_JPEG_QUALITY)" in workspace
    assert "AbortController" in workspace
    assert "WEBCAM_CAPTURE_MAX_WIDTH = 640" in production
