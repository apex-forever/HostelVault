export function todayISO() {
  return new Date().toISOString().split('T')[0];
}

export function nowTime() {
  return new Date().toTimeString().substring(0, 5);
}

export function initials(name) {
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}
