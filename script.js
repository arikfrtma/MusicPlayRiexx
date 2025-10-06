const API_KEY = "AIzaSyBY2izgMhc8P7X7N1hjMzY1Pe8xVK3saLY";

// ====== SISTEM LOGIN ======
function showLogin() {
  document.getElementById("loginForm").classList.remove("hidden");
  document.getElementById("registerForm").classList.add("hidden");
}

function showRegister() {
  document.getElementById("registerForm").classList.remove("hidden");
  document.getElementById("loginForm").classList.add("hidden");
}

function register() {
  const user = document.getElementById("regUser").value;
  const pass = document.getElementById("regPass").value;
  if (user && pass) {
    localStorage.setItem(user, pass);
    alert("Pendaftaran berhasil! Silakan login.");
    showLogin();
  } else {
    alert("Isi semua kolom terlebih dahulu!");
  }
}

function login() {
  const user = document.getElementById("loginUser").value;
  const pass = document.getElementById("loginPass").value;

  if (user === "RiexDev" && pass === "123") {
    alert("Login Developer berhasil!");
    loadApp();
  } else if (localStorage.getItem(user) === pass) {
    alert("Login berhasil!");
    loadApp();
  } else {
    alert("Login gagal! Username atau password salah.");
  }
}

function loadApp() {
  document.getElementById("auth").classList.add("hidden");
  document.getElementById("loginForm").classList.add("hidden");
  document.getElementById("registerForm").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
}

function logout() {
  location.reload();
}

// ====== FITUR PENCARIAN & PEMUTAR MUSIK ======
async function searchMusic() {
  const query = document.getElementById("searchInput").value;
  if (!query) return alert("Masukkan judul lagu terlebih dahulu!");

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(
      query
    )}&maxResults=5&key=${API_KEY}`
  );
  const data = await res.json();

  const results = document.getElementById("results");
  results.innerHTML = "";

  if (data.items && data.items.length > 0) {
    data.items.forEach((item) => {
      const title = item.snippet.title;
      const videoId = item.id.videoId;

      const div = document.createElement("div");
      div.classList.add("song");
      div.textContent = title;
      div.onclick = () => playMusic(videoId);
      results.appendChild(div);
    });
  } else {
    results.innerHTML = "<p>Tidak ditemukan hasil.</p>";
  }
}

function playMusic(videoId) {
  const audio = document.getElementById("audioPlayer");
  // NOTE: YouTube tidak menyediakan direct audio tanpa embed.
  // Kita pakai embed agar tetap patuh kebijakan YouTube.
  document.getElementById("player").innerHTML = `
    <iframe width="100%" height="250" src="https://www.youtube.com/embed/${videoId}?autoplay=1" allow="autoplay"></iframe>
  `;
}

// ====== FITUR RATING ======
function rate(stars) {
  const allStars = document.querySelectorAll("#stars span");
  allStars.forEach((s, i) => {
    s.classList.toggle("active", i < stars);
  });
  document.getElementById("ratingText").innerText =
    "Terima kasih! Kamu memberi " + stars + " bintang ⭐";
  localStorage.setItem("rating", stars);
}

// Muat rating terakhir
window.onload = () => {
  const saved = localStorage.getItem("rating");
  if (saved) rate(parseInt(saved));
};