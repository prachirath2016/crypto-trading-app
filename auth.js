
// ===========================
// CUSTOMER ACCOUNTS
// Backed by this site's own account API (api/auth/*, api/account/*),
// which stores everything in this business's own database.
// ===========================

const API_BASE = 'api/';
const TOKEN_KEY = 'auth_token';

async function api(path, options) {
    options = options || {};
    const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) headers['Authorization'] = 'Bearer ' + token;
    let res, data = {};
    try {
        res = await fetch(API_BASE + path, Object.assign({}, options, { headers }));
        try { data = await res.json(); } catch (e) { data = {}; }
    } catch (e) {
        return { success: false, error: 'network problem — check your connection' };
    }
    if (!data.success && !data.error) data.error = res.ok ? 'unexpected reply' : 'server error (' + res.status + ')';
    return data;
}

function showError(msg) {
    const el = document.getElementById('auth-error');
    if (el) { el.textContent = msg || ''; el.hidden = !msg; }
    else if (msg) alert(msg);
}

function isLoggedIn() {
    return !!localStorage.getItem(TOKEN_KEY);
}

async function getCurrentUser() {
    if (!isLoggedIn()) return null;
    const data = await api('auth/me');
    if (!data.success) { localStorage.removeItem(TOKEN_KEY); return null; }
    return data.user;
}

function requireAuth() {
    if (!isLoggedIn()) window.location.href = 'login.html';
}

async function logout() {
    try { await api('auth/logout', { method: 'POST' }); } catch (e) {}
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = 'index.html';
}

function afterAuth(token) {
    localStorage.setItem(TOKEN_KEY, token);
    const plan = new URLSearchParams(window.location.search).get('plan');
    window.location.href = plan ? 'pay.html' : 'dashboard.html';
}

// Toggle between the login and signup forms
function toggleForms() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const toggleText = document.getElementById('toggle-form-text');
    showError('');
    if (loginForm.classList.contains('active-form')) {
        loginForm.classList.remove('active-form');
        signupForm.classList.add('active-form');
        toggleText.innerHTML = 'Already have an account? <a href="#" id="toggle-form">Log in</a>';
    } else {
        signupForm.classList.remove('active-form');
        loginForm.classList.add('active-form');
        toggleText.innerHTML = 'New here? <a href="#" id="toggle-form">Create an account</a>';
    }
}

document.getElementById('toggle-form-text')?.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'toggle-form') { e.preventDefault(); toggleForms(); }
});

// Open the signup form directly when the site links to login.html#signup
if (window.location.hash === '#signup' && document.getElementById('signup-form')) toggleForms();

// Already signed in? The login page goes straight to the account, never asks again.
if (document.getElementById('login-form') && isLoggedIn()) {
    getCurrentUser().then((u) => { if (u) window.location.href = 'dashboard.html'; });
}

document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    showError('');
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const data = await api('auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    if (data.success) afterAuth(data.token); else showError(data.error);
});

document.getElementById('signup-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    showError('');
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-password-confirm').value;
    if (password !== confirm) { showError('Passwords do not match'); return; }
    const data = await api('auth/signup', { method: 'POST', body: JSON.stringify({ name, email, password }) });
    if (data.success) afterAuth(data.token); else showError(data.error);
});

document.getElementById('logout-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
});
