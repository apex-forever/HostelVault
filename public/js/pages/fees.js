/* ===========================================================
   FILE: js/pages/fees.js — Fee management
   =========================================================== */

let _allFees = [];
let _feeStudents = [];

async function renderFees() {
  const isStudent = currentUser.role === 'student';
  [_allFees, _feeStudents] = await Promise.all([API.get('/fees'), isStudent ? Promise.resolve([]) : API.get('/students')]);

  const totalPaid = _allFees.filter(f => f.status === 'paid').reduce((a, f) => a + f.amount, 0);
  const totalPending = _allFees.filter(f => f.status === 'pending').reduce((a, f) => a + f.amount, 0);
  const totalPartial = _allFees.filter(f => f.status === 'partial').reduce((a, f) => a + (f.amount - (f.amountPaid || 0)), 0);
  const pc = document.getElementById('pageContent');
  pc.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5 fade-up">
      <div class="stat-card"><div class="stat-icon" style="background:#D1FAE5;color:#065F46"><i class="fas fa-check-circle"></i></div><div class="stat-value">${formatCurrency(totalPaid)}</div><div class="stat-label">Collected</div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#FEE2E2;color:#991B1B"><i class="fas fa-clock"></i></div><div class="stat-value">${formatCurrency(totalPending)}</div><div class="stat-label">Pending</div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#FEF3C7;color:#92400E"><i class="fas fa-spinner"></i></div><div class="stat-value">${formatCurrency(totalPartial)}</div><div class="stat-label">Partial Outstanding</div></div>
    </div>
    <div class="flex flex-wrap items-center justify-between gap-3 mb-5 fade-up-d1"><div class="search-box"><i class="fas fa-search"></i><input type="text" placeholder="Search fees..." id="feeSearch" oninput="filterFees()"></div>${!isStudent ? `<button class="btn btn-green" onclick="openFeeForm()"><i class="fas fa-plus"></i> Record Fee</button>` : ''}</div>
    <div class="content-card fade-up-d2"><div style="overflow-x:auto"><table class="data-table"><thead><tr><th>Ref</th><th>Student</th><th>Type</th><th>Amount</th><th>Session</th><th>Status</th><th>Date Paid</th>${!isStudent ? '<th>Actions</th>' : ''}</tr></thead><tbody id="feeTableBody"></tbody></table></div></div>`;
  filterFees();
}

function filterFees() {
  const isStudent = currentUser.role === 'student';
  const q = (document.getElementById('feeSearch')?.value || '').toLowerCase();
  let filtered = _allFees;
  if (q) filtered = filtered.filter(f => { const s = _feeStudents.find(x => x.id === f.studentId); return (s && s.name.toLowerCase().includes(q)) || (f.ref || '').toLowerCase().includes(q); });
  document.getElementById('feeTableBody').innerHTML = filtered.map(f => {
    const s = isStudent ? currentUser : _feeStudents.find(x => x.id === f.studentId);
    return `<tr><td class="font-mono text-xs">${f.ref || 'N/A'}</td><td>${s ? s.name : '?'}</td><td>${f.type}</td><td class="font-semibold">${formatCurrency(f.amount)}</td><td>${f.session} (${f.semester})</td><td>${getStatusBadge(f.status)}</td><td>${formatDate(f.datePaid)}</td>${!isStudent ? `<td>${f.status === 'pending' || f.status === 'partial' ? `<button class="btn btn-sm btn-green" onclick="markFeePaid(${f.id})"><i class="fas fa-check"></i> Mark Paid</button>` : ''}</td>` : ''}</tr>`;
  }).join('') || '<tr><td colspan="8"><div class="empty-state"><i class="fas fa-money-bill-wave"></i><p>No fee records</p></div></td></tr>';
}

function openFeeForm() {
  openModal(`<div class="modal-header"><h3>Record Fee</h3><button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button></div><div class="modal-body"><div class="form-group"><label class="form-label">Student</label><select class="form-select" id="ff_student">${_feeStudents.map(s => `<option value="${s.id}">${s.name} (${s.regNo})</option>`).join('')}</select></div><div class="form-row"><div class="form-group"><label class="form-label">Fee Type</label><select class="form-select" id="ff_type"><option>Accommodation</option><option>Maintenance</option><option>Late Fee</option></select></div><div class="form-group"><label class="form-label">Amount (GHS)</label><input class="form-input" type="number" id="ff_amount" value="5000" max="5000" min="0"></div></div><div class="form-row"><div class="form-group"><label class="form-label">Session</label><input class="form-input" id="ff_session" value="2026/2027"></div><div class="form-group"><label class="form-label">Semester</label><select class="form-select" id="ff_sem"><option>First</option><option>Second</option></select></div></div></div><div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-green" onclick="saveFee()">Record</button></div>`);
}
async function saveFee() {
  const data = { studentId: parseInt(document.getElementById('ff_student').value), type: document.getElementById('ff_type').value, amount: parseInt(document.getElementById('ff_amount').value), session: document.getElementById('ff_session').value, semester: document.getElementById('ff_sem').value };
  await API.post('/fees', data);
  closeModal(); showToast('Fee recorded'); renderFees();
}
async function markFeePaid(id) {
  await API.put(`/fees/${id}/pay`, {});
  showToast('Fee marked as paid'); renderFees();
}
