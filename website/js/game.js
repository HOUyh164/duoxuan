/**
 * 遊戲詳情頁 JavaScript - 終極修復版
 */

if (typeof API_BASE === 'undefined') {
    window.API_BASE = '/api';
}

let currentGame = null;
let currentProducts = [];

document.addEventListener('DOMContentLoaded', () => {
    console.log('--- Detail Page Init ---');
    loadGameData();
});

async function loadGameData() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');
    if (!slug) return;

    try {
        const gameRes = await fetch(`${API_BASE}/games/slug/${slug}`);
        if (!gameRes.ok) return;
        const game = await gameRes.json();
        currentGame = game;

        // 加載商品
        const prodRes = await fetch(`${API_BASE}/products?gameId=${game.id}&active=true`);
        currentProducts = prodRes.ok ? await prodRes.json() : (game.products || []);
        
        console.log('Products found:', currentProducts.length);

        updatePageUI(game);
        renderProducts(currentProducts);
        
        if (game.themeColor) {
            document.documentElement.style.setProperty('--accent-color', game.themeColor);
        }

    } catch (error) {
        console.error('Fatal error:', error);
    }
}

function updatePageUI(game) {
    document.title = `${game.name} - DORA`;
    const elements = {
        'game-name': game.name,
        'game-badge': `${game.name} 專用`,
        'hero-logo': game.name.charAt(0),
        'game-title-line': '征服戰場',
        'game-description': game.description || '專業遊戲輔助解決方案'
    };
    for (let id in elements) {
        const el = document.getElementById(id);
        if (el) el.textContent = elements[id];
    }
}

function renderProducts(products) {
    const grid = document.getElementById('pricing-grid');
    if (!grid) return;

    if (!products || products.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:50px;">暫無在售商品</div>';
        return;
    }

    grid.innerHTML = products.map(p => {
        // 核心修復：正確解析功能列表
        let finalFeatures = [];
        try {
            if (typeof p.features === 'string') {
                finalFeatures = JSON.parse(p.features);
            } else if (Array.isArray(p.features)) {
                finalFeatures = p.features;
            }
        } catch (e) {
            console.warn('Feature parse error:', e);
        }

        return `
            <div class="pricing-card ${p.isPopular ? 'pricing-popular' : ''}">
                ${p.badge ? `<div class="pricing-badge">${p.badge}</div>` : ''}
                <div class="pricing-header">
                    <h3 class="pricing-name">${p.name}</h3>
                    <div class="pricing-price">
                        <span class="price-currency">${p.currency || 'NT$'}</span>
                        <span class="price-amount">${p.price}</span>
                    </div>
                </div>
                <ul class="pricing-features">
                    ${finalFeatures.map(f => `<li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:8px;color:var(--accent-color)"><polyline points="20 6 9 17 4 12"/></svg>${f}</li>`).join('')}
                </ul>
                <button class="pricing-btn ${p.isPopular ? 'pricing-btn-primary' : ''}" onclick="handleBuyProduct(${p.id}, '${p.planType}')">
                    立即購買
                </button>
            </div>
        `;
    }).join('');
}

async function handleBuyProduct(id, plan) {
    const token = localStorage.getItem('doraToken');
    if (!token) {
        alert('請先登入');
        if (window.openAuthModal) window.openAuthModal();
        return;
    }
    try {
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ productId: id, planType: plan })
        });
        const data = await res.json();
        if (res.ok) window.location.href = `/payment.html?order=${data.order.id}`;
        else alert(data.error);
    } catch (e) { alert('下單失敗'); }
}

window.handleBuyProduct = handleBuyProduct;
