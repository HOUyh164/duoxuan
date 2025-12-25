// API Base URL
const API_BASE = '/api';

// State
let token = localStorage.getItem('adminToken');
let currentUser = null;
let currentPage = {
    cards: 1,
    orders: 1,
    users: 1
};

// DOM Elements
const loginPage = document.getElementById('login-page');
const adminPanel = document.getElementById('admin-panel');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const userEmailEl = document.getElementById('user-email');
const pageTitleEl = document.getElementById('page-title');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (token) {
        checkAuth();
    } else {
        showLogin();
    }
    
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    // Login form
    loginForm.addEventListener('submit', handleLogin);
    
    // Logout
    logoutBtn.addEventListener('click', handleLogout);
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            navigateTo(page);
        });
    });
    
    // Upload cards modal
    document.getElementById('upload-cards-btn').addEventListener('click', () => {
        document.getElementById('upload-modal').classList.remove('hidden');
    });
    
    document.getElementById('cancel-upload').addEventListener('click', () => {
        document.getElementById('upload-modal').classList.add('hidden');
    });
    
    document.getElementById('upload-form').addEventListener('submit', handleUploadCards);
    
    // Filters
    document.getElementById('filter-card-status').addEventListener('change', () => loadCards(1));
    document.getElementById('filter-card-plan').addEventListener('change', () => loadCards(1));
    
    // User search
    let searchTimeout;
    document.getElementById('search-user').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => loadUsers(1, e.target.value), 300);
    });
}

