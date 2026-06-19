// ==================== CONFIG ====================

const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const SOUND_URLS = {
    notification: 'https://www.mediafire.com/file/70kx4llbefakldu/vinheta-ifood-2016-fabio-porchat-judite-curtinha.mp3/file'
};

// ==================== STATE ====================

const state = {
    currentUser: JSON.parse(localStorage.getItem('currentUser')) || null,
    currentScreen: 'login',
    restaurants: [],
    orders: [],
    messages: [],
    users: [],
    token: localStorage.getItem('token') || null
};

// ==================== SPLASH SCREEN ====================

window.addEventListener('load', () => {
    initSplashScreen();
});

function initSplashScreen() {
    const splashScreen = document.getElementById('splash-screen');
    
    // Play splash animation + sound
    playSplashSound();
    
    // Hide splash after animation
    setTimeout(() => {
        splashScreen.classList.add('hidden');
        if (state.currentUser) {
            showScreen('home');
        }
    }, 3000);
}

function playSplashSound() {
    // Som sintetizado com Web Audio API (crescendo + whoosh)
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioContext.currentTime;
    
    // Crescendo
    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();
    
    osc1.connect(gain1);
    gain1.connect(audioContext.destination);
    
    osc1.frequency.setValueAtTime(200, now);
    osc1.frequency.exponentialRampToValueAtTime(600, now + 1);
    
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.3, now + 1);
    gain1.gain.linearRampToValueAtTime(0, now + 1.2);
    
    osc1.start(now);
    osc1.stop(now + 1.2);
    
    // Whoosh (som agudo rápido)
    setTimeout(() => {
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        
        osc2.frequency.setValueAtTime(800, now + 1);
        osc2.frequency.exponentialRampToValueAtTime(1200, now + 1.3);
        
        gain2.gain.setValueAtTime(0.2, now + 1);
        gain2.gain.linearRampToValueAtTime(0, now + 1.3);
        
        osc2.start(now + 1);
        osc2.stop(now + 1.3);
    }, 1000);
}

// ==================== SCREEN MANAGEMENT ====================

function showScreen(screenName) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Close menu
    document.getElementById('sidebar-menu').classList.remove('open');
    
    // Show selected screen
    const screenId = `${screenName}-screen`;
    const screen = document.getElementById(screenId);
    
    if (screen) {
        screen.classList.add('active');
        state.currentScreen = screenName;
        
        // Load screen data
        if (screenName === 'home') loadHomeData();
        if (screenName === 'restaurants') loadRestaurants();
        if (screenName === 'orders') loadOrders();
        if (screenName === 'profile') loadProfile();
        if (screenName === 'chat') loadChat();
        if (screenName === 'admin') loadAdmin();
    }
}

// ==================== AUTH SCREENS ====================

function toggleAuth() {
    const loginScreen = document.getElementById('login-screen');
    const signupScreen = document.getElementById('signup-screen');
    
    loginScreen.classList.toggle('active');
    signupScreen.classList.toggle('active');
}

// LOGIN
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        if (response.ok) {
            const data = await response.json();
            
            state.currentUser = data.user;
            state.token = data.token;
            
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            localStorage.setItem('token', data.token);
            
            showNotification('Login realizado com sucesso!');
            playNotificationSound();
            showScreen('home');
        } else {
            showNotification('Email ou senha incorretos', 'error');
        }
    } catch (error) {
        showNotification('Erro ao fazer login', 'error');
        console.error(error);
    }
});

// SIGNUP
document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const phone = document.getElementById('signup-phone').value;
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm').value;
    
    if (password !== confirm) {
        showNotification('Senhas não conferem', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone, password })
        });
        
        if (response.ok) {
            const data = await response.json();
            
            state.currentUser = data.user;
            state.token = data.token;
            
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            localStorage.setItem('token', data.token);
            
            showNotification('Conta criada com sucesso!');
            playNotificationSound();
            showScreen('home');
        } else {
            showNotification('Erro ao criar conta', 'error');
        }
    } catch (error) {
        showNotification('Erro ao criar conta', 'error');
        console.error(error);
    }
});

document.getElementById('toggle-signup').addEventListener('click', toggleAuth);
document.getElementById('toggle-login').addEventListener('click', toggleAuth);
document.getElementById('link-signup').addEventListener('click', (e) => {
    e.preventDefault();
    toggleAuth();
});
document.getElementById('link-login').addEventListener('click', (e) => {
    e.preventDefault();
    toggleAuth();
});

// LOGOUT
document.getElementById('logout-btn').addEventListener('click', (e) => {
    e.preventDefault();
    state.currentUser = null;
    state.token = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    showScreen('login');
});

// ==================== MENU ====================

document.getElementById('menu-toggle').addEventListener('click', () => {
    document.getElementById('sidebar-menu').classList.add('open');
});

document.getElementById('menu-close').addEventListener('click', () => {
    document.getElementById('sidebar-menu').classList.remove('open');
});

