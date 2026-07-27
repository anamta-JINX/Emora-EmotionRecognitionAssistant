# EMORA — Emotion Recognition Assistant

EMORA is a Flask emotion-recognition application with a React frontend for image upload and live webcam analysis. The original EMORA hero has been restored, and the frontend communicates directly with the existing Flask API routes.

## Restored functionality

- Native operating-system file picker for image selection
- Drag-and-drop image upload, preview, replacement, and removal
- Webcam permission request, start, live preview, capture, analysis, and stop
- Direct requests to `/predict_image`, `/predict_webcam`, and `/health`
- Original “Welcome to EMORA” hero and “Try It Now” flow
- Responsive React pages for every existing route
- Clear loading, no-face, API, permission, and missing-model states

The prediction implementation in `backend/app/routes/predictions.py` and its model services remains unchanged. Only the Flask page-serving configuration was adjusted so one compiled React application is served directly instead of maintaining duplicate Jinja HTML pages.

## Run the included production build

1. Create and activate a Python 3.10 virtual environment.
2. Install the runtime dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Place `emora_model.h5` in `backend/models/`.
4. Start Flask:

   ```bash
   python app.py
   ```

5. Open `http://127.0.0.1:5000`.

Use `localhost` or `127.0.0.1` and allow camera access in the browser. Webcam APIs are blocked on ordinary insecure remote HTTP pages.

The compiled React application is included in `frontend/dist`, so Node.js is not required to run the supplied production build.

## Develop the React frontend

Use Node.js 18 or newer:

```bash
cd frontend
npm install
npm run dev
```

Vite runs on `http://127.0.0.1:5173` and proxies the prediction and health endpoints to Flask on port `5000`.

Create a production build with:

```bash
npm run build
```

Vite writes the application directly to `frontend/dist`. Flask serves that directory at `/app/` and sends the same `dist/index.html` entry for each React route. There are no duplicated per-page Flask templates.

## Application routes

| Route | Page |
|---|---|
| `/` and `/home` | Original hero, overview, and live workspace |
| `/features` | Product capabilities |
| `/research` | Model pipeline and responsible-use notes |
| `/team` | Team and project values |
| `/faq` | Frequently asked questions |
| `/feedback` | Feedback form |
| `/profile` | Browser-local accessibility preferences |

## API connection

The React frontend uses relative URLs, so it talks to the same Flask host without a separate CORS setup:

- `POST /predict_image` — multipart image upload using the `image` field
- `POST /predict_webcam` — JSON request containing a captured base64 image
- `GET /health` — backend availability check

## Model files

The uploaded project does not include `backend/models/emora_model.h5`. Add the trained file before expecting real emotion predictions. Without it, the existing backend returns its model-unavailable response and React displays setup guidance.

Optional feedback models and datasets use the paths documented in `PROJECT_STRUCTURE.md`.

## Other commands

```bash
python -m backend.scripts.preprocess_datasets
python -m backend.scripts.train_model
python -m backend.scripts.evaluate_emora
python -m backend.scripts.emora_gui
python -m backend.scripts.manualtrain
```

Install `requirements-training.txt` for training, dataset processing, desktop OpenCV windows, and GUI workflows.

See `TESTING.md` for the delivered verification record.

## Instant webcam response

EMORA now loads and warms the TensorFlow model once while `python app.py` starts. The first browser prediction therefore does not pay the model-loading cost. Webcam captures are resized to at most 640 pixels wide and sent as compressed JPEG data, while `/predict_webcam` predicts only the largest visible face. Keep `EMORA_PRELOAD_MODEL=1` for this behaviour.
