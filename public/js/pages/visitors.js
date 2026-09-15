/* ===========================================================
   FILE: js/pages/visitors.js — Visitor log
   =========================================================== */

let _allVisitors = [];
let _visitorStudents = [];

async function renderVisitors() {
  const pc = document.getElementById('pageContent');
  const canLog = currentUser.role !== 'student';
  pc.innerHTML = `<div class="flex flex-wrap items-center justify-between gap-3 mb-5 fade-up"><div class="search-box"><i class="fas fa-search"></i><input type="text" placeholder="Search visitors..." id="visitorSearch" oninput="filterVisitors()"></div>${canLog ? `<button class="btn btn-green" onclick="openVisitorForm()"><i class="fas fa-plus"></i> Log Visitor</button>` : ''}</div><div class="content-card fade-up-d1"><div style="overflow-x:auto"><table class="data-table"><thead><tr><th>ID</th><th>Visitor</th><th>Student</th><th>Relation</th><th>Purpose</th><th>Date</th><th>In</th><th>Out</th><th>Status</th>${canLog ? '<th>Actions</th>' : ''}</tr></thead><tbody id="visitorTableBody"></tbody></table></div></div>`;
  [_allVisitors, _visitorStudents] = await Promise.all([API.get('/visitors'), API.get('/students')]);
  filterVisitors();
}
function filterVisitors() {
  const canLog = currentUser.role !== 'student';
  const q = (document.getElementById('visitorSearch')?.value || '').toLowerCase();
  let filtered = currentUser.role === 'student' ? _allVisitors.filter(v => v.studentId === currentUser.id) : _allVisitors;
  if (q) filtered = filtered.filter(v => v.visitorName.toLowerCase().includes(q) || v.purpose.toLowerCase().includes(q));
  document.getElementById('visitorTableBody').innerHTML = filtered.map(v => {
    const s = _visitorStudents.find(x => x.id === v.studentId);
    return `<tr><td>#${v.id}</td><td class="font-semibold">${v.visitorName}</td><td>${s ? s.name : '?'}</td><td>${v.relation}</td><td>${v.purpose}</td><td>${formatDate(v.date)}</td><td>${v.timeIn}</td><td>${v.timeOut || 'N/A'}</td><td>${getStatusBadge(v.status)}</td>${canLog ? `<td>${v.status === 'visiting' ? `<button class="btn btn-sm btn-amber" onclick="checkoutVisitor(${v.id})"><i class="fas fa-sign-out-alt"></i></button>` : ''}</td>` : ''}</tr>`;
  }).join('') || '<tr><td colspan="10"><div class="empty-state"><i class="fas fa-user-friends"></i><p>No visitors logged</p></div></td></tr>';
}
function openVisitorForm() {
  openModal(`<div class="modal-header"><h3>Log Visitor</h3><button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button></div><div class="modal-body"><div class="form-group"><label class="form-label">Student</label><select class="form-select" id="vf_student">${_visitorStudents.filter(s => s.status === 'active').map(s => `<option value="${s.id}">${s.name} (${s.roomId})</option>`).join('')}</select></div><div class="form-row"><div class="form-group"><label class="form-label">Visitor Name</label><input class="form-input" id="vf_name"></div><div class="form-group"><label class="form-label">Relationship</label><select class="form-select" id="vf_rel"><option>Father</option><option>Mother</option><option>Brother</option><option>Sister</option><option>Friend</option><option>Other</option></select></div></div><div class="form-group"><label class="form-label">Purpose</label><input class="form-input" id="vf_purpose"></div></div><div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-green" onclick="saveVisitor()">Log Entry</button></div>`);
}
async function saveVisitor() {
  const data = { studentId: parseInt(document.getElementById('vf_student').value), visitorName: document.getElementById('vf_name').value, relation: document.getElementById('vf_rel').value, purpose: document.getElementById('vf_purpose').value };
  await API.post('/visitors', data);
  closeModal(); showToast('Visitor logged'); renderVisitors();
}
async function checkoutVisitor(id) {
  await API.put(`/visitors/${id}/checkout`, {});
  showToast('Checked out'); renderVisitors();
}
