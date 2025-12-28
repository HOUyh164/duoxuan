// API Base URL
const API_BASE = '/api';

// State
let token = localStorage.getItem('adminToken');
let currentUser = null;
let gamesCache = [];
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
    
    // Games
    document.getElementById('add-game-btn').addEventListener('click', () => openGameModal());
    document.getElementById('game-form').addEventListener('submit', handleSaveGame);
    
    // Products
    document.getElementById('add-product-btn').addEventListener('click', () => openProductModal());
    document.getElementById('product-form').addEventListener('submit', handleSaveProduct);
    document.getElementById('filter-product-game').addEventListener('change', () => loadProducts());
    document.getElementById('filter-product-status').addEventListener('change', () => loadProducts());
    
    // Upload cards modal
    document.getElementById('upload-cards-btn').addEventListener('click', () => {
        document.getElementById('upload-modal').classList.remove('hidden');
    });
    
    document.getElementById('cancel-upload').addEventListener('click', () => {
        document.getElementById('upload-modal').classList.add('hidden');
    });
    
    document.getElementById('upload-form').addEventListener('submit', handleUploadCards);
    
    // Card Filters
    document.getElementById('filter-card-status').addEventListener('change', () => loadCards(1));
    document.getElementById('filter-card-plan').addEventListener('change', () => loadCards(1));
    document.getElementById('filter-card-game').addEventListener('change', () => loadCards(1));
    
    // User search
    let searchTimeout;
    document.getElementById('search-user').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => loadUsers(1, e.target.value), 300);
    });
    
    // Config tabs
    document.querySelectorAll('.config-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.config-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const tabName = tab.dataset.configTab;
            document.querySelectorAll('.config-section').forEach(s => s.classList.add('hidden'));
            document.getElementById(`config-${tabName}`).classList.remove('hidden');
        });
    });
    
    // Global config form
    document.getElementById('global-config-form').addEventListener('submit', handleSaveGlobalConfig);
    
    // Game config select
    document.getElementById('config-game-select').addEventListener('change', handleGameConfigSelect);
    document.getElementById('game-config-form').addEventListener('submit', handleSaveGameConfig);
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

async function showAdminPanel() {
    loginPage.classList.add('hidden');
    adminPanel.classList.remove('hidden');
    userEmailEl.textContent = currentUser.email;
    
    // Load games cache for filters
    await loadGamesCache();
    
    // Load dashboard
    navigateTo('dashboard');
}

async function loadGamesCache() {
    try {
        const res = await fetch(`${API_BASE}/games`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            gamesCache = await res.json();
            updateGameSelects();
        }
    } catch (error) {
        console.error('Load games cache error:', error);
    }
}

function updateGameSelects() {
    const selects = [
        'filter-product-game',
        'filter-card-game',
        'product-gameId',
        'upload-gameId',
        'config-game-select'
    ];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        const firstOption = select.options[0];
        select.innerHTML = '';
        select.appendChild(firstOption);
        
        gamesCache.forEach(game => {
            const option = document.createElement('option');
            option.value = game.id;
            option.textContent = game.name;
            select.appendChild(option);
        });
    });
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
        games: '遊戲管理',
        products: '商品管理',
        cards: '卡密管理',
        orders: '訂單管理',
        users: '用戶管理',
        config: '網站配置'
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
        case 'games':
            loadGames();
            break;
        case 'products':
            loadProducts();
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
        case 'config':
            loadConfig();
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

