/* Global config - GANTI sebelum deploy */
const API_KEY = "AIzaSyBY2izgMhc8P7X7N1hjMzY1Pe8xVK3saLY"; // <-- isi YouTube Data API v3 key jika mau search
const FIREBASE_CONFIG = null; // <-- contoh: { apiKey:"...", authDomain:"...", projectId:"...", appId:"..." }

/* ----------------------
   Authentication helpers
   ---------------------- */
function getCurrentUser(){
  try{
    return JSON.parse(localStorage.getItem('riexx_user') || 'null');
  }catch(e){ return null; }
}
function setCurrentUser(u){
  localStorage.setItem('riexx_user', JSON.stringify(u));
}
function clearCurrentUser(){
  localStorage.removeItem('riexx_user');
}

/* Developer credential (client-side) */
const DEV_USERNAME = "RiexDev";
const DEV_PASSWORD = "123";

/* ---------- Login page init ---------- */
function initLoginPage(){
  // elements
  const loginForm = document.getElementById('loginForm');
  const btnGoogle = document.getElementById('btnGoogle');
  const btnDev = document.getElementById('btnDev');
  const showRegister = document.getElementById('showRegister');
  const registerBox = document.getElementById('registerBox');
  const btnRegister = document.getElementById('btnRegister');
  const btnCancelReg = document.getElementById('btnCancelReg');
  const btnDevLogin = document.getElementById('btnDev');

  // if already logged in, go to app
  if(getCurrentUser()){
    window.location.href = 'index.html';
    return;
  }

  // login submit
  loginForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const user = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value;
    const remember = document.getElementById('remember').checked;
    if(!user || !pass) { showMessage('Isi username & password'); return; }

    // Developer check first
    if(user === DEV_USERNAME && pass === DEV_PASSWORD){
      setCurrentUser({type:'dev', name:'Developer', username:DEV_USERNAME});
      if(!remember) sessionStorage.setItem('riexx_session','1');
      window.location.href = 'index.html';
      return;
    }

    // check registered users in localStorage
    const users = JSON.parse(localStorage.getItem('riexx_users') || '[]');
    const found = users.find(u => (u.username === user || u.email === user) && u.password === pass);
    if(found){
      setCurrentUser({type:'user', name: found.username, email: found.email});
      if(!remember) sessionStorage.setItem('riexx_session','1');
      window.location.href = 'index.html';
      return;
    }
    showMessage('Akun tidak ditemukan atau password salah.');
  });

  // show/hide register
  showRegister.addEventListener('click', (ev)=>{
    ev.preventDefault();
    registerBox.style.display = registerBox.style.display === 'block' ? 'none' : 'block';
  });

  btnRegister.addEventListener('click', ()=>{
    const email = document.getElementById('regEmail').value.trim();
    const uname = document.getElementById('regUser').value.trim();
    const pass = document.getElementById('regPass').value;
    if(!email||!uname||!pass){ showMessage('Lengkapi semua field pendaftaran'); return; }
    const users = JSON.parse(localStorage.getItem('riexx_users') || '[]');
    if(users.find(u=>u.email===email || u.username===uname)){ showMessage('Email atau username sudah terdaftar'); return; }
    users.push({email, username:uname, password:pass});
    localStorage.setItem('riexx_users', JSON.stringify(users));
    showMessage('Pendaftaran berhasil. Silakan login.');
    registerBox.style.display = 'none';
  });

  btnCancelReg.addEventListener('click', ()=>{ registerBox.style.display='none'; });

  // Developer quick button: open dev login modal (same as clicking showRegister and toggling dev)
  btnDev.addEventListener('click', ()=>{
    // prefills
    document.getElementById('loginUser').value = DEV_USERNAME;
    document.getElementById('loginPass').value = DEV_PASSWORD;
    showMessage('Tekan Login untuk masuk sebagai Developer');
  });

  // Google sign-in (only if FIREBASE_CONFIG set)
  btnGoogle.addEventListener('click', async ()=>{
    if(!FIREBASE_CONFIG){ alert('Google Sign-In belum diset. Isi FIREBASE_CONFIG di script.js untuk mengaktifkan.'); return; }
    try{
      await loadFirebase();
      const provider = new firebase.auth.GoogleAuthProvider();
      const result = await auth.signInWithPopup(provider);
      const user = result.user;
      setCurrentUser({type:'google', name:user.displayName, email:user.email});
      window.location.href = 'index.html';
    }catch(e){
      console.error(e); alert('Login Google gagal: '+(e.message||e));
    }
  });

  function showMessage(txt){ const el = document.getElementById('message'); el.textContent = txt; setTimeout(()=>el.textContent='',5000); }
}

