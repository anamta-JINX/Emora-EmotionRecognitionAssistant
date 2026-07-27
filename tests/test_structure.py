"""Lightweight checks that do not import Flask or load TensorFlow models."""

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
FRONTEND = ROOT / "frontend"


def test_react_source_and_production_build_exist():
    assert (FRONTEND / "src" / "App.jsx").exists()
    assert (FRONTEND / "src" / "components" / "EmotionWorkspace.jsx").exists()
    assert (FRONTEND / "dist" / "index.html").exists()
    assert (FRONTEND / "dist" / "assets" / "app" / "main.js").exists()
    assert (FRONTEND / "dist" / "assets" / "app.css").exists()


def test_single_spa_replaces_duplicate_flask_templates():
    html_files = {path.relative_to(FRONTEND).as_posix() for path in FRONTEND.rglob("*.html")}
    assert html_files == {"index.html", "dist/index.html"}
    assert not (FRONTEND / "templates").exists()
    assert not (FRONTEND / "static").exists()

    pages = (ROOT / "backend" / "app" / "routes" / "pages.py").read_text(encoding="utf-8")
    assert "send_from_directory" in pages
    assert '"index.html"' in pages
    assert "render_template" not in pages


def test_upload_and_webcam_controls_keep_native_browser_functionality():
    workspace = (FRONTEND / "src" / "components" / "EmotionWorkspace.jsx").read_text(encoding="utf-8")
    assert 'htmlFor="emora-image-upload"' in workspace
    assert 'type="file"' in workspace
    assert "navigator.mediaDevices.getUserMedia" in workspace
    assert 'id="emora-webcam-preview"' in workspace
    assert 'id="emora-webcam-canvas"' in workspace
    assert "fetch('/predict_image'" in workspace
    assert "fetch('/predict_webcam'" in workspace


def test_original_hero_is_restored_in_react():
    home = (FRONTEND / "src" / "pages" / "HomePage.jsx").read_text(encoding="utf-8")
    assert "Welcome to <span>EMORA</span>" in home
    assert "Because <em>reading the room</em> can be tricky." in home
    assert "Try It Now" in home


def test_model_directory_exists():
    assert (ROOT / "backend" / "models").is_dir()
