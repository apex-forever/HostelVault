/* ===========================================================
   FILE: js/pages/dashboard.js — Dashboard page
   Wardens see stats scoped to their own block; admins see the
   whole hostel; students see their personal snapshot.
   =========================================================== */

let chartInstances = {};

async function renderDashboard() {
  const pc = document.getElementById('pageContent');

  const [students, rooms, complaints, fees, leaves, notices, allBlocks] = await Promise.all([
    API.get('/students'), API.get('/rooms'), API.get('/complaints'),
    API.get('/fees'), API.get('/leaves'), API.get('/notices'), API.get('/blocks'),
  ]);

  const sortedNotices = [...notices].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (currentUser.role === 'student') {
    const myFees = fees; // already scoped server-side
    const myComplaints = complaints;
    const myLeaves = leaves;
    const paidAmt = myFees.filter(f => f.status === 'paid').reduce((a, f) => a + f.amount, 0);

    pc.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <div class="stat-card fade-up"><div class="stat-icon" style="background:#D1FAE5;color:#065F46"><i class="fas fa-door-open"></i></div><div class="stat-value">${currentUser.roomId || 'N/A'}</div><div class="stat-label">My Room</div></div>
        <div class="stat-card fade-up-d1"><div class="stat-icon" style="background:#FEF3C7;color:#92400E"><i class="fas fa-exclamation-circle"></i></div><div class="stat-value">${myComplaints.length}</div><div class="stat-label">My Complaints</div></div>
        <div class="stat-card fade-up-d2"><div class="stat-icon" style="background:#CFFAFE;color:#155E75"><i class="fas fa-money-bill-wave"></i></div><div class="stat-value">${formatCurrency(paidAmt)}</div><div class="stat-label">Fees Paid</div></div>
        <div class="stat-card fade-up-d3"><div class="stat-icon" style="background:#FEE2E2;color:#991B1B"><i class="fas fa-calendar-check"></i></div><div class="stat-value">${myLeaves.length}</div><div class="stat-label">Leave Applications</div></div>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div class="content-card fade-up-d2"><div class="card-header"><h3 class="card-title">Recent Notices</h3></div>
          ${sortedNotices.slice(0, 3).map(n => `<div class="notice-card"><div class="flex items-center justify-between mb-1"><span class="font-semibold text-sm">${n.title}</span>${getPriorityBadge(n.priority)}</div><p class="text-xs" style="color:var(--text-muted)">${n.content.substring(0, 100)}...</p><p class="text-xs mt-1" style="color:var(--text-muted)">${formatDate(n.date)}</p></div>`).join('') || '<div class="empty-state"><i class="fas fa-bullhorn"></i><p>No notices yet</p></div>'}
        </div>
        <div class="content-card fade-up-d3"><div class="card-header"><h3 class="card-title">My Complaints</h3></div>
          ${myComplaints.length ? myComplaints.map(c => `<div class="flex items-center justify-between py-3 border-b" style="border-color:var(--border)"><div><p class="font-semibold text-sm">${c.title}</p><p class="text-xs" style="color:var(--text-muted)">${formatDate(c.date)}</p></div>${getStatusBadge(c.status)}</div>`).join('') : '<div class="empty-state"><i class="fas fa-check-circle"></i><p>No complaints submitted</p></div>'}
        </div>
      </div>`;
    return;
  }

  // Admin sees the whole hostel; a warden only sees their assigned block.
  const isWarden = currentUser.role === 'warden';
  const blocks = isWarden ? allBlocks.filter(b => b.id === currentUser.blockId) : allBlocks;
  const scopedRooms = isWarden ? rooms.filter(r => r.blockId === currentUser.blockId) : rooms;
  const scopedStudents = isWarden ? students.filter(s => s.blockId === currentUser.blockId) : students;
  const scopedStudentIds = new Set(scopedStudents.map(s => s.id));
  const scopedComplaints = isWarden ? complaints.filter(c => scopedStudentIds.has(c.studentId)) : complaints;
  const scopedFees = isWarden ? fees.filter(f => scopedStudentIds.has(f.studentId)) : fees;
  const scopedLeaves = isWarden ? leaves.filter(l => scopedStudentIds.has(l.studentId)) : leaves;

  const activeStudents = scopedStudents.filter(s => s.status === 'active').length;
  const totalRooms = scopedRooms.length;
  const occupiedRooms = scopedRooms.filter(r => r.status !== 'available').length;
  const occupancyRate = totalRooms ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
  const pendingComplaints = scopedComplaints.filter(c => c.status === 'pending').length;
  const totalCollected = scopedFees.filter(f => f.status === 'paid').reduce((a, f) => a + f.amount, 0);
  const pendingFees = scopedFees.filter(f => f.status === 'pending').reduce((a, f) => a + f.amount, 0);
  const partialFees = scopedFees.filter(f => f.status === 'partial').reduce((a, f) => a + (f.amount - (f.amountPaid || 0)), 0);

  pc.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
      <div class="stat-card fade-up"><div class="stat-icon" style="background:#D1FAE5;color:#065F46"><i class="fas fa-user-graduate"></i></div><div class="stat-value">${activeStudents}</div><div class="stat-label">Active Students</div><div class="stat-change" style="color:var(--success)"><i class="fas fa-arrow-up"></i> ${scopedStudents.length} total</div></div>
      <div class="stat-card fade-up-d1"><div class="stat-icon" style="background:#CFFAFE;color:#155E75"><i class="fas fa-door-open"></i></div><div class="stat-value">${occupancyRate}%</div><div class="stat-label">Occupancy Rate</div><div class="stat-change" style="color:var(--info)">${occupiedRooms}/${totalRooms} rooms</div></div>
      <div class="stat-card fade-up-d2"><div class="stat-icon" style="background:#FEE2E2;color:#991B1B"><i class="fas fa-exclamation-circle"></i></div><div class="stat-value">${pendingComplaints}</div><div class="stat-label">Pending Complaints</div><div class="stat-change" style="color:var(--danger)">${scopedComplaints.filter(c => c.status === 'in-progress').length} in progress</div></div>
      <div class="stat-card fade-up-d3"><div class="stat-icon" style="background:#FEF3C7;color:#92400E"><i class="fas fa-money-bill-wave"></i></div><div class="stat-value">${formatCurrency(totalCollected)}</div><div class="stat-label">Fees Collected</div><div class="stat-change" style="color:var(--warning)">${formatCurrency(pendingFees + partialFees)} outstanding</div></div>
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
      <div class="content-card fade-up-d2" style="lg:col-span-2"><div class="card-header"><h3 class="card-title">Occupancy by Block</h3></div><div style="height:260px"><canvas id="chartOccupancy"></canvas></div></div>
      <div class="content-card fade-up-d3"><div class="card-header"><h3 class="card-title">Complaint Status</h3></div><div style="height:260px"><canvas id="chartComplaints"></canvas></div></div>
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div class="content-card fade-up-d3"><div class="card-header"><h3 class="card-title">Fee Collection Overview</h3></div><div style="height:240px"><canvas id="chartFees"></canvas></div></div>
      <div class="content-card fade-up-d4"><div class="card-header"><h3 class="card-title">Recent Activity</h3><span class="text-xs" style="color:var(--text-muted)">Latest updates</span></div>
        ${[...scopedComplaints].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3).map(c => { const s = students.find(x => x.id === c.studentId); return `<div class="flex items-start gap-3 py-3 border-b" style="border-color:var(--border)"><div style="width:36px;height:36px;border-radius:10px;background:#FEE2E2;display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fas fa-exclamation-circle" style="color:#991B1B;font-size:14px"></i></div><div><p class="text-sm font-semibold">${c.title}</p><p class="text-xs" style="color:var(--text-muted)">${s ? s.name : 'Unknown'} | ${formatDate(c.date)}</p></div><div class="ml-auto">${getStatusBadge(c.status)}</div></div>`; }).join('')}
        ${scopedLeaves.filter(l => l.status === 'pending').slice(0, 2).map(l => { const s = students.find(x => x.id === l.studentId); return `<div class="flex items-start gap-3 py-3 border-b" style="border-color:var(--border)"><div style="width:36px;height:36px;border-radius:10px;background:#FEF3C7;display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fas fa-calendar-check" style="color:#92400E;font-size:14px"></i></div><div><p class="text-sm font-semibold">Leave: ${s ? s.name : 'Unknown'}</p><p class="text-xs" style="color:var(--text-muted)">${l.type} | ${formatDate(l.fromDate)}</p></div><div class="ml-auto">${getStatusBadge(l.status)}</div></div>`; }).join('')}
        ${(scopedComplaints.length === 0 && scopedLeaves.filter(l => l.status === 'pending').length === 0) ? '<div class="empty-state"><i class="fas fa-check-circle"></i><p>Nothing needs attention right now</p></div>' : ''}
      </div>
    </div>`;

  setTimeout(() => {
    const blockOcc = blocks.map(b => {
      const br = scopedRooms.filter(r => r.blockId === b.id);
      return { name: b.name.split('|')[0].trim(), total: br.length, occupied: br.filter(r => r.status !== 'available').length };
    });
    const ctx1 = document.getElementById('chartOccupancy');
    if (ctx1) chartInstances.occupancy = new Chart(ctx1, { type: 'bar', data: { labels: blockOcc.map(b => b.name), datasets: [{ label: 'Occupied', data: blockOcc.map(b => b.occupied), backgroundColor: '#2D6A4F', borderRadius: 6, barPercentage: 0.6 }, { label: 'Available', data: blockOcc.map(b => b.total - b.occupied), backgroundColor: '#B7E4C7', borderRadius: 6, barPercentage: 0.6 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 16 } } }, scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, grid: { color: '#F3F4F6' }, ticks: { stepSize: 5 } } } } });

    const ctx2 = document.getElementById('chartComplaints');
    if (ctx2) chartInstances.complaints = new Chart(ctx2, { type: 'doughnut', data: { labels: ['Pending', 'In Progress', 'Resolved'], datasets: [{ data: ['pending', 'in-progress', 'resolved'].map(s => scopedComplaints.filter(c => c.status === s).length), backgroundColor: ['#F59E0B', '#0891B2', '#16A34A'], borderWidth: 0, hoverOffset: 8 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 12 } } } } });

    const ctx3 = document.getElementById('chartFees');
    if (ctx3) chartInstances.fees = new Chart(ctx3, { type: 'bar', data: { labels: blockOcc.map(b => b.name), datasets: [{ label: 'Collected (GHS k)', data: blocks.map(b => { const bs = scopedStudents.filter(s => s.blockId === b.id); return Math.round(scopedFees.filter(f => bs.some(s => s.id === f.studentId) && f.status === 'paid').reduce((a, f) => a + f.amount, 0) / 1000); }), backgroundColor: '#E9A319', borderRadius: 6, barPercentage: 0.5 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: '#F3F4F6' } } } } });
  }, 100);
}
