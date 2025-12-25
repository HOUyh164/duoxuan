/**
 * DORA 官網 JavaScript
 * 導航、動畫、交互效果
 */

document.addEventListener('DOMContentLoaded', () => {
    // 初始化
    initNavbar();
    initMobileMenu();
    initSmoothScroll();
    initScrollAnimations();
    initActiveNavLink();
});

/**
 * 導航欄滾動效果
 */
function initNavbar() {
    const navbar = document.getElementById('navbar');
    let lastScrollY = 0;
    
    const handleScroll = () => {
        const currentScrollY = window.scrollY;
        
        // 添加/移除滾動樣式
        if (currentScrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        lastScrollY = currentScrollY;
    };
    
    // 節流處理
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                handleScroll();
                ticking = false;
            });
            ticking = true;
        }
    });
    
    // 初始檢查
    handleScroll();
}

/**
 * 手機選單
 */
function initMobileMenu() {
    const toggle = document.getElementById('nav-toggle');
    const menu = document.getElementById('nav-menu');
    const links = menu.querySelectorAll('.nav-link');
    
    // 切換選單
    toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
        menu.classList.toggle('active');
        document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : '';
    });
    
    // 點擊連結關閉選單
    links.forEach(link => {
        link.addEventListener('click', () => {
            toggle.classList.remove('active');
            menu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
    
    // 點擊外部關閉選單
    document.addEventListener('click', (e) => {
        if (menu.classList.contains('active') && 
            !menu.contains(e.target) && 
            !toggle.contains(e.target)) {
            toggle.classList.remove('active');
            menu.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

/**
 * 平滑滾動
 */
function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href === '#') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                
                const navbarHeight = document.getElementById('navbar').offsetHeight;
                const targetPosition = target.getBoundingClientRect().top + window.scrollY - navbarHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/**
 * 滾動動畫 - Intersection Observer
 */
function initScrollAnimations() {
    // 需要動畫的元素
    const animatedElements = document.querySelectorAll(
        '.feature-card, .pricing-card, .step, .section-header, .download-cta'
    );
    
    // 添加初始類
    animatedElements.forEach(el => {
        el.classList.add('fade-in-up');
    });
    
    // 創建 Observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // 添加延遲以實現錯落效果
                const delay = entry.target.dataset.delay || 0;
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, delay);
                
                // 只觸發一次
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    // 為卡片添加延遲
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
        card.dataset.delay = index * 100;
    });
    
    const pricingCards = document.querySelectorAll('.pricing-card');
    pricingCards.forEach((card, index) => {
        card.dataset.delay = index * 100;
    });
    
    const steps = document.querySelectorAll('.step');
    steps.forEach((step, index) => {
        step.dataset.delay = index * 150;
    });
    
    // 開始觀察
    animatedElements.forEach(el => observer.observe(el));
}

/**
 * 當前頁面導航高亮
 */
function initActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    const handleScroll = () => {
        const scrollY = window.scrollY;
        const navbarHeight = document.getElementById('navbar').offsetHeight;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - navbarHeight - 100;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    };
    
    // 節流處理
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                handleScroll();
                ticking = false;
            });
            ticking = true;
        }
    });
    
    // 初始檢查
    handleScroll();
}

/**
 * 數字計數動畫
 */
function animateNumbers() {
    const numbers = document.querySelectorAll('.stat-number');
    
    numbers.forEach(number => {
        const text = number.textContent;
        const hasPlus = text.includes('+');
        const hasPercent = text.includes('%');
        const cleanNumber = parseFloat(text.replace(/[^0-9.]/g, ''));
        
        if (isNaN(cleanNumber)) return;
        
        let current = 0;
        const increment = cleanNumber / 50;
        const duration = 1500;
        const stepTime = duration / 50;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= cleanNumber) {
                current = cleanNumber;
                clearInterval(timer);
            }
            
            let displayValue = current % 1 === 0 ? Math.floor(current) : current.toFixed(1);
            if (hasPercent) displayValue += '%';
            if (hasPlus) displayValue += '+';
            
            number.textContent = displayValue;
        }, stepTime);
    });
}

