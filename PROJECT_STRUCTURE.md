# EMORA Project Structure

```text
Emora-EmotionRecognitionAssistant-Professional/
├── app.py                              # Flask entrypoint
├── frontend/
│   ├── index.html                      # Vite development/build entry
│   ├── src/
│   │   ├── components/                 # Navigation, footer, live workspace, UI sections
│   │   ├── pages/                      # React route pages
│   │   ├── App.jsx                     # Router and shared layout
│   │   ├── main.jsx                    # React entrypoint
│   │   └── index.css                   # Tailwind layers, old hero, animations
│   ├── dist/                           # Included production React build served by Flask
│   │   ├── index.html                  # Single production SPA entry
│   │   ├── assets/
│   │   └── imgs/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── backend/
│   ├── app/
│   │   ├── __init__.py                 # App factory; serves frontend/dist at /app
│   │   ├── config.py                   # Paths, including FRONTEND_DIST_DIR
│   │   ├── routes/
│   │   │   ├── pages.py                # Sends one React SPA entry for all page routes
│   │   │   └── predictions.py          # Original image/webcam prediction API
│   │   ├── services/                   # Existing model and face-detection logic
│   │   └── utils/                      # Existing image utilities
│   ├── scripts/                        # Training, evaluation, GUI, preprocessing
│   ├── models/                         # Put .h5/.keras models here
│   ├── data/                           # Datasets and generated outputs
│   └── resources/face_detector/        # Optional detector resources
├── docs/
├── archive/legacy/
├── tests/
├── TESTING.md
├── requirements.txt
├── requirements-training.txt
└── vercel.json
```

## Frontend integration

Flask serves `frontend/dist` at `/app/`. Every page route returns the same `frontend/dist/index.html`, and React Router selects the correct page in the browser. This removes the previous collection of duplicated `.html` templates.

The two remaining HTML files are required entry files:

- `frontend/index.html` for Vite development and future builds
- `frontend/dist/index.html` for the included production build

React calls the Flask API through relative paths, so upload and webcam requests are connected directly to the existing backend without CORS changes.

## Model and data locations

| Item | Recommended location |
|---|---|
| `emora_model.h5` | `backend/models/emora_model.h5` |
| `feedback_model.keras` | `backend/models/feedback_model.keras` |
| `feedback_model.h5` | `backend/models/feedback_model.h5` |
| `images_labels.npz` | `backend/data/preprocessed/images_labels.npz` |
| Evaluation outputs | `backend/data/evaluation_outputs/` |
| Feedback images | `backend/data/feedback_data/` |
| Raw datasets | `backend/data/datasets/` |
| Dataset archives | `backend/data/archives/` |
| `deploy.prototxt` | `backend/resources/face_detector/deploy.prototxt` |
| Caffe face detector model | `backend/resources/face_detector/res10_300x300_ssd_iter_140000.caffemodel` |

Do not commit `node_modules`, Python cache directories, temporary datasets, or private model files unless intentionally distributing them.
