/* ===========================================================
   FILE: js/pages/leaves.js — Leave applications
   =========================================================== */

let _allLeaves = [];
let _leaveStudents = [];

async function renderLeaves() {
  const isStudent = currentUser.role === 'student';
  const pc = document.getElementById('pageContent');
  pc.innerHTML = `<div class="flex flex-wrap items-center justify-between gap-3 mb-5 fade-up"><div class="search-box"><i class="fas fa-search"></i><input type="text" placeholder="Search..." id="leaveSearch" oninput="filterLeaves()"></div><button class="btn btn-green" onclick="openLeaveForm()"><i class="fas fa-plus"></i> ${isStudent ? 'Apply for Leave' : 'Record Leave'}</button></div><div class="content-card fade-up-d1"><div style="overflow-x:auto"><table class="data-table"><thead><tr><th>ID</th><th>Student</th><th>Type</th><th>From</th><th>To</th><th>Reason</th><th>Status</th>${!isStudent ? '<th>Actions</th>' : ''}</tr></thead><tbody id="leaveTableBody"></tbody></table></div></div>`;
  [_allLeaves, _leaveStudents] = await Promise.all([API.get('/leaves'), isStudent ? Promise.resolve([]) : API.get('/students')]);
  filterLeaves();
}
function filterLeaves() {
  const isStudent = currentUser.role === 'student';
  const q = (document.getElementById('leaveSearch')?.value || '').toLowerCase();
  let filtered = _allLeaves;
  if (q) filtered = filtered.filter(l => { const s = isStudent ? currentUser : _leaveStudents.find(x => x.id === l.studentId); return l.type.toLowerCase().includes(q) || (s && s.name.toLowerCase().includes(q)); });
  document.getElementById('leaveTableBody').innerHTML = filtered.map(l => {
    const s = isStudent ? currentUser : _leaveStudents.find(x => x.id === l.studentId);
    return `<tr><td>#${l.id}</td><td>${s ? s.name : '?'}</td><td>${l.type}</td><td>${formatDate(l.fromDate)}</td><td>${formatDate(l.toDate)}</td><td style="max-width:200px" class="text-sm">${l.reason}</td><td>${getStatusBadge(l.status)}</td>${!isStudent ? `<td><div class="flex gap-2">${l.status === 'pending' ? `<button class="btn btn-sm btn-green" onclick="approveLeave(${l.id},'approved')"><i class="fas fa-check"></i></button><button class="btn btn-sm btn-red" onclick="approveLeave(${l.id},'rejected')"><i class="fas fa-times"></i></button>` : ''}</div></td>` : ''}</tr>`;
  }).join('') || '<tr><td colspan="8"><div class="empty-state"><i class="fas fa-calendar-check"></i><p>No leave applications</p></div></td></tr>';
}
function openLeaveForm() {
  const isStudent = currentUser.role === 'student';
  openModal(`<div class="modal-header"><h3>Leave Application</h3><button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button></div><div class="modal-body">${!isStudent ? `<div class="form-group"><label class="form-label">Student</label><select class="form-select" id="lf_student">${_leaveStudents.filter(s => s.status === 'active').map(s => `<option value="${s.id}">${s.name}</option>`).join('')}</select></div>` : ''}<div class="form-row"><div class="form-group"><label class="form-label">Type</label><select class="form-select" id="lf_type"><option>Weekend</option><option>Medical</option><option>Personal</option><option>Emergency</option></select></div><div></div></div><div class="form-row"><div class="form-group"><label class="form-label">From</label><input class="form-input" type="date" id="lf_from"></div><div class="form-group"><label class="form-label">To</label><input class="form-input" type="date" id="lf_to"></div></div><div class="form-group"><label class="form-label">Reason</label><textarea class="form-textarea" id="lf_reason" rows="3"></textarea></div></div><div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-green" onclick="saveLeave()">Submit</button></div>`);
}
async function saveLeave() {
  const isStudent = currentUser.role === 'student';
  const data = { studentId: isStudent ? currentUser.id : parseInt(document.getElementById('lf_student').value), type: document.getElementById('lf_type').value, reason: document.getElementById('lf_reason').value, fromDate: document.getElementById('lf_from').value, toDate: document.getElementById('lf_to').value };
  if (!data.fromDate || !data.toDate) { showToast('Please select both dates', 'error'); return; }
  await API.post('/leaves', data);
  closeModal(); showToast('Application submitted'); renderLeaves();
}
async function approveLeave(id, status) {
  await API.put(`/leaves/${id}/decide`, { status });
  showToast(`Leave ${status}`); renderLeaves();
}
