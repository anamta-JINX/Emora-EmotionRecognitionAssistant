import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Camera,
  CameraOff,
  Check,
  CircleDot,
  FileImage,
  ImagePlus,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  ScanFace,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import Reveal from './Reveal';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const WEBCAM_CAPTURE_MAX_WIDTH = 640;
const WEBCAM_JPEG_QUALITY = 0.82;
const PREDICTION_TIMEOUT_MS = 15000;

const emotionDetails = {
  angry: {
    title: 'Angry',
    summary: 'The expression may show tension, frustration, or displeasure.',
    suggestion: 'Give the person space and use a calm, direct tone.',
    className: 'from-rose-50 to-orange-50 border-rose-100',
    badge: 'bg-rose-100 text-rose-700',
  },
  disgust: {
    title: 'Disgust',
    summary: 'The expression may indicate strong dislike or discomfort.',
    suggestion: 'Pause and check whether something feels unpleasant or unsafe.',
    className: 'from-lime-50 to-emerald-50 border-lime-100',
    badge: 'bg-lime-100 text-lime-800',
  },
  fear: {
    title: 'Fear',
    summary: 'The expression may suggest worry, alarm, or uncertainty.',
    suggestion: 'Offer reassurance and explain what will happen next.',
    className: 'from-violet-50 to-indigo-50 border-violet-100',
    badge: 'bg-violet-100 text-violet-700',
  },
  happy: {
    title: 'Happy',
    summary: 'The expression may show enjoyment, comfort, or positive engagement.',
    suggestion: 'This may be a good moment to continue the interaction warmly.',
    className: 'from-amber-50 to-yellow-50 border-amber-100',
    badge: 'bg-amber-100 text-amber-800',
  },
  sad: {
    title: 'Sad',
    summary: 'The expression may reflect low mood, disappointment, or distress.',
    suggestion: 'Respond gently and ask whether support would help.',
    className: 'from-sky-50 to-blue-50 border-sky-100',
    badge: 'bg-sky-100 text-sky-700',
  },
  surprise: {
    title: 'Surprised',
    summary: 'The expression may indicate an unexpected or sudden reaction.',
    suggestion: 'Allow a moment to process before asking for a response.',
    className: 'from-cyan-50 to-teal-50 border-cyan-100',
    badge: 'bg-cyan-100 text-cyan-800',
  },
  neutral: {
    title: 'Neutral',
    summary: 'The expression appears relatively calm or emotionally unclear.',
    suggestion: 'Use context and conversation rather than relying on expression alone.',
    className: 'from-slate-50 to-stone-50 border-slate-200',
    badge: 'bg-slate-200 text-slate-700',
  },
};

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function readJsonResponse(response) {
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('The server returned an unreadable response.');
  }

  if (!response.ok) {
    const detail = data.details ? ` ${data.details}` : '';
    throw new Error(`${data.error || 'Prediction request failed.'}${detail}`);
  }

  return data;
}

