# EMORA React Frontend — Test Record

## Browser integration

The included production build was served with the same SPA route and `/app/` asset behaviour used by Flask, then tested in headless Chromium.

| Check | Result |
|---|---|
| `/`, `/home`, `/features`, `/research`, `/team`, `/faq`, `/feedback`, `/profile` render | Passed |
| Original `Welcome to EMORA` hero appears | Passed |
| Native file chooser opens from `Choose image` | Passed |
| PNG selection and preview | Passed |
| Upload request reaches `POST /predict_image` | Passed |
| Webcam permission and stream startup | Passed |
| Live webcam dimensions | Passed — 1280 × 720 test stream |
| Webcam track is active and video is playing | Passed |
| Captured frame reaches `POST /predict_webcam` | Passed |
| Stop button releases the webcam stream | Passed |
| Desktop rendering at 1440 × 1000 | Passed |
| Mobile rendering at 390 × 844 | Passed |
| Horizontal mobile overflow | None |
| JavaScript page/runtime errors | None |
| Browser console errors | None |

Prediction responses were mocked during browser integration testing so the frontend/API contract could be verified without loading TensorFlow. The actual prediction route implementation was not modified.

## Structure and source checks

- The old duplicated `frontend/templates` directory was removed.
- The old duplicated `frontend/static` React copy was removed.
- Only the required Vite source entry and compiled SPA entry remain as HTML files.
- React calls the existing relative Flask API endpoints directly.
- The upload control uses a native label-to-file-input connection.
- The webcam preview and capture canvas have stable DOM targets, preventing ref timing failures.
- Python source compilation and lightweight `pytest` structure checks were run.
- Generated JavaScript modules were syntax checked.

## Environment note

The uploaded project does not include `backend/models/emora_model.h5`. Add that trained model to produce real emotion predictions. Until then, Flask retains its existing model-unavailable behaviour and React shows the corresponding guidance.

## Instant-response regression

| Check | Result |
|---|---|
| TensorFlow model preloads during Flask startup | Passed — source/runtime wiring verified |
| Model warm-up runs before prediction requests | Passed — direct-call unit test |
| Webcam request remains `POST /predict_webcam` | Passed |
| 1280 × 720 camera frame is reduced before upload | Passed — 640 × 360 |
| Webcam request format | Passed — compressed JPEG data URL |
| Test capture payload | Passed — approximately 4.5 KB with Chromium fake camera |
| Webcam result renders after mocked response | Passed |
| Fast backend mode predicts only the largest face | Passed |
| Python test suite | Passed — 8 tests |

The actual TensorFlow model file is not present in the supplied ZIP, so its machine-specific inference duration could not be benchmarked here. The original 40–60 second first-request load has been moved to Flask startup and the model is warmed before the browser can submit a prediction.