document.querySelectorAll('.menu-list a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const screen = link.dataset.screen;
        if (screen) showScreen(screen);
        document.getElementById('sidebar-menu').classList.remove('open');
    });
});

// ==================== BACK BUTTONS ====================

document.getElementById('restaurants-back').addEventListener('click', () => showScreen('home'));
document.getElementById('orders-back').addEventListener('click', () => showScreen('home'));
document.getElementById('profile-back').addEventListener('click', () => showScreen('home'));
document.getElementById('chat-back').addEventListener('click', () => showScreen('home'));
document.getElementById('admin-back').addEventListener('click', () => showScreen('home'));

// ==================== HOME SCREEN ====================

function loadHomeData() {
    // Mock data
    const featured = [
        { id: 1, name: 'Burger King', emoji: '🍔' },
        { id: 2, name: 'Pizza Hut', emoji: '🍕' },
        { id: 3, name: 'KFC', emoji: '🍗' },
        { id: 4, name: 'Subway', emoji: '🥪' }
    ];
    
    const container = document.getElementById('featured-restaurants');
    container.innerHTML = featured.map(r => `
        <div class="restaurant-card" onclick="viewRestaurant(${r.id})">
            <div class="restaurant-image">${r.emoji}</div>
            <div class="restaurant-info">
                <h3>${r.name}</h3>
                <p>⭐ 4.5 (234 avaliações)</p>
            </div>
        </div>
    `).join('');
}

// ==================== RESTAURANTS ====================

function loadRestaurants() {
    const restaurants = [
        { id: 1, name: 'Burger King', emoji: '🍔', rating: 4.5 },
        { id: 2, name: 'Pizza Hut', emoji: '🍕', rating: 4.3 },
        { id: 3, name: 'KFC', emoji: '🍗', rating: 4.7 },
        { id: 4, name: 'Subway', emoji: '🥪', rating: 4.2 },
        { id: 5, name: 'McDonald\'s', emoji: '🍟', rating: 4.1 },
        { id: 6, name: 'Domino\'s', emoji: '🍕', rating: 4.6 }
    ];
    
    const container = document.getElementById('restaurants-list');
    container.innerHTML = restaurants.map(r => `
        <div class="restaurant-card" onclick="viewRestaurant(${r.id})">
            <div class="restaurant-image">${r.emoji}</div>
            <div class="restaurant-info">
                <h3>${r.name}</h3>
                <p>⭐ ${r.rating}</p>
            </div>
        </div>
    `).join('');
}

function viewRestaurant(id) {
    showNotification(`Abrindo restaurante ${id}...`);
}

// Search
document.getElementById('restaurants-search').addEventListener('input', (e) => {
    const search = e.target.value.toLowerCase();
    document.querySelectorAll('.restaurant-card').forEach(card => {
        const name = card.textContent.toLowerCase();
        card.style.display = name.includes(search) ? '' : 'none';
    });
});

// ==================== ORDERS ====================

function loadOrders() {
    const orders = [
        { id: 1, restaurant: 'Burger King', total: 'R$ 35,90', status: 'delivered', date: '20/06/2024' },
        { id: 2, restaurant: 'Pizza Hut', total: 'R$ 52,00', status: 'delivered', date: '19/06/2024' },
        { id: 3, restaurant: 'KFC', total: 'R$ 28,50', status: 'pending', date: '20/06/2024' }
    ];
    
    const container = document.getElementById('orders-list');
    container.innerHTML = orders.map(o => `
        <div class="order-item">
            <div class="order-item-info">
                <h3>${o.restaurant}</h3>
                <p>${o.date} • ${o.total}</p>
            </div>
            <span class="order-item-status status-${o.status}">
                ${o.status === 'delivered' ? '✓ Entregue' : '⏳ Pendente'}
            </span>
        </div>
    `).join('');
}

// ==================== PROFILE ====================

function loadProfile() {
    if (state.currentUser) {
        document.getElementById('profile-name').textContent = state.currentUser.name;
        document.getElementById('profile-email').textContent = state.currentUser.email;
        document.getElementById('profile-phone').textContent = state.currentUser.phone;
    }
}

document.getElementById('edit-profile-btn').addEventListener('click', () => {
    showNotification('Função em desenvolvimento');
});

// ==================== CHAT ====================

