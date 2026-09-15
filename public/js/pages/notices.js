/* ===========================================================
   FILE: js/pages/notices.js — Notice board
   =========================================================== */

async function renderNotices() {
  const notices = (await API.get('/notices')).sort((a, b) => new Date(b.date) - new Date(a.date));
  const canPost = currentUser.role !== 'student';
  const pc = document.getElementById('pageContent');
  pc.innerHTML = `<div class="flex flex-wrap items-center justify-between gap-3 mb-5 fade-up"><h3 class="font-display font-bold text-lg">All Notices</h3>${canPost ? `<button class="btn btn-green" onclick="openNoticeForm()"><i class="fas fa-plus"></i> Post Notice</button>` : ''}</div><div class="fade-up-d1">${notices.map(n => `<div class="notice-card" style="border-left-color:${n.priority === 'high' ? 'var(--danger)' : n.priority === 'medium' ? 'var(--warning)' : 'var(--info)'}"><div class="flex items-start justify-between mb-2"><div><h4 class="font-semibold">${n.title}</h4><p class="text-xs" style="color:var(--text-muted)">By ${n.author} on ${formatDate(n.date)}</p></div><div class="flex gap-2">${getPriorityBadge(n.priority)}<span class="badge badge-neutral">${n.category}</span>${canPost ? `<button class="btn btn-sm btn-ghost" style="color:var(--danger)" onclick="deleteNotice(${n.id})"><i class="fas fa-trash"></i></button>` : ''}</div></div><p class="text-sm" style="color:var(--text-muted);line-height:1.6">${n.content}</p></div>`).join('')}${notices.length === 0 ? '<div class="empty-state"><i class="fas fa-bullhorn"></i><p>No notices</p></div>' : ''}</div>`;
}
function openNoticeForm() {
  openModal(`<div class="modal-header"><h3>Post Notice</h3><button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button></div><div class="modal-body"><div class="form-group"><label class="form-label">Title</label><input class="form-input" id="nf_title"></div><div class="form-row"><div class="form-group"><label class="form-label">Priority</label><select class="form-select" id="nf_pri"><option value="low">Low</option><option value="medium" selected>Medium</option><option value="high">High</option></select></div><div class="form-group"><label class="form-label">Category</label><select class="form-select" id="nf_cat"><option>General</option><option>Safety</option><option>Maintenance</option><option>Academic</option><option>Social</option></select></div></div><div class="form-group"><label class="form-label">Content</label><textarea class="form-textarea" id="nf_content" rows="5"></textarea></div></div><div class="modal-footer"><button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-green" onclick="saveNotice()">Post</button></div>`);
}
async function saveNotice() {
  const data = { title: document.getElementById('nf_title').value, content: document.getElementById('nf_content').value, priority: document.getElementById('nf_pri').value, category: document.getElementById('nf_cat').value };
  if (!data.title) { showToast('Please enter a title', 'error'); return; }
  await API.post('/notices', data);
  closeModal(); showToast('Notice posted'); renderNotices();
}
function deleteNotice(id) {
  confirmAction('Delete this notice?', async () => {
    await API.delete(`/notices/${id}`);
    showToast('Deleted'); renderNotices();
  });
}