// Auth Functions
async function checkAuth() {
    try {
        const res = await fetch(`${API_BASE}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Unauthorized');
        
        const data = await res.json();
        
        if (data.user.role !== 'admin') {
            throw new Error('Not admin');
        }
        
        currentUser = data.user;
        showAdminPanel();
    } catch (error) {
        localStorage.removeItem('adminToken');
        token = null;
        showLogin();
    }
}

async function handleLogin(e) {
    e.preventDefault();
    loginError.textContent = '';
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.error || '登入失敗');
        }
        
        if (data.user.role !== 'admin') {
            throw new Error('您沒有管理員權限');
        }
        
        token = data.token;
        currentUser = data.user;
        localStorage.setItem('adminToken', token);
        
        showAdminPanel();
    } catch (error) {
        loginError.textContent = error.message;
    }
}

function handleLogout() {
    localStorage.removeItem('adminToken');
    token = null;
    currentUser = null;
    showLogin();
}

function showLogin() {
    loginPage.classList.remove('hidden');
    adminPanel.classList.add('hidden');
}

function showAdminPanel() {
    loginPage.classList.add('hidden');
    adminPanel.classList.remove('hidden');
    userEmailEl.textContent = currentUser.email;
    
    // Load dashboard
    navigateTo('dashboard');
}

// Navigation
function navigateTo(page) {
    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });
    
    // Update title
    const titles = {
        dashboard: '儀表板',
        cards: '卡密管理',
        orders: '訂單管理',
        users: '用戶管理'
    };
    pageTitleEl.textContent = titles[page];
    
    // Show/hide pages
    document.querySelectorAll('.content-page').forEach(p => {
        p.classList.add('hidden');
    });
    document.getElementById(`${page}-page`).classList.remove('hidden');
    
    // Load data
    switch (page) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'cards':
            loadCards(1);
            break;
        case 'orders':
            loadOrders(1);
            break;
        case 'users':
            loadUsers(1);
            break;
    }
}

// Dashboard
async function loadDashboard() {
    try {
        const res = await fetch(`${API_BASE}/admin/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to load stats');
        
        const data = await res.json();
        
        // Update stats
        document.getElementById('stat-users').textContent = data.overview.totalUsers;
        document.getElementById('stat-orders').textContent = data.overview.totalOrders;
        document.getElementById('stat-cards').textContent = data.overview.unusedCards;
        document.getElementById('stat-revenue').textContent = `NT$ ${data.overview.totalRevenue.toLocaleString()}`;
        
        // Update recent orders
        const tbody = document.querySelector('#recent-orders-table tbody');
        tbody.innerHTML = data.recentOrders.map(order => `
            <tr>
                <td>#${order.id}</td>
                <td>${order.user.email}</td>
                <td>${getPlanLabel(order.planType)}</td>
                <td>NT$ ${order.amount.toLocaleString()}</td>
                <td>${getStatusBadge(order.status)}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Load dashboard error:', error);
    }
}

// Cards
async function loadCards(page = 1) {
    currentPage.cards = page;
    
    const status = document.getElementById('filter-card-status').value;
    const planType = document.getElementById('filter-card-plan').value;
    
    try {
        let url = `${API_BASE}/cards?page=${page}&limit=20`;
        if (status) url += `&status=${status}`;
        if (planType) url += `&planType=${planType}`;
        
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to load cards');
        
        const data = await res.json();
        
        const tbody = document.querySelector('#cards-table tbody');
        tbody.innerHTML = data.cards.map(card => `
            <tr>
                <td>#${card.id}</td>
                <td>
                    <code>${card.cardKey}</code>
                    <button class="copy-btn" onclick="copyToClipboard('${card.cardKey}')">📋</button>
                </td>
                <td>${getPlanLabel(card.planType)}</td>
                <td>${getCardStatusBadge(card.status)}</td>
                <td>${formatDate(card.createdAt)}</td>
                <td>${card.usedAt ? formatDate(card.usedAt) : '-'}</td>
                <td>
                    ${card.status === 'unused' ? 
                        `<button class="btn btn-danger btn-sm" onclick="deleteCard(${card.id})">刪除</button>` : 
                        '-'
                    }
                </td>
            </tr>
        `).join('');
        
        renderPagination('cards', data.pagination);
    } catch (error) {
        console.error('Load cards error:', error);
    }
}

async function handleUploadCards(e) {
    e.preventDefault();
    
    const planType = document.getElementById('plan-type').value;
    const cardKeysText = document.getElementById('card-keys').value;
    
    // 按換行符分割，過濾空行
    const cardKeys = cardKeysText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    
    if (cardKeys.length === 0) {
        alert('請輸入至少一個卡密');
        return;
    }
    
    try {
        const res = await fetch(`${API_BASE}/cards/upload`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ planType, cardKeys })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.error || '上傳失敗');
        }
        
        document.getElementById('upload-modal').classList.add('hidden');
        document.getElementById('upload-form').reset();
        
        alert(`成功上傳 ${data.count} 張卡密！`);
        loadCards(1);
    } catch (error) {
        alert(error.message);
    }
}

async function deleteCard(id) {
    if (!confirm('確定要刪除這張卡密嗎？')) return;
    
    try {
        const res = await fetch(`${API_BASE}/cards/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || '刪除失敗');
        }
        
        loadCards(currentPage.cards);
    } catch (error) {
        alert(error.message);
    }
}