function loadChat() {
    const messagesContainer = document.getElementById('chat-messages');
    
    // Mock messages
    const mockMessages = [
        { text: 'Olá! Como posso ajudá-lo?', sent: false },
        { text: 'Qual o status do meu pedido?', sent: true },
        { text: 'Seu pedido está em preparo! Será entregue em 30 minutos.', sent: false }
    ];
    
    messagesContainer.innerHTML = mockMessages.map(m => `
        <div class="chat-message ${m.sent ? 'sent' : 'received'}">
            <div class="chat-bubble">${m.text}</div>
        </div>
    `).join('');
    
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

document.getElementById('chat-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (message) {
        const messagesContainer = document.getElementById('chat-messages');
        
        const userMessage = document.createElement('div');
        userMessage.className = 'chat-message sent';
        userMessage.innerHTML = `<div class="chat-bubble">${message}</div>`;
        messagesContainer.appendChild(userMessage);
        
        input.value = '';
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        playNotificationSound();
        
        // Mock response
        setTimeout(() => {
            const botMessage = document.createElement('div');
            botMessage.className = 'chat-message received';
            botMessage.innerHTML = `<div class="chat-bubble">Obrigado pelo seu contato! Estamos analisando sua mensagem.</div>`;
            messagesContainer.appendChild(botMessage);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            playNotificationSound();
        }, 1000);
    }
});

// ==================== ADMIN ====================

// Show admin menu only for admins
if (state.currentUser && state.currentUser.isAdmin) {
    document.getElementById('admin-link').style.display = 'block';
}

function loadAdmin() {
    loadAdminUsers();
    loadAdminRestaurants();
    loadAdminOrders();
}

function loadAdminUsers() {
    const users = [
        { id: 1, name: 'João Silva', email: 'joao@email.com', orders: 5 },
        { id: 2, name: 'Maria Santos', email: 'maria@email.com', orders: 3 },
        { id: 3, name: 'Pedro Costa', email: 'pedro@email.com', orders: 8 }
    ];
    
    const container = document.getElementById('users-list');
    container.innerHTML = users.map(u => `
        <div class="admin-item">
            <div class="admin-item-info">
                <h3>${u.name}</h3>
                <p>${u.email} • ${u.orders} pedidos</p>
            </div>
            <div class="admin-actions">
                <button class="admin-btn" onclick="editAdminItem('user', ${u.id})">Editar</button>
                <button class="admin-btn admin-btn-delete" onclick="deleteAdminItem('user', ${u.id})">Deletar</button>
            </div>
        </div>
    `).join('');
}

function loadAdminRestaurants() {
    const restaurants = [
        { id: 1, name: 'Burger King', category: 'Fast Food', active: true },
        { id: 2, name: 'Pizza Hut', category: 'Pizzaria', active: true },
        { id: 3, name: 'KFC', category: 'Frango', active: false }
    ];
    
    const container = document.getElementById('restaurants-admin-list');
    container.innerHTML = restaurants.map(r => `
        <div class="admin-item">
            <div class="admin-item-info">
                <h3>${r.name}</h3>
                <p>${r.category} • ${r.active ? '✓ Ativo' : '✗ Inativo'}</p>
            </div>
            <div class="admin-actions">
                <button class="admin-btn" onclick="editAdminItem('restaurant', ${r.id})">Editar</button>
                <button class="admin-btn admin-btn-delete" onclick="deleteAdminItem('restaurant', ${r.id})">Deletar</button>
            </div>
        </div>
    `).join('');
}

function loadAdminOrders() {
    const orders = [
        { id: 1, user: 'João Silva', restaurant: 'Burger King', total: 'R$ 35,90', status: 'delivered' },
        { id: 2, user: 'Maria Santos', restaurant: 'Pizza Hut', total: 'R$ 52,00', status: 'confirmed' },
        { id: 3, user: 'Pedro Costa', restaurant: 'KFC', total: 'R$ 28,50', status: 'pending' }
    ];
    
    const container = document.getElementById('orders-admin-list');
    container.innerHTML = orders.map(o => `
        <div class="admin-item">
            <div class="admin-item-info">
                <h3>#${o.id} - ${o.user}</h3>
                <p>${o.restaurant} • ${o.total} • ${o.status}</p>
            </div>
            <div class="admin-actions">
                <button class="admin-btn" onclick="editAdminItem('order', ${o.id})">Ver</button>
            </div>
        </div>
    `).join('');
}

document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.admin-content').forEach(c => c.classList.remove('active'));
        
        tab.classList.add('active');
        document.getElementById(`admin-${tab.dataset.tab}`).classList.add('active');
    });
});

function editAdminItem(type, id) {
    showNotification(`Editando ${type} ${id}...`);
}

function deleteAdminItem(type, id) {
    if (confirm(`Tem certeza que deseja deletar este ${type}?`)) {
        showNotification(`${type} deletado com sucesso!`);
    }
}

// ==================== NOTIFICATIONS ====================

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification show ${type}`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function playNotificationSound() {
    const audio = new Audio(SOUND_URLS.notification);
    audio.play().catch(e => console.log('Som não reproduzido:', e));
}

// ==================== PWA ====================

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(e => console.log('SW error:', e));
}

// ==================== INITIALIZE ====================

window.addEventListener('DOMContentLoaded', () => {
    if (state.currentUser) {
        // Hidden splash, show home after 3s anyway
        setTimeout(() => {
            showScreen('home');
        }, 3000);
    }
});

// Check if user is logged in
if (!state.currentUser && state.currentScreen !== 'login') {
    showScreen('login');
}
