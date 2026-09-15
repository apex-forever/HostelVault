/* ===========================================================
   FILE: js/auth.js — Login, logout, session restore
   =========================================================== */

let currentUser = null;
let currentPage = 'dashboard';

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn = document.getElementById('loginSubmitBtn');
  btn.disabled = true;

  try {
    const { token, user } = await API.post('/auth/login', { email, password });
    API.setToken(token);
    currentUser = user;
    await showApp();
  } catch (err) {
    showToast(err.message || 'Invalid credentials. Please try again.', 'error');
  } finally {
    btn.disabled = false;
  }
}

async function handleLogout() {
  try { await API.post('/auth/logout'); } catch (e) { /* ignore */ }
  API.clearToken();
  currentUser = null;
  document.getElementById('appLayout').style.display = 'none';
  document.getElementById('loginPage').style.display = 'flex';
  destroyCharts();
}

function showLoginScreen() {
  currentUser = null;
  document.getElementById('appLayout').style.display = 'none';
  document.getElementById('loginPage').style.display = 'flex';
}

async function showApp() {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('appLayout').style.display = 'flex';
  buildSidebar();
  await updateTopbar();
  navigate('dashboard');
}

// Restore session on page load if a token is already stored
async function restoreSession() {
  const token = API.getToken();
  if (!token) return;
  try {
    currentUser = await API.get('/auth/me');
    await showApp();
  } catch (e) {
    API.clearToken();
  }
}
