document.addEventListener("DOMContentLoaded", () => {

  /* =======================
     ELEMENTS
  ======================= */
  const dropzone = document.getElementById("dropzone");
  const imageInput = document.getElementById("image-input");
  const analyzeBtn = document.getElementById("analyze-upload");
  const clearBtn = document.getElementById("clear-upload");

  const fileMeta = document.getElementById("file-meta");
  const fileNameEl = document.getElementById("file-name");
  const fileSizeEl = document.getElementById("file-size");

  const resultText = document.getElementById("result-text");
  const resultImage = document.getElementById("result-image");
  const previewEmpty = document.getElementById("preview-empty");
  const resultPill = document.getElementById("result-pill");
  const resultHint = document.getElementById("result-hint");

  const confidenceWrap = document.getElementById("confidence-wrap");
  const confidenceVal = document.getElementById("confidence-val");
  const confidenceBar = document.getElementById("confidence-bar");

  const camStatus = document.getElementById("cam-status");
  const cameraOverlay = document.getElementById("camera-overlay");

  const video = document.getElementById("video");
  const startWebcamBtn = document.getElementById("start-webcam");
  const stopWebcamBtn = document.getElementById("stop-webcam");
  const captureBtn = document.getElementById("capture");

  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  /* =======================
     SAFETY CHECK
  ======================= */
  const required = { dropzone, imageInput, analyzeBtn, clearBtn, resultText, resultImage, video, startWebcamBtn, stopWebcamBtn, captureBtn, canvas };
  for (const [k, v] of Object.entries(required)) {
    if (!v) {
      console.error(`Missing element: ${k}. Check your HTML id="${k}"`);
      return;
    }
  }

  let stream = null;
  let selectedFile = null;

  /* =======================
     UI HELPERS
  ======================= */
  const setPill = (text) => { resultPill.textContent = text; };

  const showPreviewImage = (src) => {
    resultImage.src = src;
    resultImage.style.display = "block";
    previewEmpty.style.display = "none";
  };

  const resetResult = () => {
    resultText.textContent = "No emotion detected yet.";
    resultImage.style.display = "none";
    previewEmpty.style.display = "block";
    setPill("Idle");
    resultHint.textContent = "Tip: Use a well-lit image with a clear face for best results.";

    confidenceWrap.style.display = "none";
    confidenceBar.style.width = "0%";

    resetEmotionColors();
  };

  const fmtSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  /* =======================
     EMOTION COLOR SYSTEM
  ======================= */
  function applyEmotionColor(emotion) {
    const emo = emotion.toLowerCase();

    // Reset text + pill
    resultText.className = "result-value";
    resultPill.className = "pill";

    // Apply emotion text + pill color
    resultText.classList.add(`emo-${emo}`, "result-glow");
    resultPill.classList.add(`pill-${emo}`);

    // Select result card + preview box
    const card = document.querySelector(".demo-card-wide");
    const preview = document.querySelector(".result-preview");

    // Reset card + preview classes
    card.className = "demo-card-wide";
    preview.className = "result-preview";

    // Apply premium emotion glow + background tint
    card.classList.add(`emotion-bg-${emo}`, `emotion-glow-${emo}`);

    // Apply preview glow
    preview.classList.add(`preview-glow-${emo}`);
  }

  function resetEmotionColors() {
    resultText.className = "result-value";
    resultPill.className = "pill";

    const card = document.querySelector(".demo-card-wide");
    const preview = document.querySelector(".result-preview");

    card.className = "demo-card-wide";
    preview.className = "result-preview";
  }

  /* =======================
     DROPZONE + FILE PICK
  ======================= */
  dropzone.addEventListener("click", () => imageInput.click());
  dropzone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") imageInput.click();
  });

  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("dragover");
  });

  dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dragover"));

  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) {
      imageInput.files = e.dataTransfer.files;
      handleSelectedFile(file);
    }
  });

  function handleSelectedFile(file) {
    selectedFile = file;
    analyzeBtn.disabled = false;
    clearBtn.disabled = false;

    fileNameEl.textContent = file.name;
    fileSizeEl.textContent = fmtSize(file.size);
    fileMeta.style.display = "flex";

    setPill("Ready");
    resultHint.textContent = "Press “Analyze Upload” to detect emotion.";
  }

  imageInput.addEventListener("change", () => {
    if (imageInput.files.length) handleSelectedFile(imageInput.files[0]);
  });

  /* =======================
     ANALYZE UPLOAD
  ======================= */
  analyzeBtn.addEventListener("click", async () => {
    if (!selectedFile) return;

    setPill("Analyzing...");
    resultText.textContent = "Analyzing uploaded image...";

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const res = await fetch("/predict_image", { method: "POST", body: formData });
      const data = await res.json();

      handleResult(data);

    } catch (err) {
      console.error(err);
      resultText.textContent = "Server error. Check Flask is running.";
      setPill("Error");
    }
  });

  /* =======================
     CLEAR UPLOAD
  ======================= */
  clearBtn.addEventListener("click", () => {
    selectedFile = null;
    imageInput.value = "";
    analyzeBtn.disabled = true;
    clearBtn.disabled = true;

    fileMeta.style.display = "none";
    resetResult();
  });

  /* =======================
     WEBCAM
  ======================= */
  startWebcamBtn.addEventListener("click", async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;

      stopWebcamBtn.disabled = false;
      captureBtn.disabled = false;

      camStatus.textContent = "On";
      cameraOverlay.style.display = "none";

    } catch (err) {
      console.error(err);
      alert("Camera access denied OR page is not served from localhost/https.");
    }
  });

  stopWebcamBtn.addEventListener("click", () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      stream = null;
    }

    video.srcObject = null;
    stopWebcamBtn.disabled = true;
    captureBtn.disabled = true;

    camStatus.textContent = "Off";
    cameraOverlay.style.display = "flex";
  });

  captureBtn.addEventListener("click", async () => {
    if (!video.videoWidth || !video.videoHeight) {
      alert("Camera not ready yet. Try again in a second.");
      return;
    }

    setPill("Analyzing...");
    resultText.textContent = "Analyzing webcam image...";

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL("image/png");

    try {
      const res = await fetch("/predict_webcam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData })
      });

      const data = await res.json();
      handleResult(data);

    } catch (err) {
      console.error(err);
      resultText.textContent = "Server error. Check Flask is running.";
      setPill("Error");
    }
  });

  /* =======================
     HANDLE RESULT
  ======================= */
  function handleResult(data) {
    if (data.error) {
      resultText.textContent = data.error;
      setPill("No face");
      resetEmotionColors();
      return;
    }

    resultText.textContent = data.label;
    showPreviewImage(data.image_base64);
    setPill("Done");

    applyEmotionColor(data.label);

    if (data.confidence !== undefined) {
      confidenceWrap.style.display = "block";
      const pct = Math.round(data.confidence * 100);
      confidenceVal.textContent = pct + "%";
      confidenceBar.style.width = pct + "%";
    }
  }

  /* =======================
     INITIAL STATE
  ======================= */
  resetResult();
});
