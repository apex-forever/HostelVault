/* ===========================================================
   FILE: js/pages/students.js — Student management
   =========================================================== */

let _allStudents = [];

async function renderStudents() {
  const pc = document.getElementById('pageContent');
  const canEdit = currentUser.role !== 'student';
  pc.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-3 mb-5 fade-up">
      <div class="search-box"><i class="fas fa-search"></i><input type="text" placeholder="Search students..." id="studentSearch" oninput="filterStudents()"></div>
      ${canEdit ? `<button class="btn btn-green" onclick="openStudentForm()"><i class="fas fa-plus"></i> Add Student</button>` : ''}
    </div>
    <div class="content-card fade-up-d1"><div style="overflow-x:auto"><table class="data-table"><thead><tr><th>S/N</th><th>Name</th><th>Reg No</th><th>Department</th><th>Room</th><th>Phone</th><th>Status</th>${canEdit ? '<th>Actions</th>' : ''}</tr></thead><tbody id="studentTableBody"></tbody></table></div></div>`;
  _allStudents = await API.get('/students');
  filterStudents();
}

function filterStudents() {
  const canEdit = currentUser.role !== 'student';
  const q = (document.getElementById('studentSearch')?.value || '').toLowerCase();
  const filtered = _allStudents.filter(s => s.name.toLowerCase().includes(q) || (s.regNo || '').toLowerCase().includes(q) || (s.department || '').toLowerCase().includes(q));
  document.getElementById('studentTableBody').innerHTML = filtered.map((s, i) => `
    <tr><td>${i + 1}</td><td><div class="flex items-center gap-3"><div style="width:32px;height:32px;border-radius:50%;background:var(--primary-pale);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:var(--primary)">${s.avatar}</div><span class="font-semibold">${s.name}</span></div></td><td>${s.regNo || 'N/A'}</td><td>${s.department || 'N/A'}</td><td>${s.roomId || 'N/A'}</td><td>${s.phone || 'N/A'}</td><td>${getStatusBadge(s.status)}</td>${canEdit ? `<td><div class="flex gap-2"><button class="btn btn-sm btn-outline" onclick="openStudentForm(${s.id})"><i class="fas fa-edit"></i></button><button class="btn btn-sm btn-ghost" style="color:var(--danger)" onclick="deleteStudent(${s.id})"><i class="fas fa-trash"></i></button></div></td>` : ''}</tr>
  `).join('') || '<tr><td colspan="8"><div class="empty-state"><i class="fas fa-user-graduate"></i><p>No students found</p></div></td></tr>';
}

async function openStudentForm(id) {
  const [blocks, rooms] = await Promise.all([API.get('/blocks'), API.get('/rooms')]);
  const s = id ? _allStudents.find(x => x.id === id) : null;
  const availRooms = rooms.filter(r => r.status !== 'full' || (s && s.roomId === r.id));
  openModal(`
    <div class="modal-header"><h3>${s ? 'Edit' : 'Add'} Student</h3><button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button></div>
    <div class="modal-body">
      <div class="form-row"><div class="form-group"><label class="form-label">Full Name</label><input class="form-input" id="sf_name" value="${s ? s.name : ''}"></div><div class="form-group"><label class="form-label">Reg Number</label><input class="form-input" id="sf_regNo" value="${s ? s.regNo || '' : ''}"></div></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Email</label><input class="form-input" type="email" id="sf_email" value="${s ? s.email : ''}"></div><div class="form-group"><label class="form-label">Phone</label><input class="form-input" id="sf_phone" value="${s ? s.phone || '' : ''}"></div></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Department</label><input class="form-input" id="sf_dept" value="${s ? s.department || '' : ''}"></div><div class="form-group"><label class="form-label">Level</label><select class="form-select" id="sf_level">${['100', '200', '300', '400', '500'].map(l => `<option${s && s.level === l ? ' selected' : ''}>${l}</option>`).join('')}</select></div></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Block</label><select class="form-select" id="sf_block">${blocks.map(b => `<option value="${b.id}"${s && s.blockId === b.id ? ' selected' : ''}>${b.name}</option>`).join('')}</select></div><div class="form-group"><label class="form-label">Room</label><select class="form-select" id="sf_room">${availRooms.map(r => `<option value="${r.id}"${s && s.roomId === r.id ? ' selected' : ''}>${r.id} (${r.type})</option>`).join('')}</select></div></div>
      <div class="form-group"><label class="form-label">Status</label><select class="form-select" id="sf_status"><option value="active"${s && s.status === 'active' ? ' selected' : ''}>Active</option><option value="inactive"${s && s.status === 'inactive' ? ' selected' : ''}>Inactive</option></select></div>
    </div>
    <div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-green" onclick="saveStudent(${id || 'null'})">${s ? 'Update' : 'Add'} Student</button></div>`);
}

async function saveStudent(id) {
  const data = {
    name: document.getElementById('sf_name').value, regNo: document.getElementById('sf_regNo').value,
    email: document.getElementById('sf_email').value, phone: document.getElementById('sf_phone').value,
    department: document.getElementById('sf_dept').value, level: document.getElementById('sf_level').value,
    blockId: document.getElementById('sf_block').value, roomId: document.getElementById('sf_room').value,
    status: document.getElementById('sf_status').value,
  };
  if (!data.name || !data.regNo || !data.email) { showToast('Please fill all required fields', 'error'); return; }
  try {
    if (id) await API.put(`/students/${id}`, data);
    else await API.post('/students', data);
    closeModal(); showToast(id ? 'Student updated' : 'Student added'); renderStudents();
  } catch (err) { showToast(err.message, 'error'); }
}

function deleteStudent(id) {
  confirmAction('Remove this student?', async () => {
    await API.delete(`/students/${id}`);
    showToast('Student removed'); renderStudents();
  });
}
