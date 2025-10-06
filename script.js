const API_KEY = "AIzaSyBY2izgMhc8P7X7N1hjMzY1Pe8xVK3saLY";

// LOGIN SISTEM
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
    alert("Login gagal! Cek username/password.");
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

// YOUTUBE SEARCH
async function searchMusic() {
  const query = document.getElementById("searchInput").value;
  if (!query) return alert("Masukkan judul lagu terlebih dahulu!");

  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query)}&maxResults=1&key=${API_KEY}`);
  const data = await res.json();

  if (data.items && data.items.length > 0) {
    const videoId = data.items[0].id.videoId;
    document.getElementById("player").innerHTML = `
      <iframe src="https://www.youtube.com/embed/${videoId}" allowfullscreen></iframe>
    `;
  } else {
    document.getElementById("player").innerHTML = "<p>Tidak ditemukan hasil.</p>";
  }
}