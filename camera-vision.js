(() => {
  const MP_VERSION = "0.10.32";
  const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task";
  const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}/wasm`;
  const MODULE_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}`;
  const SAMPLE_W = 48;
  const SAMPLE_H = 36;
  const REACTION_GAP = 3000;

  const $ = (selector) => document.querySelector(selector);
  const els = {
    toggle: null,
    video: null,
    status: null,
    signal: null,
    preview: null,
  };

  let stream = null;
  let running = false;
  let recognizer = null;
  let recognizerPromise = null;
  let mediaPipeFailed = false;
  let lastFrame = null;
  let lastReactionAt = 0;
  let lastLoopAt = 0;
  let canvas = null;
  let ctx = null;
  let handTrail = [];

  function setStatus(text, active = false) {
    if (els.status) els.status.textContent = text;
    if (els.preview) {
      els.preview.classList.toggle("is-on", running);
      els.preview.classList.toggle("is-active", active);
    }
    document.body.classList.toggle("camera-seeing", active);
  }

  function setSignal(text) {
    if (els.signal) els.signal.textContent = text;
  }

  function react(type, label) {
    const now = Date.now();
    if (now - lastReactionAt < REACTION_GAP) return;
    lastReactionAt = now;
    window.dispatchEvent(new CustomEvent("sioni:camera-react", { detail: { type, label } }));
  }

  async function ensureGestureRecognizer() {
    if (recognizer || mediaPipeFailed) return recognizer;
    if (recognizerPromise) return recognizerPromise;
    recognizerPromise = loadGestureRecognizer();
    return recognizerPromise;
  }

  async function loadGestureRecognizer() {
    try {
      const vision = await import(MODULE_URL);
      const fileset = await vision.FilesetResolver.forVisionTasks(WASM_URL);
      try {
        recognizer = await createRecognizer(vision, fileset, "GPU");
      } catch (error) {
        recognizer = await createRecognizer(vision, fileset, "CPU");
      }
      return recognizer;
    } catch (error) {
      mediaPipeFailed = true;
      setSignal("손짓 인식은 잠시 쉬고, 빛과 움직임을 보고 있어요.");
      return null;
    } finally {
      recognizerPromise = null;
    }
  }

  function createRecognizer(vision, fileset, delegate) {
    return vision.GestureRecognizer.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath: MODEL_URL,
        delegate,
      },
      runningMode: "VIDEO",
      numHands: 1,
    });
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("카메라를 못 찾았어요");
      setSignal("이 브라우저에서는 카메라 반응을 사용할 수 없어요.");
      react("camera-error", "unsupported");
      return;
    }

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: { ideal: 360 },
          height: { ideal: 270 },
        },
      });
      els.video.srcObject = stream;
      await els.video.play();
      running = true;
      els.toggle?.setAttribute("aria-pressed", "true");
      setStatus("보고 있어요", true);
      setSignal("손을 보여주거나 천천히 흔들어보세요.");
      react("camera-on", "camera");
      ensureGestureRecognizer();
      requestAnimationFrame(loop);
    } catch (error) {
      setStatus("허용이 필요해요");
      setSignal("카메라 권한을 허용하면 시오니가 볼 수 있어요.");
      react("camera-denied", "denied");
    }
  }

  function stopCamera() {
    running = false;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }
    if (els.video) els.video.srcObject = null;
    els.toggle?.setAttribute("aria-pressed", "false");
    setStatus("잠잠해요", false);
    setSignal("손짓과 빛을 기다리는 중이에요.");
    document.body.classList.remove("camera-seeing");
    react("camera-off", "camera");
  }

  function ensureCanvas() {
    if (canvas && ctx) return;
    canvas = document.createElement("canvas");
    canvas.width = SAMPLE_W;
    canvas.height = SAMPLE_H;
    ctx = canvas.getContext("2d", { willReadFrequently: true });
  }

  function readFrameSignals() {
    if (!els.video.videoWidth || !els.video.videoHeight) return null;
    ensureCanvas();
    ctx.drawImage(els.video, 0, 0, SAMPLE_W, SAMPLE_H);
    const data = ctx.getImageData(0, 0, SAMPLE_W, SAMPLE_H).data;
    let brightness = 0;
    let diff = 0;

    for (let i = 0; i < data.length; i += 4) {
      const lum = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      brightness += lum;
      if (lastFrame) diff += Math.abs(lum - lastFrame[i / 4]);
    }

    const count = SAMPLE_W * SAMPLE_H;
    const current = new Float32Array(count);
    for (let i = 0; i < data.length; i += 4) {
      current[i / 4] = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    }
    lastFrame = current;
    return {
      brightness: brightness / count,
      motion: lastFrame ? diff / count : 0,
    };
  }

  function classifyGesture(result) {
    const gesture = result?.gestures?.[0]?.[0];
    const landmarks = result?.landmarks?.[0] || [];
    const name = gesture?.categoryName || "";
    if (!name && !landmarks.length) return null;

    if (landmarks.length) {
      const xs = landmarks.map((point) => point.x);
      const ys = landmarks.map((point) => point.y);
      const width = Math.max(...xs) - Math.min(...xs);
      const height = Math.max(...ys) - Math.min(...ys);
      const centerX = xs.reduce((sum, value) => sum + value, 0) / xs.length;
      handTrail.push(centerX);
      handTrail = handTrail.slice(-8);

      const travel = Math.max(...handTrail) - Math.min(...handTrail);
      if (name === "Open_Palm" && travel > 0.22) return { type: "wave", label: "wave" };
      if (Math.max(width, height) > 0.54) return { type: "close-hand", label: "near" };
    }

    const map = {
      Open_Palm: { type: "palm", label: "open" },
      Victory: { type: "victory", label: "v" },
      Thumb_Up: { type: "thumb-up", label: "good" },
      ILoveYou: { type: "love", label: "love" },
      Closed_Fist: { type: "fist", label: "fist" },
      Pointing_Up: { type: "point", label: "point" },
    };
    return map[name] || (landmarks.length ? { type: "hand", label: "hand" } : null);
  }

  function handleFallbackSignals(signals) {
    if (!signals) return;
    if (signals.brightness < 48) {
      setStatus("어두워요", true);
      setSignal("빛이 줄었어요.");
      react("dark", "dark");
      return;
    }
    if (signals.brightness > 190) {
      setStatus("밝아요", true);
      setSignal("반짝이는 빛이 보여요.");
      react("bright", "bright");
      return;
    }
    if (signals.motion > 18) {
      setStatus("움직임 감지", true);
      setSignal("앞에서 무언가 움직였어요.");
      react("motion", "motion");
      return;
    }
    setStatus(mediaPipeFailed ? "빛을 보고 있어요" : "보고 있어요", false);
  }

  async function loop(timestamp) {
    if (!running) return;
    requestAnimationFrame(loop);
    if (timestamp - lastLoopAt < 180) return;
    lastLoopAt = timestamp;

    const signals = readFrameSignals();
    const activeRecognizer = await ensureGestureRecognizer();
    if (activeRecognizer && els.video.readyState >= 2) {
      try {
        const result = activeRecognizer.recognizeForVideo(els.video, performance.now());
        const gesture = classifyGesture(result);
        if (gesture) {
          setStatus("손짓을 봤어요", true);
          setSignal(signalForGesture(gesture.type));
          react(gesture.type, gesture.label);
          return;
        }
      } catch (error) {
        mediaPipeFailed = true;
      }
    }

    handleFallbackSignals(signals);
  }

  function signalForGesture(type) {
    return {
      wave: "손을 흔드는 것 같아요.",
      palm: "손바닥이 보여요.",
      victory: "브이 표시를 봤어요.",
      "thumb-up": "엄지척을 봤어요.",
      love: "사랑 표시를 봤어요.",
      fist: "주먹을 꼭 쥔 것 같아요.",
      point: "위쪽을 가리켰어요.",
      "close-hand": "손이 가까워졌어요.",
      hand: "손이 보여요.",
    }[type] || "카메라 신호가 들어왔어요.";
  }

  function start() {
    els.toggle = $("#cameraToggle");
    els.video = $("#cameraVideo");
    els.status = $("#cameraStatus");
    els.signal = $("#cameraSignal");
    els.preview = document.querySelector(".camera-preview");
    if (!els.toggle || !els.video) return;

    els.toggle.addEventListener("click", () => {
      if (running) stopCamera();
      else startCamera();
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden && running) stopCamera();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