/**
 * 粒子效果背景 (可選)
 */
function createParticles() {
    const container = document.createElement('div');
    container.className = 'particles';
    document.body.appendChild(container);
    
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.cssText = `
            left: ${Math.random() * 100}%;
            animation-delay: ${Math.random() * 5}s;
            animation-duration: ${5 + Math.random() * 10}s;
        `;
        container.appendChild(particle);
    }
}

/**
 * 打字機效果
 */
function typeWriter(element, text, speed = 50) {
    let i = 0;
    element.textContent = '';
    
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

/**
 * 複製文字到剪貼簿
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Failed to copy:', err);
        return false;
    }
}

/**
 * 顯示提示訊息
 */
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#22c55e' : '#ef4444'};
        color: white;
        border-radius: 8px;
        font-size: 0.95rem;
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// CSS 動畫
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

/* ================================================
   用戶認證系統
   ================================================ */

// API 基礎路徑
const API_BASE = '/api';

// 用戶狀態
let currentUser = null;
let authToken = localStorage.getItem('doraToken');

// 初始化認證
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
});

/**
 * 初始化認證系統
 */
function initAuth() {
    // DOM 元素
    const userBtn = document.getElementById('user-btn');
    const userBtnText = document.getElementById('user-btn-text');
    const authModal = document.getElementById('auth-modal');
    const userModal = document.getElementById('user-modal');
    const authModalClose = document.getElementById('auth-modal-close');
    const userModalClose = document.getElementById('user-modal-close');
    
    // 表單
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const redeemForm = document.getElementById('redeem-form');
    
    // 切換表單
    const showRegister = document.getElementById('show-register');
    const showLogin = document.getElementById('show-login');
    
    // 登出
    const logoutBtn = document.getElementById('logout-btn');
    
    // 標籤頁
    const userTabs = document.querySelectorAll('.user-tab');
    
    // 檢查已有 token
    if (authToken) {
        checkAuth();
    }
    
    // 用戶按鈕點擊
    userBtn.addEventListener('click', () => {
        if (currentUser) {
            // 已登入 - 打開用戶中心
            openUserModal();
        } else {
            // 未登入 - 打開登入彈窗
            openAuthModal();
        }
    });
    
    // 關閉彈窗
    authModalClose.addEventListener('click', closeAuthModal);
    userModalClose.addEventListener('click', closeUserModal);
    
    // 點擊遮罩關閉
    authModal.querySelector('.auth-modal-overlay').addEventListener('click', closeAuthModal);
    userModal.querySelector('.user-modal-overlay').addEventListener('click', closeUserModal);
    
    // 切換登入/註冊
    showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('login-form-container').classList.add('hidden');
        document.getElementById('register-form-container').classList.remove('hidden');
    });
    
    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('register-form-container').classList.add('hidden');
        document.getElementById('login-form-container').classList.remove('hidden');
    });
    
    // 登入表單
    loginForm.addEventListener('submit', handleLogin);
    
    // 註冊表單
    registerForm.addEventListener('submit', handleRegister);
    
    // 兌換表單
    redeemForm.addEventListener('submit', handleRedeem);
    
    // 登出
    logoutBtn.addEventListener('click', handleLogout);
    
    // 標籤頁切換
    userTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            
            // 更新標籤狀態
            userTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // 顯示對應內容
            document.querySelectorAll('.user-tab-content').forEach(content => {
                content.classList.add('hidden');
            });
            document.getElementById(`tab-${tabName}`).classList.remove('hidden');
            
            // 如果是訂單標籤，載入訂單
            if (tabName === 'orders') {
                loadOrders();
            }
        });
    });
}

/**
 * 檢查認證狀態
 */