/* ---------- App init (index.html) ---------- */
function initApp(){
  // require login
  const user = getCurrentUser();
  if(!user){
    window.location.href = 'login.html';
    return;
  }
  // personalize UI
  document.getElementById('userLabel').textContent = user.name || (user.email || 'User');

  // Logout
  document.getElementById('btnLogout').addEventListener('click', ()=>{
    clearCurrentUser();
    sessionStorage.removeItem('riexx_session');
    // if firebase: signOut
    try{ if(window.auth) auth.signOut(); }catch(e){}
    window.location.href = 'login.html';
  });

  // init playlist, chat, search etc.
  renderPlaylist();
  attachChat();
}

/* ---------- Playlist & Player ---------- */
let playlist = JSON.parse(localStorage.getItem('riexx_playlist_vps') || '[]');
let currentIndex = 0;
const playerEl = () => document.getElementById('player');

function renderPlaylist(){
  const el = document.getElementById('playlistList');
  el.innerHTML = '';
  if(!playlist.length){ el.innerHTML = '<div class="small muted">Playlist kosong</div>'; return; }
  playlist.forEach((v,i)=>{
    const row = document.createElement('div');
    row.style.display='flex'; row.style.justifyContent='space-between'; row.style.alignItems='center';
    row.style.padding='8px'; row.style.marginBottom='8px'; row.style.borderRadius='8px'; row.style.background='#070707';
    row.innerHTML = `<div style="flex:1;color:var(--accent2);font-weight:700;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${v.title}</div>
      <div style="display:flex;gap:6px">
        <button class="btn-primary" onclick="playIndex(${i})">Putar</button>
        <button class="btn-ghost" onclick="removeFromPlaylist(${i})">Hapus</button>
      </div>`;
    el.appendChild(row);
  });
}

function playIndex(i){
  if(i<0||i>=playlist.length) return;
  currentIndex = i;
  const v = playlist[i];
  if(v.type === 'yt'){ playerEl().src = `https://www.youtube.com/embed/${v.id}?autoplay=1`; document.getElementById('nowTitle').textContent = v.title; document.getElementById('nowMeta').textContent = 'YouTube'; }
  else if(v.type === 'tt'){ playerEl().src = v.embed || v.url || ''; document.getElementById('nowTitle').textContent = v.title; document.getElementById('nowMeta').textContent = 'TikTok'; }
  else if(v.type === 'ig'){ window.open(v.url,'_blank'); }
}

function prevTrack(){ if(!playlist.length) return; playIndex((currentIndex-1+playlist.length)%playlist.length); }
function nextTrack(){ if(!playlist.length) return; playIndex((currentIndex+1)%playlist.length); }
function removeFromPlaylist(i){ playlist.splice(i,1); saveLocal(); renderPlaylist(); }
function clearPlaylist(){ if(!confirm('Hapus semua playlist?')) return; playlist=[]; saveLocal(); renderPlaylist(); }
function saveLocal(){ localStorage.setItem('riexx_playlist_vps', JSON.stringify(playlist)); }

/* Quick add function */
function quickAdd(){
  const url = (document.getElementById('quickUrl')||{}).value || '';
  if(!url) return;
  document.getElementById('quickMsg').textContent = '';
  const yt = extractYouTubeId(url);
  if(yt){ playlist.push({type:'yt', id:yt, title:`YouTube • ${yt}`}); saveLocal(); renderPlaylist(); document.getElementById('quickMsg').textContent='Ditambahkan (YouTube)'; document.getElementById('quickUrl').value=''; if(playlist.length===1) playIndex(0); return; }
  const tt = extractTikTokId(url);
  if(tt){ playlist.push({type:'tt', id:tt, title:`TikTok • ${tt}`, embed:`https://www.tiktok.com/embed/${tt}`, url}); saveLocal(); renderPlaylist(); document.getElementById('quickMsg').textContent='Ditambahkan (TikTok)'; document.getElementById('quickUrl').value=''; return; }
  const ig = extractInstagramUrl(url);
  if(ig){ playlist.push({type:'ig', url, title:'Instagram'}); saveLocal(); renderPlaylist(); document.getElementById('quickMsg').textContent='Ditambahkan (Instagram)'; document.getElementById('quickUrl').value=''; return; }
  document.getElementById('quickMsg').textContent='URL tidak dikenali.';
}

/* extract helpers */
function extractYouTubeId(url){ const reg = /(?:youtube\\.com.*(?:\\?|&)v=|youtu\\.be\\/|youtube\\.com\\/shorts\\/)([a-zA-Z0-9_-]{11})/; const m=url.match(reg); return m?m[1]:null; }
function extractTikTokId(url){ try{ const u=new URL(url); const p=u.pathname.split('/'); const idx=p.indexOf('video'); if(idx>=0 && p[idx+1]) return p[idx+1]; return null;}catch(e){return null;} }
function extractInstagramUrl(url){ try{ const u=new URL(url); if(u.hostname.includes('instagram.com')) return url; return null;}catch(e){return null;} }

