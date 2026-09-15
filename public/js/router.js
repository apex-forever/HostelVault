/* ===========================================================
   FILE: js/router.js — Sidebar nav config + page routing
   =========================================================== */

const NAV_CONFIG = {
  admin: [
    { section: 'Main' },
    { id: 'dashboard', icon: 'fa-th-large', label: 'Dashboard' },
    { section: 'Management' },
    { id: 'students', icon: 'fa-user-graduate', label: 'Students' },
    { id: 'wardens', icon: 'fa-user-shield', label: 'Wardens' },
    { id: 'rooms', icon: 'fa-door-open', label: 'Rooms' },
    { id: 'blocks', icon: 'fa-building', label: 'Hostel Blocks' },
    { section: 'Operations' },
    { id: 'complaints', icon: 'fa-exclamation-circle', label: 'Complaints' },
    { id: 'fees', icon: 'fa-money-bill-wave', label: 'Fees' },
    { id: 'visitors', icon: 'fa-user-friends', label: 'Visitors' },
    { id: 'leaves', icon: 'fa-calendar-check', label: 'Leave Applications' },
    { id: 'attendance', icon: 'fa-clipboard-check', label: 'Attendance' },
    { section: 'Communication' },
    { id: 'notices', icon: 'fa-bullhorn', label: 'Notice Board' },
    { id: 'profile', icon: 'fa-user-cog', label: 'Profile' },
  ],
  warden: [
    { section: 'Main' },
    { id: 'dashboard', icon: 'fa-th-large', label: 'Dashboard' },
    { section: 'Management' },
    { id: 'students', icon: 'fa-user-graduate', label: 'Students' },
    { id: 'rooms', icon: 'fa-door-open', label: 'Rooms' },
    { id: 'blocks', icon: 'fa-building', label: 'Hostel Blocks' },
    { section: 'Operations' },
    { id: 'complaints', icon: 'fa-exclamation-circle', label: 'Complaints' },
    { id: 'visitors', icon: 'fa-user-friends', label: 'Visitors' },
    { id: 'leaves', icon: 'fa-calendar-check', label: 'Leave Applications' },
    { id: 'attendance', icon: 'fa-clipboard-check', label: 'Attendance' },
    { section: 'Communication' },
    { id: 'notices', icon: 'fa-bullhorn', label: 'Notice Board' },
    { id: 'profile', icon: 'fa-user-cog', label: 'Profile' },
  ],
  student: [
    { section: 'Main' },
    { id: 'dashboard', icon: 'fa-th-large', label: 'Dashboard' },
    { section: 'My Hostel' },
    { id: 'myroom', icon: 'fa-door-open', label: 'My Room' },
    { id: 'complaints', icon: 'fa-exclamation-circle', label: 'Complaints' },
    { id: 'fees', icon: 'fa-money-bill-wave', label: 'My Fees' },
    { id: 'leaves', icon: 'fa-calendar-check', label: 'Leave Application' },
    { section: 'Information' },
    { id: 'notices', icon: 'fa-bullhorn', label: 'Notice Board' },
    { id: 'profile', icon: 'fa-user-cog', label: 'Profile' },
  ],
};

const PAGE_TITLES = {
  dashboard: 'Dashboard', students: 'Student Management', wardens: 'Warden Management', rooms: 'Room Management',
  blocks: 'Hostel Blocks', complaints: 'Complaints', fees: 'Fee Management',
  visitors: 'Visitor Log', leaves: 'Leave Applications', attendance: 'Attendance',
  notices: 'Notice Board', profile: 'Profile', myroom: 'My Room',
};

function buildSidebar() {
  const items = NAV_CONFIG[currentUser.role] || NAV_CONFIG.student;
  let html = '';
  items.forEach(item => {
    if (item.section) html += `<div class="nav-section">${item.section}</div>`;
    else html += `<div class="nav-item${currentPage === item.id ? ' active' : ''}" data-page="${item.id}" onclick="navigate('${item.id}')"><i class="fas ${item.icon}"></i> ${item.label}</div>`;
  });
  document.getElementById('sidebarNav').innerHTML = html;
  document.getElementById('sidebarAvatar').textContent = currentUser.avatar;
  document.getElementById('sidebarUserName').textContent = currentUser.name;
  document.getElementById('sidebarUserRole').textContent = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
}

async function updateTopbar() {
  document.getElementById('topbarAvatar').textContent = currentUser.avatar;
  document.getElementById('topbarName').textContent = currentUser.name.split(' ')[0];
}

function destroyCharts() {
  Object.values(chartInstances).forEach(c => { if (c) c.destroy(); });
  chartInstances = {};
}

async function navigate(page) {
  currentPage = page;
  destroyCharts();
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === page));
  document.getElementById('pageTitle').textContent = PAGE_TITLES[page] || 'Dashboard';

  const renderers = {
    dashboard: renderDashboard, students: renderStudents, wardens: renderWardens, rooms: renderRooms,
    blocks: renderBlocks, complaints: renderComplaints, fees: renderFees,
    visitors: renderVisitors, leaves: renderLeaves, attendance: renderAttendance,
    notices: renderNotices, profile: renderProfile, myroom: renderMyRoom,
  };
  if (renderers[page]) await renderers[page]();
  if (window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('open');
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.querySelector('.main-content');
  const menuToggle = document.getElementById('menuToggle');
  if (window.innerWidth <= 768) {
    const isOpen = sidebar.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.querySelector('i').className = `fas fa-${isOpen ? 'times' : 'bars'}`;
    return;
  }
  const isClosed = sidebar.classList.toggle('closed');
  mainContent.classList.toggle('sidebar-closed', isClosed);
  menuToggle.setAttribute('aria-expanded', String(!isClosed));
  menuToggle.querySelector('i').className = `fas fa-${isClosed ? 'bars' : 'times'}`;
}
