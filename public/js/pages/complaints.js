/* ===========================================================
   FILE: js/pages/complaints.js — Complaint management
   =========================================================== */

let _allComplaints = [];
let _complaintStudents = [];

async function renderComplaints() {
  const isStudent = currentUser.role === 'student';
  const pc = document.getElementById('pageContent');
  pc.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-3 mb-5 fade-up">
      <div class="flex flex-wrap gap-3 items-center"><div class="search-box"><i class="fas fa-search"></i><input type="text" placeholder="Search..." id="compSearch" oninput="filterComplaints()"></div><select class="form-select" style="width:auto;padding:8px 12px;font-size:13px" id="compStatusFilter" onchange="filterComplaints()"><option value="">All</option><option value="pending">Pending</option><option value="in-progress">In Progress</option><option value="resolved">Resolved</option></select></div>
      <button class="btn btn-green" onclick="openComplaintForm()"><i class="fas fa-plus"></i> ${isStudent ? 'Submit' : 'Add'} Complaint</button>
    </div>
    <div class="content-card fade-up-d1"><div style="overflow-x:auto"><table class="data-table"><thead><tr><th>ID</th><th>Student</th><th>Title</th><th>Category</th><th>Priority</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead><tbody id="compTableBody"></tbody></table></div></div>`;
  [_allComplaints, _complaintStudents] = await Promise.all([API.get('/complaints'), isStudent ? Promise.resolve([]) : API.get('/students')]);
  filterComplaints();
}

function filterComplaints() {
  const isStudent = currentUser.role === 'student';
  const q = (document.getElementById('compSearch')?.value || '').toLowerCase();
  const sf = document.getElementById('compStatusFilter')?.value || '';
  let filtered = _allComplaints;
  if (q) filtered = filtered.filter(c => c.title.toLowerCase().includes(q) || (c.category || '').toLowerCase().includes(q));
  if (sf) filtered = filtered.filter(c => c.status === sf);
  document.getElementById('compTableBody').innerHTML = filtered.map(c => {
    const s = isStudent ? currentUser : _complaintStudents.find(x => x.id === c.studentId);
    return `<tr><td>#${c.id}</td><td>${s ? s.name : '?'}</td><td class="font-semibold">${c.title}</td><td>${c.category}</td><td>${getPriorityBadge(c.priority)}</td><td>${formatDate(c.date)}</td><td>${getStatusBadge(c.status)}</td><td><div class="flex gap-2"><button class="btn btn-sm btn-outline" onclick="viewComplaint(${c.id})"><i class="fas fa-eye"></i></button>${!isStudent && c.status !== 'resolved' ? `<button class="btn btn-sm btn-green" onclick="respondComplaint(${c.id})"><i class="fas fa-reply"></i></button>` : ''}</div></td></tr>`;
  }).join('') || '<tr><td colspan="8"><div class="empty-state"><i class="fas fa-check-circle"></i><p>No complaints</p></div></td></tr>';
}

function openComplaintForm() {
  openModal(`<div class="modal-header"><h3>Submit Complaint</h3><button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button></div><div class="modal-body"><div class="form-group"><label class="form-label">Title</label><input class="form-input" id="cf_title"></div><div class="form-row"><div class="form-group"><label class="form-label">Category</label><select class="form-select" id="cf_cat"><option>Maintenance</option><option>Plumbing</option><option>Electrical</option><option>Sanitation</option><option>Behavior</option><option>Security</option><option>Other</option></select></div><div class="form-group"><label class="form-label">Priority</label><select class="form-select" id="cf_pri"><option value="low">Low</option><option value="medium" selected>Medium</option><option value="high">High</option></select></div></div><div class="form-group"><label class="form-label">Description</label><textarea class="form-textarea" id="cf_desc" rows="4"></textarea></div></div><div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-green" onclick="saveComplaint()">Submit</button></div>`);
}
async function saveComplaint() {
  const data = { title: document.getElementById('cf_title').value, category: document.getElementById('cf_cat').value, priority: document.getElementById('cf_pri').value, description: document.getElementById('cf_desc').value };
  if (!data.title) { showToast('Please enter a title', 'error'); return; }
  await API.post('/complaints', data);
  closeModal(); showToast('Complaint submitted'); renderComplaints();
}
function viewComplaint(id) {
  const c = _allComplaints.find(x => x.id === id);
  const s = currentUser.role === 'student' ? currentUser : _complaintStudents.find(x => x.id === c.studentId);
  openModal(`<div class="modal-header"><h3>Complaint #${c.id}</h3><button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button></div><div class="modal-body"><div class="flex flex-wrap gap-2 mb-3">${getStatusBadge(c.status)} ${getPriorityBadge(c.priority)} <span class="badge badge-neutral">${c.category}</span></div><h4 class="font-semibold mb-2">${c.title}</h4><p class="text-sm mb-3" style="color:var(--text-muted)">${c.description}</p><div class="text-sm mb-3"><strong>Student:</strong> ${s ? s.name : '?'} | <strong>Date:</strong> ${formatDate(c.date)}</div>${c.response ? `<div class="p-3 rounded-lg" style="background:var(--bg)"><strong>Response:</strong><p class="text-sm mt-1">${c.response}</p></div>` : '<p class="text-sm" style="color:var(--text-muted)">No response yet.</p>'}</div><div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">Close</button></div>`);
}
function respondComplaint(id) {
  const c = _allComplaints.find(x => x.id === id);
  openModal(`<div class="modal-header"><h3>Respond to #${id}</h3><button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button></div><div class="modal-body"><p class="text-sm mb-3 font-semibold">${c.title}</p><div class="form-group"><label class="form-label">Status</label><select class="form-select" id="cr_status"><option value="in-progress"${c.status === 'in-progress' ? ' selected' : ''}>In Progress</option><option value="resolved"${c.status === 'resolved' ? ' selected' : ''}>Resolved</option></select></div><div class="form-group"><label class="form-label">Response</label><textarea class="form-textarea" id="cr_response" rows="3">${c.response || ''}</textarea></div></div><div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-green" onclick="saveComplaintResponse(${id})">Submit</button></div>`);
}
async function saveComplaintResponse(id) {
  const status = document.getElementById('cr_status').value;
  const response = document.getElementById('cr_response').value;
  await API.put(`/complaints/${id}`, { status, response });
  closeModal(); showToast('Response saved'); renderComplaints();
}