/* ---------- YouTube search (needs API_KEY) ---------- */
async function searchYouTube(){
  const q = (document.getElementById('searchQuery')||{}).value || '';
  const out = document.getElementById('searchResults');
  out.innerHTML = '<div class="small muted">Mencari...</div>';
  if(!q){ out.innerHTML = '<div class="small muted">Masukkan kata kunci</div>'; return; }
  if(!API_KEY || API_KEY === 'AIzaSyBY2izgMhc8P7X7N1hjMzY1Pe8xVK3saLY'){ out.innerHTML = '<div class="small muted">API key belum di-set di script.js</div>'; return; }
  try{
    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=8&q=${encodeURIComponent(q)}&key=${API_KEY}`);
    const data = await res.json();
    if(data.error){ out.innerHTML = `<div class="small muted">Error: ${data.error.message}</div>`; return; }
    out.innerHTML = '';
    (data.items||[]).forEach(item=>{
      const id = item.id.videoId;
      const title = item.snippet.title;
      const thumb = item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default.url;
      const div = document.createElement('div'); div.className='result';
      div.innerHTML = `<img src="${thumb}" alt="thumb"><div style="flex:1"><div style="color:var(--accent2);font-weight:700">${title}</div><div class="small muted">${item.snippet.channelTitle}</div></div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <button class="btn-primary" onclick="playDirect('${id}','${escapeQuotes(title)}')">Putar</button>
          <button class="btn-ghost" onclick="addYTToPlaylist('${id}','${escapeQuotes(title)}')">+ Playlist</button>
        </div>`;
      out.appendChild(div);
    });
  }catch(e){ out.innerHTML = '<div class="small muted">Terjadi kesalahan saat mencari.</div>'; console.error(e); }
}
function playDirect(id,title){ document.getElementById('nowTitle').textContent = title; playerEl().src = `https://www.youtube.com/embed/${id}?autoplay=1`; }
function addYTToPlaylist(id,title){ playlist.push({type:'yt', id, title}); saveLocal(); renderPlaylist(); }

/* ---------- Chat (rule-based) ---------- */
function attachChat(){
  const box = document.getElementById('chatBox');
  box.innerHTML = '<div class="small muted">Selamat datang! Tanyakan tentang fitur situs.</div>';
}
function sendChat(){
  const txt = (document.getElementById('chatInput')||{}).value || '';
  if(!txt) return;
  const box = document.getElementById('chatBox');
  const u = document.createElement('div'); u.className='small'; u.style.color='#0ff'; u.textContent = 'Kamu: ' + txt; box.appendChild(u);
  setTimeout(()=> {
    const q = txt.toLowerCase();
    let reply = 'Maaf, saya belum mengerti. Coba tanya terkait pemutaran atau fitur.';
    const buildKeywords=['membuat web','buat web','cara buat website','kode website','bikin web'];
    if(buildKeywords.some(k=>q.includes(k))) reply = 'Maaf, saya tidak bisa membantu membuat website. Hubungi developer.';
    else if(q.includes('tiktok')) reply = 'Untuk TikTok gunakan menu TikTok/IG lalu paste link untuk preview.';
    else if(q.includes('youtube')||q.includes('yt')) reply = 'Gunakan menu Search untuk mencari YouTube (butuh API key).';
    const b = document.createElement('div'); b.className='small'; b.style.color='#9aa0a6'; b.textContent = 'Riexx CS: ' + reply; box.appendChild(b);
    box.scrollTop = box.scrollHeight;
  }, 500 + Math.random()*600);
}

/* ---------- Firebase lazy loader for Google Sign-In if needed ---------- */
async function loadFirebase(){
  if(window.firebaseLoaded) return;
  await loadScript('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
  await loadScript('https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js');
  window.firebaseLoaded = true;
  firebase.initializeApp(FIREBASE_CONFIG);
  window.auth = firebase.auth();
  auth.onAuthStateChanged(user=>{
    if(user) setCurrentUser({type:'google', name:user.displayName, email:user.email});
  });
}
function loadScript(src){ return new Promise((res,rej)=>{ const s=document.createElement('script'); s.src=src; s.onload=res; s.onerror=rej; document.head.appendChild(s); }); }

/* ---------- Helpers ---------- */
function escapeHtml(s){ return (s+'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function escapeQuotes(s){ return (s||'').replace(/'/g,"\\'").replace(/\"/g,'\\"'); }

/* ---------- Init for index if loaded directly ---------- */
function initApp(){
  // called in index.html
  try{
    // if user not logged -> redirect
    const cur = getCurrentUser();
    if(!cur){ window.location.href = 'login.html'; return; }
    // set username label
    document.getElementById('userLabel').textContent = cur.name || (cur.email || 'User');
    // attach listeners
    document.getElementById('btnLogout').addEventListener('click', ()=>{
      clearCurrentUser();
      try{ if(window.auth) auth.signOut(); }catch(e){}
      window.location.href = 'login.html';
    });
    document.getElementById('searchQuery').addEventListener('keydown', (e)=>{ if(e.key==='Enter') searchYouTube(); });
    document.getElementById('chatInput').addEventListener('keydown', (e)=>{ if(e.key==='Enter') sendChat(); });
    renderPlaylist(); attachChat();
  }catch(e){ console.error(e); }
}