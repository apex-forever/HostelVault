/* ===========================================================
   FILE: js/app.js — Bootstraps the app on page load
   =========================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.getElementById('menuToggle');
  const setMenuVisibility = () => { menuToggle.style.display = 'flex'; };
  setMenuVisibility();
  window.addEventListener('resize', setMenuVisibility);

  restoreSession();
});