export default function EmotionWorkspace() {
  const [mode, setMode] = useState('upload');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking');

  const inputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    let active = true;
    fetch('/health')
      .then((response) => {
        if (!response.ok) throw new Error('offline');
        return response.json();
      })
      .then(() => active && setApiStatus('online'))
      .catch(() => active && setApiStatus('offline'));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    return () => releaseCameraStream();
  }, []);

  const resultDetail = useMemo(() => {
    if (!result?.label) return null;
    return emotionDetails[String(result.label).toLowerCase()] ?? {
      title: result.label,
      summary: 'An expression was detected in the submitted image.',
      suggestion: 'Use this result as a supportive clue, not a final judgement.',
      className: 'from-moss-50 to-white border-moss-100',
      badge: 'bg-moss-100 text-moss-700',
    };
  }, [result]);

  function resetResult() {
    setResult(null);
    setError('');
    setStatus('idle');
  }

  function clearFile() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl('');
    if (inputRef.current) inputRef.current.value = '';
    resetResult();
  }

  function acceptFile(file) {
    setError('');
    setResult(null);

    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Choose a JPG, PNG, or WEBP image.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('The image is larger than the 10 MB upload limit.');
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setStatus('ready');
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);
    acceptFile(event.dataTransfer.files?.[0]);
  }

  async function analyzeUpload() {
    if (!selectedFile || status === 'loading') return;
    setStatus('loading');
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      const response = await fetch('/predict_image', { method: 'POST', body: formData });
      const data = await readJsonResponse(response);
      if (!data.label) {
        setResult({ ...data, label: null, noFace: true });
        setStatus('done');
        return;
      }
      setResult(data);
      setStatus('done');
    } catch (requestError) {
      setError(requestError.message || 'Unable to analyze this image.');
      setStatus('error');
    }
  }

  function cameraErrorMessage(cameraError) {
    switch (cameraError?.name) {
      case 'NotAllowedError':
      case 'SecurityError':
        return 'Camera permission was denied. Click the camera icon in the browser address bar, allow access, then try again.';
      case 'NotFoundError':
      case 'OverconstrainedError':
        return 'No usable camera was found. Connect or enable a webcam, then try again.';
      case 'NotReadableError':
      case 'AbortError':
        return 'The camera is already being used by another app. Close that app and try again.';
      default: {
        const detail = cameraError?.message ? ` (${cameraError.message})` : '';
        return `The camera could not start${detail}. Open EMORA through http://localhost:5000 or HTTPS and allow camera access.`;
      }
    }
  }

  function getVideoElement() {
    if (videoRef.current) return videoRef.current;
    if (typeof document !== 'undefined') return document.getElementById('emora-webcam-preview');
    return null;
  }

  function getCanvasElement() {
    if (canvasRef.current) return canvasRef.current;
    if (typeof document !== 'undefined') return document.getElementById('emora-webcam-canvas');
    return null;
  }

  function releaseCameraStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    const video = getVideoElement();
    if (video) {
      video.pause();
      video.srcObject = null;
    }
  }

  async function startCamera() {
    if (cameraStarting) return;
    setError('');
    setResult(null);
    setCameraReady(false);

    if (!window.isSecureContext && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
      setError('Browsers only allow webcam access on localhost or a secure HTTPS page.');
      return;
    }
    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
      setError('Camera access is unavailable in this browser. Use a current Chrome, Edge, or Firefox browser.');
      return;
    }

    setCameraStarting(true);
    releaseCameraStream();

    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'user' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (primaryError) {
        if (primaryError?.name === 'OverconstrainedError') {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        } else {
          throw primaryError;
        }
      }

      streamRef.current = stream;

      let video = getVideoElement();
      if (!video) {
        await new Promise((resolve) => window.requestAnimationFrame(resolve));
        video = getVideoElement();
      }
      if (!video) throw new Error('Camera preview is unavailable.');
      video.srcObject = stream;
      setCameraActive(true);
      video.muted = true;
      video.setAttribute('playsinline', '');

      if (video.readyState < 1) {
        await new Promise((resolve, reject) => {
          const timeout = window.setTimeout(() => reject(new Error('Camera start timed out.')), 8000);
          const onReady = () => {
            window.clearTimeout(timeout);
            video.removeEventListener('loadedmetadata', onReady);
            resolve();
          };
          video.addEventListener('loadedmetadata', onReady, { once: true });
        });
      }

      await video.play();
      setCameraReady(Boolean(video.videoWidth && video.videoHeight));
      setStatus('ready');
    } catch (cameraError) {
      releaseCameraStream();
      setCameraActive(false);
      setCameraReady(false);
      setStatus('error');
      setError(cameraErrorMessage(cameraError));
    } finally {
      setCameraStarting(false);
    }
  }

  function stopCamera() {
    releaseCameraStream();
    setCameraActive(false);
    setCameraReady(false);
    setCameraStarting(false);
    resetResult();
  }

  async function captureAndAnalyze() {
    const video = getVideoElement();
    const canvas = getCanvasElement();
    if (!video || !canvas || !video.videoWidth || !video.videoHeight) {
      setError('The camera is still starting. Try again in a moment.');
      return;
    }

    setStatus('loading');
    setError('');
    setResult(null);

    const scale = Math.min(1, WEBCAM_CAPTURE_MAX_WIDTH / video.videoWidth);
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    const context = canvas.getContext('2d', { alpha: false });
    context.setTransform(-1, 0, 0, 1, canvas.width, 0);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    context.setTransform(1, 0, 0, 1, 0, 0);
    const image = canvas.toDataURL('image/jpeg', WEBCAM_JPEG_QUALITY);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), PREDICTION_TIMEOUT_MS);

    try {
      const response = await fetch('/predict_webcam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
        signal: controller.signal,
      });
      const data = await readJsonResponse(response);
      if (!data.label) {
        setResult({ ...data, label: null, noFace: true });
        setStatus('done');
        return;
      }
      setResult(data);
      setStatus('done');
    } catch (requestError) {
      const message = requestError?.name === 'AbortError'
        ? 'Prediction took too long. Restart Flask once so the model can preload, then try again.'
        : requestError.message || 'Unable to analyze the camera frame.';
      setError(message);
      setStatus('error');
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function switchMode(nextMode) {
    if (nextMode === mode) return;
    if (mode === 'camera') stopCamera();
    setMode(nextMode);
    setError('');
    setResult(null);
    setStatus(nextMode === 'upload' && selectedFile ? 'ready' : 'idle');
  }

  return (
    <section id="workspace" className="relative scroll-mt-24 bg-ink py-20 sm:py-24 lg:py-28">
      <div className="noise-layer pointer-events-none absolute inset-0 opacity-30" />
      <div className="absolute left-0 top-0 h-80 w-80 rounded-full bg-moss-500/15 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-peach-400/10 blur-3xl" />

      <div className="container-page relative">
        <Reveal className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-moss-400/20 bg-moss-400/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-moss-200">
            <Sparkles size={14} /> Live workspace
          </span>
          <h2 className="mt-6 font-display text-4xl font-extrabold tracking-[-0.04em] text-white sm:text-5xl">See the expression. Understand the moment.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-300">Upload a clear photo or use your webcam. EMORA sends a lightweight camera frame to Flask and returns the annotated result without first-capture model loading.</p>
        </Reveal>

        <Reveal delay={120} className="mt-12">
          <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.06] p-2 shadow-2xl backdrop-blur-xl">
            <div className="rounded-[27px] bg-[#F7F8F4] p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col gap-4 border-b border-moss-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="inline-flex w-full rounded-2xl bg-moss-50 p-1 sm:w-auto">
                  <button type="button" onClick={() => switchMode('upload')} className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition sm:flex-none ${mode === 'upload' ? 'bg-white text-ink shadow-sm' : 'text-slate-500 hover:text-ink'}`}>
                    <ImagePlus size={17} /> Upload image
                  </button>
                  <button type="button" onClick={() => switchMode('camera')} className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition sm:flex-none ${mode === 'camera' ? 'bg-white text-ink shadow-sm' : 'text-slate-500 hover:text-ink'}`}>
                    <Camera size={17} /> Use webcam
                  </button>
                </div>

                <div className={`inline-flex items-center gap-2 self-start rounded-full px-3 py-1.5 text-xs font-bold sm:self-auto ${apiStatus === 'online' ? 'bg-emerald-50 text-emerald-700' : apiStatus === 'offline' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                  {apiStatus === 'online' ? <Wifi size={14} /> : apiStatus === 'offline' ? <WifiOff size={14} /> : <LoaderCircle size={14} className="animate-spin" />}
                  API {apiStatus === 'checking' ? 'checking' : apiStatus}
                </div>
              </div>

              <div className="grid gap-6 pt-6 lg:grid-cols-[1.03fr_.97fr]">
                <div className="min-w-0">
                  {mode === 'upload' ? (
                    <div>
                      <input
                        ref={inputRef}
                        id="emora-image-upload"
                        name="image"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        onClick={(event) => { event.currentTarget.value = ''; }}
                        onChange={(event) => acceptFile(event.currentTarget.files?.[0])}
                      />

                      {!selectedFile ? (
                        <label
                          htmlFor="emora-image-upload"
                          onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
                          onDragOver={(event) => event.preventDefault()}
                          onDragLeave={(event) => { event.preventDefault(); setDragging(false); }}
                          onDrop={handleDrop}
                          className={`group grid min-h-[430px] w-full cursor-pointer place-items-center rounded-[26px] bg-white p-8 text-center transition duration-300 ${dragging ? 'upload-dashes scale-[0.99] bg-moss-50' : 'border-2 border-dashed border-moss-200 hover:border-moss-400 hover:bg-moss-50/60'}`}
                        >
                          <span>
                            <span className="mx-auto grid h-20 w-20 place-items-center rounded-[24px] bg-moss-100 text-moss-700 transition duration-300 group-hover:-translate-y-1 group-hover:rotate-2 group-hover:bg-moss-200">
                              <UploadCloud size={34} />
                            </span>
                            <span className="mt-6 block font-display text-xl font-extrabold text-ink">Drop a face photo here</span>
                            <span className="mx-auto mt-3 block max-w-sm text-sm leading-6 text-slate-500">or click anywhere in this box to browse JPG, PNG, or WEBP files up to 10 MB.</span>
                            <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white">Choose image <FileImage size={16} /></span>
                          </span>
                        </label>
                      ) : (
                        <div className="relative min-h-[430px] overflow-hidden rounded-[26px] bg-slate-900">
                          <img src={previewUrl} alt="Selected face preview" className="absolute inset-0 h-full w-full object-contain" />
                          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 bg-gradient-to-t from-black/85 via-black/55 to-transparent p-5 pt-16 sm:flex-row sm:items-end sm:justify-between">
                            <div className="min-w-0 text-left text-white">
                              <p className="truncate text-sm font-bold">{selectedFile.name}</p>
                              <p className="mt-1 text-xs text-white/65">{formatFileSize(selectedFile.size)}</p>
                            </div>
                            <button type="button" onClick={clearFile} className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white backdrop-blur transition hover:bg-white/20">
                              <Trash2 size={14} /> Remove
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                        <button type="button" onClick={analyzeUpload} disabled={!selectedFile || status === 'loading'} className="button-primary flex-1 rounded-2xl py-3.5">
                          {status === 'loading' ? <LoaderCircle size={18} className="animate-spin" /> : <ScanFace size={18} />}
                          {status === 'loading' ? 'Analyzing image…' : 'Analyze image'}
                        </button>
                        <label htmlFor="emora-image-upload" className="button-secondary cursor-pointer rounded-2xl py-3.5">
                          <RefreshCw size={17} /> Choose another
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="relative min-h-[430px] overflow-hidden rounded-[26px] bg-slate-950">
                        <video
                          id="emora-webcam-preview"
                          ref={videoRef}
                          autoPlay
                          muted
                          playsInline
                          onLoadedMetadata={(event) => setCameraReady(Boolean(event.currentTarget.videoWidth && event.currentTarget.videoHeight))}
                          onCanPlay={(event) => setCameraReady(Boolean(event.currentTarget.videoWidth && event.currentTarget.videoHeight))}
                          className={`camera-feed absolute inset-0 h-full w-full object-cover transition duration-500 ${cameraActive ? 'opacity-100' : 'opacity-0'}`}
                        />
                        {!cameraActive && (
                          <div className="absolute inset-0 grid place-items-center p-8 text-center">
                            <div>
                              <span className="mx-auto grid h-20 w-20 place-items-center rounded-[24px] bg-white/10 text-moss-200"><CameraOff size={32} /></span>
                              <p className="mt-6 font-display text-xl font-extrabold text-white">Camera is off</p>
                              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-400">Camera access works on localhost or a secure HTTPS connection.</p>
                            </div>
                          </div>
                        )}
                        {cameraActive && (
                          <div className="pointer-events-none absolute inset-0">
                            <span className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-black/45 px-3 py-1.5 text-xs font-bold text-white backdrop-blur"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Live</span>
                            <div className="absolute left-1/2 top-1/2 h-[68%] w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-[42%] border border-white/45 shadow-[0_0_0_999px_rgba(0,0,0,.15)]" />
                          </div>
                        )}
                      </div>
                      <canvas id="emora-webcam-canvas" ref={canvasRef} className="hidden" />

                      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                        {!cameraActive ? (
                          <button type="button" onClick={startCamera} disabled={cameraStarting} className="button-primary flex-1 rounded-2xl py-3.5">
                            {cameraStarting ? <LoaderCircle size={18} className="animate-spin" /> : <Camera size={18} />}
                            {cameraStarting ? 'Starting camera…' : 'Start camera'}
                          </button>
                        ) : (
                          <>
                            <button type="button" onClick={captureAndAnalyze} disabled={!cameraReady || status === 'loading'} className="button-primary flex-1 rounded-2xl py-3.5">
                              {status === 'loading' ? <LoaderCircle size={18} className="animate-spin" /> : <CircleDot size={18} />}
                              {status === 'loading' ? 'Analyzing frame…' : cameraReady ? 'Capture & analyze' : 'Preparing camera…'}
                            </button>
                            <button type="button" onClick={stopCamera} className="button-secondary rounded-2xl py-3.5"><CameraOff size={17} /> Stop</button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="relative flex min-h-[502px] flex-col overflow-hidden rounded-[26px] border border-moss-100 bg-white p-5 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-moss-600">Analysis result</p>
                        <p className="mt-1 text-sm text-slate-500">One supportive signal, not a final judgement.</p>
                      </div>
                      <span className={`grid h-10 w-10 place-items-center rounded-2xl ${status === 'done' ? 'bg-emerald-50 text-emerald-600' : status === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-moss-50 text-moss-600'}`}>
                        {status === 'done' ? <Check size={19} /> : status === 'error' ? <X size={19} /> : status === 'loading' ? <LoaderCircle size={19} className="animate-spin" /> : <ScanFace size={19} />}
                      </span>
                    </div>

                    <div className="mt-6 flex flex-1 flex-col">
                      {error ? (
                        <div className="flex flex-1 flex-col items-center justify-center rounded-[22px] border border-rose-100 bg-rose-50 p-7 text-center">
                          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-white text-rose-600 shadow-sm"><AlertCircle size={28} /></span>
                          <h3 className="mt-5 font-display text-xl font-extrabold text-rose-900">Analysis unavailable</h3>
                          <p className="mt-3 max-w-sm text-sm leading-6 text-rose-700">{error}</p>
                          {error.toLowerCase().includes('missing base model') || error.toLowerCase().includes('model is not configured') ? (
                            <p className="mt-4 rounded-xl bg-white/75 px-4 py-3 text-xs leading-5 text-rose-700">Place <strong>emora_model.h5</strong> inside <strong>backend/models/</strong>, then restart Flask.</p>
                          ) : null}
                        </div>
                      ) : status === 'loading' ? (
                        <div className="flex flex-1 flex-col items-center justify-center rounded-[22px] bg-moss-50 p-7 text-center">
                          <span className="relative grid h-20 w-20 place-items-center rounded-full border border-moss-200 bg-white text-moss-700 shadow-sm">
                            <LoaderCircle size={31} className="animate-spin" />
                            <span className="absolute inset-[-8px] animate-ping rounded-full border border-moss-300/50" />
                          </span>
                          <h3 className="mt-6 font-display text-xl font-extrabold">Reading the expression…</h3>
                          <p className="mt-3 text-sm leading-6 text-slate-500">Detecting a face, preparing the model input, and annotating the result.</p>
                        </div>
                      ) : result?.noFace ? (
                        <div className="flex flex-1 flex-col">
                          {result.image_base64 && <img src={result.image_base64} alt="Analyzed frame with no detected face" className="h-60 w-full rounded-[22px] bg-slate-100 object-contain" />}
                          <div className="mt-4 rounded-[22px] border border-amber-100 bg-amber-50 p-5">
                            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-amber-700"><AlertCircle size={14} /> No clear face</span>
                            <h3 className="mt-4 font-display text-2xl font-extrabold text-amber-950">Try a clearer frame</h3>
                            <p className="mt-3 text-sm leading-6 text-amber-800">Use front-facing lighting, keep the face unobstructed, and move slightly closer to the camera.</p>
                          </div>
                        </div>
                      ) : resultDetail ? (
                        <div className="flex flex-1 flex-col">
                          {result.image_base64 && (
                            <div className="relative result-shine overflow-hidden rounded-[22px] bg-slate-950">
                              <img src={result.image_base64} alt={`EMORA detected ${resultDetail.title}`} className="h-60 w-full object-contain" />
                            </div>
                          )}
                          <div className={`mt-4 flex-1 rounded-[22px] border bg-gradient-to-br p-5 ${resultDetail.className}`}>
                            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-[0.1em] ${resultDetail.badge}`}><Sparkles size={13} /> Detected</span>
                            <h3 className="mt-4 font-display text-4xl font-extrabold tracking-[-0.04em] text-ink">{resultDetail.title}</h3>
                            <p className="mt-3 text-sm leading-6 text-slate-700">{resultDetail.summary}</p>
                            <div className="mt-5 rounded-2xl bg-white/75 p-4">
                              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-moss-700">A supportive next step</p>
                              <p className="mt-2 text-sm leading-6 text-slate-700">{resultDetail.suggestion}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-1 flex-col items-center justify-center rounded-[22px] border border-dashed border-moss-200 bg-moss-50/60 p-7 text-center">
                          <span className="grid h-20 w-20 place-items-center rounded-[24px] bg-white text-moss-600 shadow-sm"><ScanFace size={32} /></span>
                          <h3 className="mt-6 font-display text-xl font-extrabold">Your result will appear here</h3>
                          <p className="mt-3 max-w-sm text-sm leading-6 text-slate-500">Choose a well-lit image with a visible face, or start the camera and capture a frame.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 border-t border-moss-100 pt-6 sm:grid-cols-3">
                <div className="flex items-start gap-3 rounded-2xl bg-white p-4"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-moss-600" /><div><p className="text-xs font-bold text-ink">Supportive by design</p><p className="mt-1 text-xs leading-5 text-slate-500">Results are cues, not certainty.</p></div></div>
                <div className="flex items-start gap-3 rounded-2xl bg-white p-4"><LockKeyhole size={18} className="mt-0.5 shrink-0 text-moss-600" /><div><p className="text-xs font-bold text-ink">Your existing backend</p><p className="mt-1 text-xs leading-5 text-slate-500">Same endpoints, faster execution.</p></div></div>
                <div className="flex items-start gap-3 rounded-2xl bg-white p-4"><ScanFace size={18} className="mt-0.5 shrink-0 text-moss-600" /><div><p className="text-xs font-bold text-ink">Clear face works best</p><p className="mt-1 text-xs leading-5 text-slate-500">Good light improves detection.</p></div></div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
