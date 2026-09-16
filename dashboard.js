
// ===========================
// MY ACCOUNT
// ===========================

requireAuth();

let currentUser = null;

function money(cents) {
    return '$' + ((cents || 0) / 100).toFixed(2);
}

function showSection(name) {
    document.querySelectorAll('.menu-item').forEach(i => i.classList.toggle('active', i.dataset.section === name));
    document.querySelectorAll('.dashboard-section').forEach(s => s.classList.toggle('active', s.id === name + '-section'));
    if (name === 'orders') loadOrders();
}

window.addEventListener('load', async () => {
    currentUser = await getCurrentUser();
    if (!currentUser) { window.location.href = 'login.html'; return; }
    fillProfile(currentUser);
    loadOrders();

    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => { e.preventDefault(); showSection(item.dataset.section); });
    });
    document.querySelectorAll('[data-goto]').forEach(el => {
        el.addEventListener('click', (e) => { e.preventDefault(); showSection(el.dataset.goto); });
    });
    document.getElementById('profile-form')?.addEventListener('submit', saveProfile);
    document.getElementById('delete-account')?.addEventListener('click', deleteAccount);
});

async function deleteAccount(e) {
    e.preventDefault();
    if (!confirm('Delete your account? You will be signed out. Past orders stay on record for the business.')) return;
    const data = await api('account/delete', { method: 'POST' });
    if (!data.success) { alert(data.error || 'Could not delete the account'); return; }
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = 'index.html';
}

function fillProfile(user) {
    const first = (user.name || '').split(' ')[0] || 'there';
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('user-name', user.name || user.email);
    set('user-email', user.email);
    set('welcome-name', first);
    set('stat-since', user.member_since || '–');
    const name = document.getElementById('profile-name');
    const email = document.getElementById('profile-email');
    const phone = document.getElementById('profile-phone');
    if (name) name.value = user.name || '';
    if (email) email.value = user.email || '';
    if (phone) phone.value = user.phone || '';
}

async function loadOrders() {
    const list = document.getElementById('orders-list');
    const data = await api('account/orders');
    if (!data.success) {
        if (list) list.innerHTML = '<p>' + (data.error || 'Could not load orders') + '</p>';
        return;
    }
    const orders = data.orders || [];
    const paid = orders.filter(o => o.status === 'paid');
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('stat-orders', String(paid.length));
    set('stat-spent', money(data.total_cents));
    if (!list) return;
    if (!orders.length) {
        list.innerHTML = '<p>No orders yet. <a href="pay.html">Make your first one →</a></p>';
        return;
    }
    list.innerHTML = orders.map(o => {
        const when = o.date ? new Date(o.date).toLocaleDateString() : '';
        return '<div class="product-item">' +
               '<h4>Order #' + o.id + ' · ' + money(o.amount_cents) + '</h4>' +
               '<p>' + when + ' · ' + o.status + '</p>' +
               '</div>';
    }).join('');
}

async function saveProfile(e) {
    e.preventDefault();
    const msg = document.getElementById('profile-msg');
    const name = document.getElementById('profile-name').value;
    const phone = document.getElementById('profile-phone').value;
    const data = await api('account/profile', { method: 'POST', body: JSON.stringify({ name, phone }) });
    if (msg) msg.textContent = data.success ? 'Saved ✓' : (data.error || 'Could not save');
    if (data.success) { currentUser = data.user; fillProfile(currentUser); }
}
