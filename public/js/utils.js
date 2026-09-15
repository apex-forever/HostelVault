/* ===========================================================
   FILE: js/utils.js — Formatting, toasts, modals, badges
   =========================================================== */

function formatCurrency(n) { return 'GHS ' + Number(n || 0).toLocaleString(); }

function formatDate(d) {
  if (!d) return 'N/A';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function showToast(message, type = 'success') {
  const c = document.getElementById('toastContainer');
  const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<i class="fas ${icons[type]}"></i> ${message}`;
  c.appendChild(t);
  setTimeout(() => { t.style.animation = 'slideOut 0.3s ease forwards'; setTimeout(() => t.remove(), 300); }, 3000);
}

function openModal(html) {
  document.getElementById('modalBox').innerHTML = html;
  document.getElementById('modalOverlay').classList.add('open');
}
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

function confirmAction(msg, cb) {
  openModal(`
    <div class="modal-header"><h3>Confirm Action</h3><button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button></div>
    <div class="modal-body"><p style="font-size:15px">${msg}</p></div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-red" id="confirmBtn">Confirm</button>
    </div>
  `);
  document.getElementById('confirmBtn').onclick = () => { closeModal(); cb(); };
}

function getStatusBadge(status) {
  const map = {
    available: ['Available', 'badge-success'], full: ['Full', 'badge-danger'], occupied: ['Occupied', 'badge-warning'],
    pending: ['Pending', 'badge-warning'], 'in-progress': ['In Progress', 'badge-info'], resolved: ['Resolved', 'badge-success'],
    paid: ['Paid', 'badge-success'], partial: ['Partial', 'badge-warning'], approved: ['Approved', 'badge-success'],
    rejected: ['Rejected', 'badge-danger'], completed: ['Completed', 'badge-success'], visiting: ['Visiting', 'badge-info'],
    active: ['Active', 'badge-success'], inactive: ['Inactive', 'badge-danger'], present: ['Present', 'badge-success'],
    absent: ['Absent', 'badge-danger'], late: ['Late', 'badge-warning'],
  };
  const [label, cls] = map[status] || [status, 'badge-neutral'];
  return `<span class="badge ${cls}">${label}</span>`;
}

function getPriorityBadge(p) {
  const map = { high: ['badge-danger', 'High'], medium: ['badge-warning', 'Medium'], low: ['badge-info', 'Low'] };
  const [cls, label] = map[p] || ['badge-neutral', p];
  return `<span class="badge ${cls}">${label}</span>`;
}