// Orders
async function loadOrders(page = 1) {
    currentPage.orders = page;
    
    try {
        const res = await fetch(`${API_BASE}/orders?page=${page}&limit=20`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to load orders');
        
        const data = await res.json();
        
        const tbody = document.querySelector('#orders-table tbody');
        tbody.innerHTML = data.orders.map(order => `
            <tr>
                <td>#${order.id}</td>
                <td>${order.user.email}</td>
                <td>${getPlanLabel(order.planType)}</td>
                <td>NT$ ${order.amount.toLocaleString()}</td>
                <td>${getStatusBadge(order.status)}</td>
                <td>${formatDate(order.createdAt)}</td>
                <td>
                    ${order.status === 'pending' ? `
                        <button class="btn btn-primary btn-sm" onclick="updateOrderStatus(${order.id}, 'paid')">確認付款</button>
                        <button class="btn btn-danger btn-sm" onclick="updateOrderStatus(${order.id}, 'cancelled')">取消</button>
                    ` : '-'}
                </td>
            </tr>
        `).join('');
        
        renderPagination('orders', data.pagination);
    } catch (error) {
        console.error('Load orders error:', error);
    }
}

async function updateOrderStatus(id, status) {
    const confirmMsg = status === 'paid' ? '確認此訂單已付款？' : '確定要取消此訂單嗎？';
    if (!confirm(confirmMsg)) return;
    
    try {
        const res = await fetch(`${API_BASE}/orders/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });
        
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || '更新失敗');
        }
        
        loadOrders(currentPage.orders);
    } catch (error) {
        alert(error.message);
    }
}

// Users
async function loadUsers(page = 1, search = '') {
    currentPage.users = page;
    
    try {
        let url = `${API_BASE}/admin/users?page=${page}&limit=20`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to load users');
        
        const data = await res.json();
        
        const tbody = document.querySelector('#users-table tbody');
        tbody.innerHTML = data.users.map(user => `
            <tr>
                <td>#${user.id}</td>
                <td>${user.email}</td>
                <td>${getRoleBadge(user.role)}</td>
                <td>${user._count.orders}</td>
                <td>${formatDate(user.createdAt)}</td>
                <td>
                    ${user.id !== currentUser.id ? `
                        <button class="btn btn-sm ${user.role === 'admin' ? 'btn-secondary' : 'btn-primary'}" 
                                onclick="toggleUserRole(${user.id}, '${user.role === 'admin' ? 'user' : 'admin'}')">
                            ${user.role === 'admin' ? '降為用戶' : '升為管理員'}
                        </button>
                    ` : '<span style="color: var(--text-secondary)">-</span>'}
                </td>
            </tr>
        `).join('');
        
        renderPagination('users', data.pagination);
    } catch (error) {
        console.error('Load users error:', error);
    }
}

async function toggleUserRole(id, newRole) {
    const confirmMsg = newRole === 'admin' ? '確定要將此用戶升為管理員嗎？' : '確定要將此管理員降為普通用戶嗎？';
    if (!confirm(confirmMsg)) return;
    
    try {
        const res = await fetch(`${API_BASE}/admin/users/${id}/role`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ role: newRole })
        });
        
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || '更新失敗');
        }
        
        loadUsers(currentPage.users);
    } catch (error) {
        alert(error.message);
    }
}

// Helper Functions
function getPlanLabel(planType) {
    const labels = {
        day: '天卡',
        week: '周卡',
        month: '月卡',
        lifetime: '永久卡'
    };
    return labels[planType] || planType;
}

function getStatusBadge(status) {
    const badges = {
        pending: '<span class="badge badge-warning">待付款</span>',
        paid: '<span class="badge badge-success">已付款</span>',
        cancelled: '<span class="badge badge-danger">已取消</span>',
        refunded: '<span class="badge badge-info">已退款</span>'
    };
    return badges[status] || status;
}

function getCardStatusBadge(status) {
    const badges = {
        unused: '<span class="badge badge-success">未使用</span>',
        used: '<span class="badge badge-info">已使用</span>',
        expired: '<span class="badge badge-danger">已過期</span>'
    };
    return badges[status] || status;
}

function getRoleBadge(role) {
    const badges = {
        admin: '<span class="badge badge-danger">管理員</span>',
        user: '<span class="badge badge-info">用戶</span>'
    };
    return badges[role] || role;
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('已複製到剪貼板！');
    });
}

function renderPagination(type, pagination) {
    const container = document.getElementById(`${type}-pagination`);
    const { page, totalPages } = pagination;
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = '';
    
    html += `<button ${page === 1 ? 'disabled' : ''} onclick="load${capitalize(type)}(${page - 1})">上一頁</button>`;
    
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
            html += `<button class="${i === page ? 'active' : ''}" onclick="load${capitalize(type)}(${i})">${i}</button>`;
        } else if (i === page - 3 || i === page + 3) {
            html += `<button disabled>...</button>`;
        }
    }
    
    html += `<button ${page === totalPages ? 'disabled' : ''} onclick="load${capitalize(type)}(${page + 1})">下一頁</button>`;
    
    container.innerHTML = html;
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Make functions global for onclick handlers
window.deleteCard = deleteCard;
window.updateOrderStatus = updateOrderStatus;
window.toggleUserRole = toggleUserRole;
window.copyToClipboard = copyToClipboard;
window.loadCards = loadCards;
window.loadOrders = loadOrders;
window.loadUsers = loadUsers;


