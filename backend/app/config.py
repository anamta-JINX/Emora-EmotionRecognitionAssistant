"""Central path and Flask configuration for EMORA."""

from __future__ import annotations

import os
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_ROOT = PROJECT_ROOT / "backend"
FRONTEND_ROOT = PROJECT_ROOT / "frontend"

MODELS_DIR = BACKEND_ROOT / "models"
DATA_DIR = BACKEND_ROOT / "data"
DATASETS_DIR = DATA_DIR / "datasets"
PREPROCESSED_DIR = DATA_DIR / "preprocessed"
FEEDBACK_DATA_DIR = DATA_DIR / "feedback_data"
EVALUATION_OUTPUTS_DIR = DATA_DIR / "evaluation_outputs"
ARCHIVES_DIR = DATA_DIR / "archives"
RESOURCES_DIR = BACKEND_ROOT / "resources"
FACE_DETECTOR_DIR = RESOURCES_DIR / "face_detector"

FRONTEND_DIST_DIR = FRONTEND_ROOT / "dist"


def _configured_path(env_name: str, default: Path, *legacy_candidates: Path) -> Path:
    """Resolve an optional env path, then the professional path, then old root paths."""
    configured = os.environ.get(env_name)
    if configured:
        path = Path(configured).expanduser()
        return path if path.is_absolute() else PROJECT_ROOT / path

    for candidate in (default, *legacy_candidates):
        if candidate.exists():
            return candidate

    return default


BASE_MODEL_PATH = _configured_path(
    "EMORA_BASE_MODEL_PATH",
    MODELS_DIR / "emora_model.h5",
    PROJECT_ROOT / "emora_model.h5",
)
FEEDBACK_MODEL_PATH = _configured_path(
    "EMORA_FEEDBACK_MODEL_PATH",
    MODELS_DIR / "feedback_model.keras",
    MODELS_DIR / "feedback_model.h5",
    PROJECT_ROOT / "feedback_model.keras",
    PROJECT_ROOT / "feedback_model.h5",
)
DNN_PROTOTXT_PATH = _configured_path(
    "EMORA_DNN_PROTOTXT_PATH",
    FACE_DETECTOR_DIR / "deploy.prototxt",
    PROJECT_ROOT / "deploy.prototxt",
)
DNN_MODEL_PATH = _configured_path(
    "EMORA_DNN_MODEL_PATH",
    FACE_DETECTOR_DIR / "res10_300x300_ssd_iter_140000.caffemodel",
    PROJECT_ROOT / "res10_300x300_ssd_iter_140000.caffemodel",
)


class Config:
    PROJECT_ROOT = PROJECT_ROOT
    BACKEND_ROOT = BACKEND_ROOT
    FRONTEND_ROOT = FRONTEND_ROOT
    FRONTEND_DIST_DIR = FRONTEND_DIST_DIR

    MODELS_DIR = MODELS_DIR
    DATA_DIR = DATA_DIR
    DATASETS_DIR = DATASETS_DIR
    PREPROCESSED_DIR = PREPROCESSED_DIR
    FEEDBACK_DATA_DIR = FEEDBACK_DATA_DIR
    EVALUATION_OUTPUTS_DIR = EVALUATION_OUTPUTS_DIR
    ARCHIVES_DIR = ARCHIVES_DIR
    FACE_DETECTOR_DIR = FACE_DETECTOR_DIR

    BASE_MODEL_PATH = BASE_MODEL_PATH
    FEEDBACK_MODEL_PATH = FEEDBACK_MODEL_PATH
    DNN_PROTOTXT_PATH = DNN_PROTOTXT_PATH
    DNN_MODEL_PATH = DNN_MODEL_PATH

    MAX_CONTENT_LENGTH = int(os.environ.get("EMORA_MAX_UPLOAD_MB", "10")) * 1024 * 1024
    JSON_SORT_KEYS = False
