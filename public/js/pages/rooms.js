/* ===========================================================
   FILE: js/pages/rooms.js — Room management
   =========================================================== */

let _allRooms = [];

async function renderRooms() {
  const blocks = await API.get('/blocks');
  const pc = document.getElementById('pageContent');
  const canEdit = currentUser.role === 'admin';
  pc.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-3 mb-5 fade-up">
      <div class="flex flex-wrap gap-3 items-center">
        <div class="search-box"><i class="fas fa-search"></i><input type="text" placeholder="Search rooms..." id="roomSearch" oninput="filterRooms()"></div>
        <select class="form-select" style="width:auto;padding:8px 12px;font-size:13px" id="roomBlockFilter" onchange="filterRooms()"><option value="">All Blocks</option>${blocks.map(b => `<option value="${b.id}">${b.name}</option>`).join('')}</select>
        <select class="form-select" style="width:auto;padding:8px 12px;font-size:13px" id="roomStatusFilter" onchange="filterRooms()"><option value="">All Status</option><option value="available">Available</option><option value="occupied">Occupied</option><option value="full">Full</option></select>
      </div>
      ${canEdit ? `<button class="btn btn-green" onclick="openRoomForm()"><i class="fas fa-plus"></i> Add Room</button>` : ''}
    </div>
    <div class="content-card fade-up-d1"><div style="overflow-x:auto"><table class="data-table"><thead><tr><th>Room</th><th>Block</th><th>Floor</th><th>Type</th><th>Cap</th><th>Occupants</th><th>Price</th><th>Status</th>${canEdit ? '<th>Actions</th>' : ''}</tr></thead><tbody id="roomTableBody"></tbody></table></div></div>`;
  _allRooms = await API.get('/rooms');
  window._blocksCache = blocks;
  filterRooms();
}

function filterRooms() {
  const blocks = window._blocksCache || [];
  const canEdit = currentUser.role === 'admin';
  const q = (document.getElementById('roomSearch')?.value || '').toLowerCase();
  const bf = document.getElementById('roomBlockFilter')?.value || '';
  const sf = document.getElementById('roomStatusFilter')?.value || '';
  let filtered = _allRooms;
  if (q) filtered = filtered.filter(r => r.id.toLowerCase().includes(q));
  if (bf) filtered = filtered.filter(r => r.blockId === bf);
  if (sf) filtered = filtered.filter(r => r.status === sf);
  document.getElementById('roomTableBody').innerHTML = filtered.map(r => {
    const block = blocks.find(b => b.id === r.blockId);
    const names = (r.occupants || []).map(o => o.name).join(', ');
    return `<tr><td class="font-semibold">${r.id}</td><td>${block ? block.name.split('|')[0].trim() : r.blockId}</td><td>${r.floor}</td><td>${r.type}</td><td>${r.capacity}</td><td style="max-width:180px;font-size:12px">${names || 'N/A'}</td><td>${formatCurrency(r.price)}</td><td>${getStatusBadge(r.status)}</td>${canEdit ? `<td><button class="btn btn-sm btn-outline" onclick="openRoomForm('${r.id}')"><i class="fas fa-edit"></i></button></td>` : ''}</tr>`;
  }).join('') || '<tr><td colspan="9"><div class="empty-state"><i class="fas fa-door-open"></i><p>No rooms found</p></div></td></tr>';
}

async function openRoomForm(id) {
  const blocks = window._blocksCache || await API.get('/blocks');
  const r = id ? _allRooms.find(x => x.id === id) : null;
  openModal(`
    <div class="modal-header"><h3>${r ? 'Edit' : 'Add'} Room</h3><button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button></div>
    <div class="modal-body">
      <div class="form-row"><div class="form-group"><label class="form-label">Block</label><select class="form-select" id="rf_block">${blocks.map(b => `<option value="${b.id}"${r && r.blockId === b.id ? ' selected' : ''}>${b.name}</option>`).join('')}</select></div><div class="form-group"><label class="form-label">Floor</label><input class="form-input" type="number" id="rf_floor" min="1" value="${r ? r.floor : 1}"></div></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Room Type</label><select class="form-select" id="rf_type"><option${r && r.type === 'Single' ? ' selected' : ''}>Single</option><option${r && r.type === 'Double' ? ' selected' : ''}>Double</option><option${r && r.type === 'Triple' ? ' selected' : ''}>Triple</option></select></div><div class="form-group"><label class="form-label">Price (GHS)</label><input class="form-input" type="number" id="rf_price" value="${r ? r.price : 5000}" max="5000" min="0"></div></div>
    </div>
    <div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-green" onclick="saveRoom('${id || ''}')">${r ? 'Update' : 'Add'}</button></div>`);
}

async function saveRoom(id) {
  const data = { blockId: document.getElementById('rf_block').value, floor: parseInt(document.getElementById('rf_floor').value), type: document.getElementById('rf_type').value, price: parseInt(document.getElementById('rf_price').value) };
  try {
    if (id) await API.put(`/rooms/${id}`, data);
    else await API.post('/rooms', data);
    closeModal(); showToast(id ? 'Room updated' : 'Room added'); renderRooms();
  } catch (err) { showToast(err.message, 'error'); }
}