async function checkAuth() {
    try {
        const res = await fetch(`${API_BASE}/auth/me`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!res.ok) throw new Error('Unauthorized');
        
        const data = await res.json();
        currentUser = data.user;
        updateUserUI();
    } catch (error) {
        // Token 無效
        localStorage.removeItem('doraToken');
        authToken = null;
        currentUser = null;
    }
}

/**
 * 更新用戶 UI
 */
function updateUserUI() {
    const userBtn = document.getElementById('user-btn');
    const userBtnText = document.getElementById('user-btn-text');
    
    if (currentUser) {
        userBtn.classList.add('logged-in');
        userBtnText.textContent = '會員中心';
        
        // 更新用戶中心信息
        document.getElementById('user-email-display').textContent = currentUser.email;
        document.getElementById('user-role-display').textContent = 
            currentUser.role === 'admin' ? '管理員' : '會員';
    } else {
        userBtn.classList.remove('logged-in');
        userBtnText.textContent = '登入';
    }
}

/**
 * 打開認證彈窗
 */
function openAuthModal() {
    const modal = document.getElementById('auth-modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // 重置表單
    document.getElementById('login-form').reset();
    document.getElementById('register-form').reset();
    document.getElementById('login-error').textContent = '';
    document.getElementById('register-error').textContent = '';
    
    // 顯示登入表單
    document.getElementById('login-form-container').classList.remove('hidden');
    document.getElementById('register-form-container').classList.add('hidden');
}

/**
 * 關閉認證彈窗
 */
function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

/**
 * 打開用戶中心
 */
function openUserModal() {
    const modal = document.getElementById('user-modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // 重置兌換表單
    document.getElementById('redeem-form').reset();
    document.getElementById('redeem-error').textContent = '';
    document.getElementById('redeem-success').textContent = '';
    
    // 載入訂單
    loadOrders();
}

/**
 * 關閉用戶中心
 */
function closeUserModal() {
    const modal = document.getElementById('user-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

/**
 * 處理登入
 */
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    errorEl.textContent = '';
    submitBtn.disabled = true;
    submitBtn.textContent = '登入中...';
    
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
        
        // 保存 token
        authToken = data.token;
        localStorage.setItem('doraToken', authToken);
        currentUser = data.user;
        
        updateUserUI();
        closeAuthModal();
        showToast('登入成功！', 'success');
        
    } catch (error) {
        errorEl.textContent = error.message;
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '登入';
    }
}

/**
 * 處理註冊
 */
async function handleRegister(e) {
    e.preventDefault();
    
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;
    const errorEl = document.getElementById('register-error');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    errorEl.textContent = '';
    
    // 驗證密碼
    if (password !== confirm) {
        errorEl.textContent = '兩次輸入的密碼不一致';
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = '註冊中...';
    
    try {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.error || '註冊失敗');
        }
        
        // 保存 token
        authToken = data.token;
        localStorage.setItem('doraToken', authToken);
        currentUser = data.user;
        
        updateUserUI();
        closeAuthModal();
        showToast('註冊成功！歡迎加入 DORA！', 'success');
        
    } catch (error) {
        errorEl.textContent = error.message;
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '註冊';
    }
}

/**
 * 處理卡密兌換
 */
async function handleRedeem(e) {
    e.preventDefault();
    
    const cardKey = document.getElementById('card-key').value.trim().toUpperCase();
    const errorEl = document.getElementById('redeem-error');
    const successEl = document.getElementById('redeem-success');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    errorEl.textContent = '';
    successEl.textContent = '';
    submitBtn.disabled = true;
    submitBtn.textContent = '兌換中...';
    
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
        
        if (!res.ok) {
            throw new Error(data.error || '兌換失敗');
        }
        
        // 顯示成功信息
        const planLabels = {
            day: '天卡',
            week: '周卡',
            month: '月卡',
            lifetime: '永久卡'
        };
        successEl.textContent = `🎉 兌換成功！您已獲得 ${planLabels[data.planType]}！`;
        document.getElementById('redeem-form').reset();
        
        // 重新載入訂單
        loadOrders();
        
    } catch (error) {
        errorEl.textContent = error.message;
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '兌換';
    }
}