// Games
async function loadGames() {
    try {
        const res = await fetch(`${API_BASE}/games`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to load games');
        
        const games = await res.json();
        gamesCache = games;
        updateGameSelects();
        
        const tbody = document.querySelector('#games-table tbody');
        tbody.innerHTML = games.map(game => `
            <tr>
                <td>#${game.id}</td>
                <td>
                    ${game.icon ? `<img src="${game.icon}" alt="${game.name}" class="game-icon">` : '<span class="no-icon">-</span>'}
                </td>
                <td>${game.name}</td>
                <td><code>${game.slug}</code></td>
                <td>${game._count?.products || 0}</td>
                <td>${game.isActive ? '<span class="badge badge-success">啟用</span>' : '<span class="badge badge-danger">停用</span>'}</td>
                <td>${game.sortOrder}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editGame(${game.id})">編輯</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteGame(${game.id})">刪除</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Load games error:', error);
    }
}

function openGameModal(game = null) {
    const modal = document.getElementById('game-modal');
    const title = document.getElementById('game-modal-title');
    const form = document.getElementById('game-form');
    
    form.reset();
    
    if (game) {
        title.textContent = '編輯遊戲';
        document.getElementById('game-id').value = game.id;
        document.getElementById('game-name').value = game.name;
        document.getElementById('game-slug').value = game.slug;
        document.getElementById('game-description').value = game.description || '';
        document.getElementById('game-icon').value = game.icon || '';
        document.getElementById('game-coverImage').value = game.coverImage || '';
        document.getElementById('game-themeColor').value = game.themeColor || '#ff4655';
        document.getElementById('game-sortOrder').value = game.sortOrder || 0;
        document.getElementById('game-isActive').checked = game.isActive;
    } else {
        title.textContent = '新增遊戲';
        document.getElementById('game-id').value = '';
        document.getElementById('game-themeColor').value = '#ff4655';
        document.getElementById('game-isActive').checked = true;
    }
    
    modal.classList.remove('hidden');
}

function closeGameModal() {
    document.getElementById('game-modal').classList.add('hidden');
}

async function editGame(id) {
    try {
        const res = await fetch(`${API_BASE}/games/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to load game');
        
        const game = await res.json();
        openGameModal(game);
    } catch (error) {
        alert('載入遊戲失敗: ' + error.message);
    }
}

async function handleSaveGame(e) {
    e.preventDefault();
    
    const id = document.getElementById('game-id').value;
    const data = {
        name: document.getElementById('game-name').value,
        slug: document.getElementById('game-slug').value,
        description: document.getElementById('game-description').value || null,
        icon: document.getElementById('game-icon').value || null,
        coverImage: document.getElementById('game-coverImage').value || null,
        themeColor: document.getElementById('game-themeColor').value,
        sortOrder: parseInt(document.getElementById('game-sortOrder').value) || 0,
        isActive: document.getElementById('game-isActive').checked
    };
    
    try {
        const url = id ? `${API_BASE}/games/${id}` : `${API_BASE}/games`;
        const method = id ? 'PUT' : 'POST';
        
        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        
        const result = await res.json();
        
        if (!res.ok) {
            throw new Error(result.error || '保存失敗');
        }
        
        closeGameModal();
        loadGames();
        alert(id ? '遊戲已更新！' : '遊戲已創建！');
    } catch (error) {
        alert(error.message);
    }
}

async function deleteGame(id) {
    if (!confirm('確定要刪除此遊戲嗎？這將同時刪除該遊戲的所有商品！')) return;
    
    try {
        const res = await fetch(`${API_BASE}/games/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || '刪除失敗');
        }
        
        loadGames();
    } catch (error) {
        alert(error.message);
    }
}

// Products
async function loadProducts() {
    const gameId = document.getElementById('filter-product-game').value;
    const active = document.getElementById('filter-product-status').value;
    
    let url = `${API_BASE}/products?`;
    if (gameId) url += `gameId=${gameId}&`;
    if (active) url += `active=${active}&`;
    
    try {
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to load products');
        
        const products = await res.json();
        
        const tbody = document.querySelector('#products-table tbody');
        tbody.innerHTML = products.map(product => `
            <tr>
                <td>#${product.id}</td>
                <td>${product.game?.name || '-'}</td>
                <td>${product.name}</td>
                <td>${product.currency} ${product.price.toLocaleString()}</td>
                <td>${product.duration === -1 ? '永久' : product.duration + ' 小時'}</td>
                <td>${product.badge || '-'}</td>
                <td>${product.isActive ? '<span class="badge badge-success">啟用</span>' : '<span class="badge badge-danger">停用</span>'}</td>
                <td>${product.sortOrder}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editProduct(${product.id})">編輯</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteProduct(${product.id})">刪除</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Load products error:', error);
    }
}

function openProductModal(product = null) {
    const modal = document.getElementById('product-modal');
    const title = document.getElementById('product-modal-title');
    const form = document.getElementById('product-form');
    
    form.reset();
    
    if (product) {
        title.textContent = '編輯商品';
        document.getElementById('product-id').value = product.id;
        document.getElementById('product-gameId').value = product.gameId;
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-planType').value = product.planType;
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-currency').value = product.currency || 'NT$';
        document.getElementById('product-duration').value = product.duration;
        document.getElementById('product-description').value = product.description || '';
        document.getElementById('product-features').value = (product.features || []).join('\n');
        document.getElementById('product-badge').value = product.badge || '';
        document.getElementById('product-sortOrder').value = product.sortOrder || 0;
        document.getElementById('product-isPopular').checked = product.isPopular;
        document.getElementById('product-isPremium').checked = product.isPremium;
        document.getElementById('product-isActive').checked = product.isActive;
    } else {
        title.textContent = '新增商品';
        document.getElementById('product-id').value = '';
        document.getElementById('product-currency').value = 'NT$';
        document.getElementById('product-isActive').checked = true;
    }
    
    modal.classList.remove('hidden');
}

function closeProductModal() {
    document.getElementById('product-modal').classList.add('hidden');
}

async function editProduct(id) {
    try {
        const res = await fetch(`${API_BASE}/products/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to load product');
        
        const product = await res.json();
        openProductModal(product);
    } catch (error) {
        alert('載入商品失敗: ' + error.message);
    }
}

async function handleSaveProduct(e) {
    e.preventDefault();
    
    const id = document.getElementById('product-id').value;
    const featuresText = document.getElementById('product-features').value;
    const features = featuresText.split('\n').map(f => f.trim()).filter(f => f.length > 0);
    
    const data = {
        gameId: parseInt(document.getElementById('product-gameId').value),
        name: document.getElementById('product-name').value,
        planType: document.getElementById('product-planType').value,
        price: parseFloat(document.getElementById('product-price').value),
        currency: document.getElementById('product-currency').value || 'NT$',
        duration: parseInt(document.getElementById('product-duration').value) || 24,
        description: document.getElementById('product-description').value || null,
        features,
        badge: document.getElementById('product-badge').value || null,
        sortOrder: parseInt(document.getElementById('product-sortOrder').value) || 0,
        isPopular: document.getElementById('product-isPopular').checked,
        isPremium: document.getElementById('product-isPremium').checked,
        isActive: document.getElementById('product-isActive').checked
    };
    
    try {
        const url = id ? `${API_BASE}/products/${id}` : `${API_BASE}/products`;
        const method = id ? 'PUT' : 'POST';
        
        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        
        const result = await res.json();
        
        if (!res.ok) {
            throw new Error(result.error || '保存失敗');
        }
        
        closeProductModal();
        loadProducts();
        alert(id ? '商品已更新！' : '商品已創建！');
    } catch (error) {
        alert(error.message);
    }
}

async function deleteProduct(id) {
    if (!confirm('確定要刪除此商品嗎？')) return;
    
    try {
        const res = await fetch(`${API_BASE}/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || '刪除失敗');
        }
        
        loadProducts();
    } catch (error) {
        alert(error.message);
    }
}

// Cards
async function loadCards(page = 1) {
    currentPage.cards = page;
    
    const status = document.getElementById('filter-card-status').value;
    const planType = document.getElementById('filter-card-plan').value;
    const gameId = document.getElementById('filter-card-game').value;
    
    try {
        let url = `${API_BASE}/cards?page=${page}&limit=20`;
        if (status) url += `&status=${status}`;
        if (planType) url += `&planType=${planType}`;
        if (gameId) url += `&gameId=${gameId}`;
        
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
                <td>${card.game?.name || '-'}</td>
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
    
    const gameId = document.getElementById('upload-gameId').value;
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
    
    const data = { planType, cardKeys };
    if (gameId) data.gameId = parseInt(gameId);
    
    try {
        const res = await fetch(`${API_BASE}/cards/upload`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        
        const result = await res.json();
        
        if (!res.ok) {
            throw new Error(result.error || '上傳失敗');
        }
        
        document.getElementById('upload-modal').classList.add('hidden');
        document.getElementById('upload-form').reset();
        
        alert(`成功上傳 ${result.count} 張卡密！`);
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

// Config
async function loadConfig() {
    try {
        const res = await fetch(`${API_BASE}/config`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to load config');
        
        const config = await res.json();
        
        // Fill global config form
        document.getElementById('config-siteName').value = config.siteName || '';
        document.getElementById('config-siteTagline').value = config.siteTagline || '';
        document.getElementById('config-heroTitle').value = config.heroTitle || '';
        document.getElementById('config-heroSubtitle').value = config.heroSubtitle || '';
        document.getElementById('config-discordUrl').value = config.discordUrl || '';
        document.getElementById('config-discordOnline').value = config.discordOnline || '';
        document.getElementById('config-discordMembers').value = config.discordMembers || '';
        document.getElementById('config-footerCopyright').value = config.footerCopyright || '';
        document.getElementById('config-footerDisclaimer').value = config.footerDisclaimer || '';
    } catch (error) {
        console.error('Load config error:', error);
    }
}

async function handleSaveGlobalConfig(e) {
    e.preventDefault();
    
    const configs = {
        siteName: document.getElementById('config-siteName').value,
        siteTagline: document.getElementById('config-siteTagline').value,
        heroTitle: document.getElementById('config-heroTitle').value,
        heroSubtitle: document.getElementById('config-heroSubtitle').value,
        discordUrl: document.getElementById('config-discordUrl').value,
        discordOnline: document.getElementById('config-discordOnline').value,
        discordMembers: document.getElementById('config-discordMembers').value,
        footerCopyright: document.getElementById('config-footerCopyright').value,
        footerDisclaimer: document.getElementById('config-footerDisclaimer').value
    };
    
    try {
        const res = await fetch(`${API_BASE}/config`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ configs })
        });
        
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || '保存失敗');
        }
        
        alert('配置已保存！');
    } catch (error) {
        alert(error.message);
    }
}

async function handleGameConfigSelect() {
    const gameId = document.getElementById('config-game-select').value;
    const form = document.getElementById('game-config-form');
    
    if (!gameId) {
        form.classList.add('hidden');
        return;
    }
    
    try {
        const res = await fetch(`${API_BASE}/config?gameId=${gameId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to load game config');
        
        const config = await res.json();
        
        document.getElementById('config-game-heroTitle').value = config.heroTitle || '';
        document.getElementById('config-game-heroSubtitle').value = config.heroSubtitle || '';
        document.getElementById('config-game-features').value = typeof config.features === 'string' 
            ? config.features 
            : JSON.stringify(config.features || [], null, 2);
        
        form.classList.remove('hidden');
    } catch (error) {
        console.error('Load game config error:', error);
    }
}

async function handleSaveGameConfig(e) {
    e.preventDefault();
    
    const gameId = document.getElementById('config-game-select').value;
    if (!gameId) return;
    
    let features;
    try {
        features = JSON.parse(document.getElementById('config-game-features').value || '[]');
    } catch {
        alert('功能介紹 JSON 格式錯誤');
        return;
    }
    
    const configs = {
        heroTitle: document.getElementById('config-game-heroTitle').value,
        heroSubtitle: document.getElementById('config-game-heroSubtitle').value,
        features
    };
    
    try {
        const res = await fetch(`${API_BASE}/config`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ configs, gameId: parseInt(gameId) })
        });
        
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || '保存失敗');
        }
        
        alert('遊戲配置已保存！');
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
window.editGame = editGame;
window.deleteGame = deleteGame;
window.closeGameModal = closeGameModal;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.closeProductModal = closeProductModal;
window.deleteCard = deleteCard;
window.updateOrderStatus = updateOrderStatus;
window.toggleUserRole = toggleUserRole;
window.copyToClipboard = copyToClipboard;
window.loadCards = loadCards;
window.loadOrders = loadOrders;
window.loadUsers = loadUsers;
