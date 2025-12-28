/**
 * DORA 官網 JavaScript
 * 導航、動畫、交互效果
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. 初始化基礎組件 (增加防錯檢查)
    initNavbar();
    initMobileMenu();
    initSmoothScroll();
    initScrollAnimations();
    initActiveNavLink();
    
    // 2. 加載動態內容 (首頁/門戶頁)
    const gamesGrid = document.getElementById('games-grid');
    if (gamesGrid) {
        loadGames();
        loadSiteConfig();
    }

    // 3. 初始化認證系統
    initAuth();
});

/**
 * 導航欄滾動效果
 */
function initNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    
    const handleScroll = () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
}

/**
 * 手機選單
 */
function initMobileMenu() {
    const toggle = document.getElementById('nav-toggle');
    const menu = document.getElementById('nav-menu');
    if (!toggle || !menu) return;
    
    const links = menu.querySelectorAll('.nav-link');
    
    toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
        menu.classList.toggle('active');
        document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : '';
    });
    
    links.forEach(link => {
        link.addEventListener('click', () => {
            toggle.classList.remove('active');
            menu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
}

/**
 * 平滑滾動
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href === '#' || !href.startsWith('#')) return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const navbar = document.getElementById('navbar');
                const offset = navbar ? navbar.offsetHeight : 0;
                const top = target.getBoundingClientRect().top + window.scrollY - offset;
                
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });
}

/**
 * 滾動動畫
 */
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = entry.target.dataset.delay || 0;
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, delay);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    const elements = document.querySelectorAll('.feature-card, .pricing-card, .step, .section-header, .game-card, .fade-in-up');
    elements.forEach((el, index) => {
        if (!el.dataset.delay) el.dataset.delay = (index % 3) * 100;
        observer.observe(el);
    });
}

/**
 * 當前頁面導航高亮
 */
function initActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    const navbar = document.getElementById('navbar');
    if (!navbar || navLinks.length === 0) return;
    
    const handleScroll = () => {
        const scrollY = window.scrollY;
        const offset = navbar.offsetHeight + 100;
        
        sections.forEach(section => {
            const top = section.offsetTop - offset;
            const bottom = top + section.offsetHeight;
            const id = section.getAttribute('id');
            
            if (scrollY >= top && scrollY < bottom) {
                navLinks.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
                });
            }
        });
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
}

/* ================================================
   用戶認證系統
   ================================================ */

const API_BASE = '/api';
let currentUser = null;
let authToken = localStorage.getItem('doraToken');

function initAuth() {
    const userBtn = document.getElementById('user-btn');
    if (!userBtn) return;

    if (authToken) checkAuth();
    
    userBtn.addEventListener('click', () => {
        if (currentUser) openUserModal();
        else openAuthModal();
    });
    
    // 設置關閉按鈕
    document.querySelectorAll('.auth-modal-close, .user-modal-close, .auth-modal-overlay, .user-modal-overlay').forEach(el => {
        el.addEventListener('click', () => {
            document.querySelectorAll('.auth-modal, .user-modal').forEach(m => m.classList.remove('active'));
            document.body.style.overflow = '';
        });
    });

    // 表單切換
    const showRegister = document.getElementById('show-register');
    const showLogin = document.getElementById('show-login');
    if (showRegister) {
        showRegister.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('login-form-container').classList.add('hidden');
            document.getElementById('register-form-container').classList.remove('hidden');
        });
    }
    if (showLogin) {
        showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('register-form-container').classList.add('hidden');
            document.getElementById('login-form-container').classList.remove('hidden');
        });
    }

    // 表單提交
    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    
    const registerForm = document.getElementById('register-form');
    if (registerForm) registerForm.addEventListener('submit', handleRegister);
    
    const redeemForm = document.getElementById('redeem-form');
    if (redeemForm) redeemForm.addEventListener('submit', handleRedeem);
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    // 標籤切換
    document.querySelectorAll('.user-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.user-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.user-tab-content').forEach(c => c.classList.add('hidden'));
            document.getElementById(`tab-${tab.dataset.tab}`).classList.remove('hidden');
            if (tab.dataset.tab === 'orders') loadOrders();
        });
    });
}

