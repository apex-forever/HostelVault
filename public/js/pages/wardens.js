/* ===========================================================
   FILE: js/pages/wardens.js — Warden management (admin only)
   =========================================================== */

let _allWardens = [];

async function renderWardens() {
  const pc = document.getElementById('pageContent');
  const isAdmin = currentUser.role === 'admin';
  if (!isAdmin) {
    pc.innerHTML = '<div class="empty-state fade-up"><i class="fas fa-lock"></i><p>Only administrators can manage wardens</p></div>';
    return;
  }
  pc.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-3 mb-5 fade-up">
      <div class="search-box"><i class="fas fa-search"></i><input type="text" placeholder="Search wardens..." id="wardenSearch" oninput="filterWardens()"></div>
      <button class="btn btn-green" onclick="openWardenForm()"><i class="fas fa-plus"></i> Add Warden</button>
    </div>
    <div class="content-card fade-up-d1"><div style="overflow-x:auto"><table class="data-table"><thead><tr><th>S/N</th><th>Name</th><th>Email</th><th>Phone</th><th>Block</th><th>Status</th><th>Actions</th></tr></thead><tbody id="wardenTableBody"></tbody></table></div></div>`;
  const [wardens, blocks] = await Promise.all([API.get('/wardens'), API.get('/blocks')]);
  _allWardens = wardens;
  window._blocksCache = blocks;
  filterWardens();
}

function filterWardens() {
  const blocks = window._blocksCache || [];
  const q = (document.getElementById('wardenSearch')?.value || '').toLowerCase();
  const filtered = _allWardens.filter(w => w.name.toLowerCase().includes(q) || w.email.toLowerCase().includes(q));
  document.getElementById('wardenTableBody').innerHTML = filtered.map((w, i) => {
    const block = blocks.find(b => b.id === w.blockId);
    return `<tr><td>${i + 1}</td><td><div class="flex items-center gap-3"><div style="width:32px;height:32px;border-radius:50%;background:var(--primary-pale);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:var(--primary)">${w.avatar}</div><span class="font-semibold">${w.name}</span></div></td><td>${w.email}</td><td>${w.phone || 'N/A'}</td><td>${block ? block.name : 'Unassigned'}</td><td>${getStatusBadge(w.status)}</td><td><div class="flex gap-2"><button class="btn btn-sm btn-outline" title="Edit warden" onclick="openWardenForm(${w.id})"><i class="fas fa-edit"></i></button><button class="btn btn-sm btn-outline" title="Reset password" onclick="resetWardenPassword(${w.id})"><i class="fas fa-key"></i></button><button class="btn btn-sm btn-ghost" style="color:var(--danger)" title="Remove warden" onclick="deleteWarden(${w.id})"><i class="fas fa-trash"></i></button></div></td></tr>`;
  }).join('') || '<tr><td colspan="7"><div class="empty-state"><i class="fas fa-user-shield"></i><p>No wardens yet</p></div></td></tr>';
}

async function openWardenForm(id) {
  const blocks = window._blocksCache?.length ? window._blocksCache : await API.get('/blocks');
  window._blocksCache = blocks;
  const w = id ? _allWardens.find(x => x.id === id) : null;
  openModal(`
    <div class="modal-header"><h3>${w ? 'Edit' : 'Add'} Warden</h3><button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button></div>
    <div class="modal-body">
      <div class="form-row"><div class="form-group"><label class="form-label">Full Name</label><input class="form-input" id="wf_name" value="${w ? w.name : ''}"></div><div class="form-group"><label class="form-label">Email</label><input class="form-input" type="email" id="wf_email" value="${w ? w.email : ''}"></div></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Phone</label><input class="form-input" id="wf_phone" value="${w ? w.phone || '' : ''}"></div><div class="form-group"><label class="form-label">Assigned Block</label><select class="form-select" id="wf_block"><option value="">Not assigned</option>${blocks.map(b => `<option value="${b.id}"${w && w.blockId === b.id ? ' selected' : ''}>${b.name}</option>`).join('')}</select></div></div>
      <div class="form-group"><label class="form-label">Status</label><select class="form-select" id="wf_status"><option value="active"${w && w.status === 'active' ? ' selected' : ''}>Active</option><option value="inactive"${w && w.status === 'inactive' ? ' selected' : ''}>Inactive</option></select></div>
      ${!w ? '<p class="text-xs" style="color:var(--text-muted)">A temporary password will be generated for this account. You will need to share it with the warden after saving.</p>' : ''}
    </div>
    <div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-green" onclick="saveWarden(${id || 'null'})">${w ? 'Update' : 'Add'} Warden</button></div>`);
}

async function saveWarden(id) {
  const data = {
    name: document.getElementById('wf_name').value,
    email: document.getElementById('wf_email').value,
    phone: document.getElementById('wf_phone').value,
    blockId: document.getElementById('wf_block').value,
    status: document.getElementById('wf_status').value,
  };
  if (!data.name || !data.email) { showToast('Please fill all required fields', 'error'); return; }
  try {
    if (id) {
      await API.put(`/wardens/${id}`, data);
      closeModal(); showToast('Warden updated'); renderWardens();
    } else {
      const created = await API.post('/wardens', data);
      closeModal();
      showTempPasswordModal(created);
      renderWardens();
    }
  } catch (err) { showToast(err.message, 'error'); }
}

function showTempPasswordModal(warden) {
  openModal(`
    <div class="modal-header"><h3>Warden Added</h3><button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button></div>
    <div class="modal-body">
      <p class="text-sm mb-3">Share these sign-in details with <strong>${warden.name}</strong>. This password will not be shown again.</p>
      <div class="p-3 rounded-lg" style="background:var(--bg)">
        <p class="text-sm"><strong>Email:</strong> ${warden.email}</p>
        <p class="text-sm"><strong>Temporary Password:</strong> <span class="font-mono">${warden.tempPassword}</span></p>
      </div>
    </div>
    <div class="modal-footer"><button class="btn btn-green" onclick="closeModal()">Done</button></div>`);
}

function resetWardenPassword(id) {
  const warden = _allWardens.find(w => w.id === id);
  confirmAction(`Reset ${warden?.name || 'this warden'}'s password?`, async () => {
    try {
      const updated = await API.post(`/wardens/${id}/reset-password`);
      showTempPasswordModal(updated);
    } catch (err) { showToast(err.message, 'error'); }
  });
}

function deleteWarden(id) {
  confirmAction('Remove this warden?', async () => {
    await API.delete(`/wardens/${id}`);
    showToast('Warden removed'); renderWardens();
  });
}
