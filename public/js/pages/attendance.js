/* ===========================================================
   FILE: js/pages/attendance.js — Attendance
   =========================================================== */

let _attStudents = [];

async function renderAttendance() {
  const today = new Date().toISOString().split('T')[0];
  const pc = document.getElementById('pageContent');
  pc.innerHTML = `<div class="flex flex-wrap items-center justify-between gap-3 mb-5 fade-up"><div class="flex gap-3 items-center"><label class="text-sm font-semibold">Date:</label><input type="date" class="form-input" style="width:auto" id="attDate" value="${today}" onchange="filterAttendance()"></div><button class="btn btn-green" onclick="markAttendanceBulk()"><i class="fas fa-clipboard-check"></i> Mark Attendance</button></div><div class="content-card fade-up-d1"><div style="overflow-x:auto"><table class="data-table"><thead><tr><th>S/N</th><th>Student</th><th>Room</th><th>Status</th><th>Marked By</th></tr></thead><tbody id="attTableBody"></tbody></table></div></div>`;
  _attStudents = await API.get('/students');
  filterAttendance();
}
async function filterAttendance() {
  const date = document.getElementById('attDate').value;
  const dayAtt = await API.get(`/attendance?date=${date}`);
  const active = _attStudents.filter(s => s.status === 'active');
  document.getElementById('attTableBody').innerHTML = active.map((s, i) => { const a = dayAtt.find(x => x.studentId === s.id); return `<tr><td>${i + 1}</td><td class="font-semibold">${s.name}</td><td>${s.roomId || '—'}</td><td>${a ? getStatusBadge(a.status) : '<span class="badge badge-neutral">Not Marked</span>'}</td><td>${a ? a.markedBy : '—'}</td></tr>`; }).join('') || '<tr><td colspan="5"><div class="empty-state"><i class="fas fa-clipboard-check"></i><p>No active students</p></div></td></tr>';
}
function markAttendanceBulk() {
  const active = _attStudents.filter(s => s.status === 'active');
  const date = document.getElementById('attDate').value;
  openModal(`<div class="modal-header"><h3>Attendance — ${formatDate(date)}</h3><button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button></div><div class="modal-body" style="max-height:400px;overflow-y:auto">${active.map(s => `<div class="flex items-center justify-between py-2 border-b" style="border-color:var(--border)"><span class="font-semibold text-sm">${s.name}</span><div class="flex gap-2"><label class="flex items-center gap-1 cursor-pointer"><input type="radio" name="att_${s.id}" value="present" checked><span class="text-sm">Present</span></label><label class="flex items-center gap-1 cursor-pointer"><input type="radio" name="att_${s.id}" value="absent"><span class="text-sm">Absent</span></label><label class="flex items-center gap-1 cursor-pointer"><input type="radio" name="att_${s.id}" value="late"><span class="text-sm">Late</span></label></div></div>`).join('')}</div><div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-green" onclick="saveAttendanceBulk('${date}')">Save</button></div>`);
}
async function saveAttendanceBulk(date) {
  const active = _attStudents.filter(s => s.status === 'active');
  const records = active.map(s => {
    const val = document.querySelector(`input[name="att_${s.id}"]:checked`);
    return val ? { studentId: s.id, status: val.value } : null;
  }).filter(Boolean);
  await API.post('/attendance/bulk', { date, records });
  closeModal(); showToast('Attendance saved'); filterAttendance();
}