async function checkAuth() {
    try {
        const res = await fetch(`${API_BASE}/auth/me`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        currentUser = data.user;
        updateUserUI();
    } catch {
        localStorage.removeItem('doraToken');
        authToken = null;
    }
}

function updateUserUI() {
    const btnText = document.getElementById('user-btn-text');
    if (btnText) btnText.textContent = currentUser ? '會員中心' : '登入';
    
    if (currentUser) {
        const emailDisp = document.getElementById('user-email-display');
        if (emailDisp) emailDisp.textContent = currentUser.email;
        const roleDisp = document.getElementById('user-role-display');
        if (roleDisp) roleDisp.textContent = currentUser.role === 'admin' ? '管理員' : '會員';
    }
}

function openAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function openUserModal() {
    const modal = document.getElementById('user-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        loadOrders();
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    
    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        
        authToken = data.token;
        localStorage.setItem('doraToken', authToken);
        currentUser = data.user;
        updateUserUI();
        document.getElementById('auth-modal').classList.remove('active');
        document.body.style.overflow = '';
        showToast('登入成功！');
    } catch (err) {
        errorEl.textContent = err.message;
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;
    const errorEl = document.getElementById('register-error');
    
    if (password !== confirm) {
        errorEl.textContent = '密碼不一致';
        return;
    }
    
    try {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        
        authToken = data.token;
        localStorage.setItem('doraToken', authToken);
        currentUser = data.user;
        updateUserUI();
        document.getElementById('auth-modal').classList.remove('active');
        document.body.style.overflow = '';
        showToast('註冊成功！');
    } catch (err) {
        errorEl.textContent = err.message;
    }
}

async function handleRedeem(e) {
    e.preventDefault();
    const cardKey = document.getElementById('card-key').value.trim();
    const errorEl = document.getElementById('redeem-error');
    const successEl = document.getElementById('redeem-success');
    
    try {
        const res = await fetch(`${API_BASE}/cards/redeem`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ cardKey })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        
        successEl.textContent = '兌換成功！';
        errorEl.textContent = '';
        loadOrders();
    } catch (err) {
        errorEl.textContent = err.message;
        successEl.textContent = '';
    }
}

async function loadOrders() {
    const list = document.getElementById('orders-list');
    if (!list) return;
    
    try {
        const res = await fetch(`${API_BASE}/orders`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await res.json();
        if (data.orders.length === 0) {
            list.innerHTML = '<p class="no-orders">暫無訂單</p>';
            return;
        }
        list.innerHTML = data.orders.map(o => `
            <div class="order-item">
                <div>
                    <strong>${o.planType}</strong><br>
                    <small>${new Date(o.createdAt).toLocaleDateString()}</small>
                </div>
                <div class="order-status ${o.status}">${o.status}</div>
            </div>
        `).join('');
    } catch {
        list.innerHTML = '加載失敗';
    }
}

function handleLogout() {
    localStorage.removeItem('doraToken');
    authToken = null;
    currentUser = null;
    updateUserUI();
    document.getElementById('user-modal').classList.remove('active');
    document.body.style.overflow = '';
}

/* ================================================
   內容加載邏輯
   ================================================ */

async function loadGames() {
    const grid = document.getElementById('games-grid');
    if (!grid) return;
    
    try {
        const res = await fetch(`${API_BASE}/games?active=true`);
        const games = await res.json();
        
        if (games.length === 0) {
            grid.innerHTML = '<div class="no-games">請在後台添加遊戲</div>';
            return;
        }
        
        grid.innerHTML = games.map(g => `
            <a href="game.html?slug=${g.slug}" class="game-card" style="--theme-color: ${g.themeColor || '#a855f7'}">
                <div class="game-card-bg">
                    ${g.coverImage ? `<img src="${g.coverImage}" alt="${g.name}">` : ''}
                </div>
                <div class="game-card-content">
                    <h3 class="game-card-title">${g.name}</h3>
                    <p class="game-card-desc">${g.description || ''}</p>
                    <div class="game-card-arrow">→</div>
                </div>
            </a>
        `).join('');
        
        initScrollAnimations();
    } catch (err) {
        grid.innerHTML = '加載失敗';
    }
}

async function loadSiteConfig() {
    try {
        const res = await fetch(`${API_BASE}/config`);
        const config = await res.json();
        
        if (config.siteName) {
            const logo = document.getElementById('portal-logo');
            if (logo) logo.textContent = config.siteName;
        }
        // ... 其他配置更新
    } catch {}
}

function showToast(msg) {
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#22c55e;color:white;padding:10px 20px;border-radius:5px;z-index:9999;';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

window.loadGames = loadGames;
window.loadSiteConfig = loadSiteConfig;
