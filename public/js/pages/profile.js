/* ===========================================================
   FILE: js/pages/profile.js — User profile
   =========================================================== */

function renderProfile() {
  const u = currentUser;
  const isStudent = u.role === 'student';
  const pc = document.getElementById('pageContent');
  pc.innerHTML = `<div class="grid grid-cols-1 lg:grid-cols-3 gap-5 fade-up">
    <div class="content-card text-center">
      <div style="width:80px;height:80px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:28px;color:#fff;margin:0 auto 16px">${u.avatar}</div>
      <h3 class="font-display font-bold text-xl">${u.name}</h3>
      <p class="text-sm mb-2" style="color:var(--text-muted)">${u.email}</p>
      <span class="badge ${u.role === 'admin' ? 'badge-danger' : u.role === 'warden' ? 'badge-warning' : 'badge-info'}">${u.role.charAt(0).toUpperCase() + u.role.slice(1)}</span>
      ${isStudent ? `<div class="mt-4 pt-4 border-t" style="border-color:var(--border)"><p class="text-sm"><strong>Reg No:</strong> ${u.regNo || 'N/A'}</p><p class="text-sm"><strong>Dept:</strong> ${u.department || 'N/A'}</p><p class="text-sm"><strong>Level:</strong> ${u.level || 'N/A'}</p><p class="text-sm"><strong>Room:</strong> ${u.roomId || 'N/A'}</p></div>` : ''}
    </div>
    <div class="content-card lg:col-span-2">
      <h3 class="card-title mb-4">Edit Profile</h3>
      <div class="form-row"><div class="form-group"><label class="form-label">Full Name</label><input class="form-input" id="pf_name" value="${u.name}"></div><div class="form-group"><label class="form-label">Email</label><input class="form-input" type="email" id="pf_email" value="${u.email}"></div></div>
      <div class="form-group"><label class="form-label">Phone</label><input class="form-input" id="pf_phone" value="${u.phone || ''}"></div>
      <button class="btn btn-green" onclick="saveProfile()">Save Changes</button>

      <div class="mt-6 pt-6 border-t" style="border-color:var(--border)">
        <h3 class="card-title mb-4">Change Password</h3>
        <div class="form-row"><div class="form-group"><label class="form-label">Current Password</label><input class="form-input" type="password" id="pf_current"></div><div class="form-group"><label class="form-label">New Password</label><input class="form-input" type="password" id="pf_new"></div></div>
        <button class="btn btn-outline" onclick="changePassword()">Update Password</button>
      </div>
    </div>
  </div>`;
}

async function saveProfile() {
  const data = { name: document.getElementById('pf_name').value, email: document.getElementById('pf_email').value, phone: document.getElementById('pf_phone').value };
  try {
    currentUser = await API.put('/auth/me', data);
    showToast('Profile updated');
    buildSidebar(); await updateTopbar(); renderProfile();
  } catch (err) { showToast(err.message, 'error'); }
}

async function changePassword() {
  const currentPassword = document.getElementById('pf_current').value;
  const newPassword = document.getElementById('pf_new').value;
  if (!currentPassword || !newPassword) { showToast('Fill both password fields', 'error'); return; }
  try {
    await API.put('/auth/password', { currentPassword, newPassword });
    showToast('Password updated'); renderProfile();
  } catch (err) { showToast(err.message, 'error'); }
}
