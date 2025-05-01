// public/auth.js

async function authFetch(url, opts = {}) {
  opts.headers = {
    ...(opts.headers||{}),
    'Authorization': `Bearer ${localStorage.token}`
  };
  const res = await fetch(url, opts);
  if (!res.ok) {
    const txt = await res.text();
    alerta(`Erro ${res.status}: ${txt}`, 'danger');
    throw new Error(txt);
  }
  return res;
}

function jwtDecode(token) {
  return JSON.parse(atob(token.split('.')[1]));
}

if (!localStorage.token) {
  window.location = 'login.html';
}

const user = jwtDecode(localStorage.token);

document.addEventListener('DOMContentLoaded', () => {
  if (user.role === 'admin') {
    document.getElementById('btnUsers').classList.remove('d-none');
  }
  document.getElementById('btnLogout').onclick = () => {
    localStorage.removeItem('token');
    window.location = 'login.html';
  };
});