/**
 * 載入訂單
 */
async function loadOrders() {
    const ordersList = document.getElementById('orders-list');
    ordersList.innerHTML = '<p class="no-orders">載入中...</p>';
    
    try {
        const res = await fetch(`${API_BASE}/orders`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!res.ok) throw new Error('Failed to load orders');
        
        const data = await res.json();
        
        if (data.orders.length === 0) {
            ordersList.innerHTML = '<p class="no-orders">暫無訂單記錄</p>';
            return;
        }
        
        const planLabels = {
            day: '天卡',
            week: '周卡',
            month: '月卡',
            lifetime: '永久卡'
        };
        
        const statusLabels = {
            pending: '待付款',
            paid: '已完成',
            cancelled: '已取消',
            refunded: '已退款'
        };
        
        ordersList.innerHTML = data.orders.map(order => {
            // 檢查是否有卡密
            const hasCard = order.cards && order.cards.length > 0;
            const cardKey = hasCard ? order.cards[0].cardKey : null;
            
            return `
                <div class="order-item ${hasCard ? 'has-card' : ''}">
                    <div class="order-info">
                        <span class="order-plan">${planLabels[order.planType]}</span>
                        <span class="order-date">${formatDate(order.createdAt)}</span>
                        ${hasCard ? `
                            <div class="order-card-key">
                                <span class="card-key-text">${cardKey}</span>
                                <button class="card-copy-btn" onclick="copyCardKey('${cardKey}', this)">複製</button>
                            </div>
                        ` : ''}
                        ${order.status === 'pending' ? `
                            <button class="order-pay-btn" onclick="goToPay(${order.id})">去支付</button>
                        ` : ''}
                    </div>
                    <span class="order-status ${order.status}">${statusLabels[order.status]}</span>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        ordersList.innerHTML = '<p class="no-orders">載入失敗，請稍後再試</p>';
    }
}

/**
 * 複製卡密
 */
function copyCardKey(cardKey, btn) {
    navigator.clipboard.writeText(cardKey).then(() => {
        const originalText = btn.textContent;
        btn.textContent = '已複製！';
        btn.classList.add('copied');
        setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove('copied');
        }, 2000);
    });
}

/**
 * 跳轉到支付頁面
 */
function goToPay(orderId) {
    window.location.href = `/payment.html?order=${orderId}`;
}

// 將函數暴露到全局
window.copyCardKey = copyCardKey;
window.goToPay = goToPay;

/**
 * 處理登出
 */
function handleLogout() {
    localStorage.removeItem('doraToken');
    authToken = null;
    currentUser = null;
    updateUserUI();
    closeUserModal();
    showToast('已登出', 'success');
}

/**
 * 格式化日期
 */
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

/**
 * 處理購買
 * @param {string} planType - 方案類型 (day, week, month, lifetime)
 */
async function handleBuy(planType) {
    // 檢查登入狀態
    if (!currentUser || !authToken) {
        showToast('請先登入後再購買', 'error');
        openAuthModal();
        return;
    }
    
    // 方案名稱
    const planLabels = {
        day: '天卡',
        week: '周卡',
        month: '月卡',
        lifetime: '永久卡'
    };
    
    // 確認購買
    if (!confirm(`確定要購買 ${planLabels[planType]} 嗎？`)) {
        return;
    }
    
    try {
        // 創建訂單
        const res = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ planType })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.error || '創建訂單失敗');
        }
        
        // 跳轉到支付頁面
        window.location.href = `/payment.html?order=${data.order.id}`;
        
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// 將 handleBuy 暴露到全局
window.handleBuy = handleBuy;




