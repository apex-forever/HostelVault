/* ===========================================================
   FILE: js/pages/blocks.js — Hostel blocks overview
   =========================================================== */

async function renderBlocks() {
  const [blocksData, rooms, students, wardens] = await Promise.all([API.get('/blocks'), API.get('/rooms'), API.get('/students'), API.get('/wardens')]);
  const isWarden = currentUser.role === 'warden';
  const blocks = isWarden ? blocksData.filter(b => b.id === currentUser.blockId) : blocksData;
  const pc = document.getElementById('pageContent');
  pc.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 gap-5 fade-up">${blocks.map(b => {
    const bR = rooms.filter(r => r.blockId === b.id);
    const occ = bR.filter(r => r.status !== 'available').length;
    const rate = bR.length ? Math.round((occ / bR.length) * 100) : 0;
    const bS = students.filter(s => s.blockId === b.id && s.status === 'active');
    const bW = wardens.filter(w => w.blockId === b.id && w.status === 'active');
    const wardenLabel = bW.length ? bW.map(w => w.name).join(', ') : 'Unassigned';
    return `<div class="content-card card-hoverable"><div class="flex items-start justify-between mb-4"><div><h3 class="card-title">${b.name}</h3><p class="text-sm" style="color:var(--text-muted)">${b.description}</p></div><span class="badge ${b.type === 'Male' ? 'badge-info' : 'badge-warning'}">${b.type}</span></div><div class="grid grid-cols-3 gap-4 mb-4"><div class="text-center p-3 rounded-lg" style="background:var(--bg)"><div class="font-display font-bold text-xl">${bR.length}</div><div class="text-xs" style="color:var(--text-muted)">Rooms</div></div><div class="text-center p-3 rounded-lg" style="background:var(--bg)"><div class="font-display font-bold text-xl">${bS.length}</div><div class="text-xs" style="color:var(--text-muted)">Students</div></div><div class="text-center p-3 rounded-lg" style="background:var(--bg)"><div class="font-display font-bold text-xl">${rate}%</div><div class="text-xs" style="color:var(--text-muted)">Occupied</div></div></div><div class="mb-2 flex justify-between text-xs" style="color:var(--text-muted)"><span>Occupancy</span><span>${occ}/${bR.length}</span></div><div class="occupancy-bar"><div class="fill" style="width:${rate}%;background:${rate > 80 ? 'var(--danger)' : rate > 50 ? 'var(--warning)' : 'var(--success)'}"></div></div><div class="mt-3 text-sm" style="color:var(--text-muted)"><i class="fas fa-user-shield mr-1"></i> ${wardenLabel}</div></div>`;
  }).join('')}</div>`;
}
