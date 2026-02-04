// ============================================
// AJAB FLOUR DIGITAL HUB - FRONTEND JAVASCRIPT
// ============================================

// API Configuration
const API_BASE_URL ='https://ajab-flour-hub.onrender.com'; // Production

// DOM Elements
const elements = {
    // Navigation
    navLinks: document.getElementById('navLinks'),
    hamburger: document.getElementById('hamburger'),
    loginBtn: document.getElementById('loginBtn'),
    registerBtn: document.getElementById('registerBtn'),
    
    // Modals
    loginModal: document.getElementById('loginModal'),
    registerModal: document.getElementById('registerModal'),
    closeModals: document.querySelectorAll('.close-modal'),
    
    // Forms
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    orderForm: document.getElementById('orderForm'),
    
    // Product Section
    productGrid: document.getElementById('productGrid'),
    filterBtns: document.querySelectorAll('.filter-btn'),
    
    // Chatbot
    chatbotWidget: document.getElementById('chatbotWidget'),
    toggleChatbot: document.getElementById('toggleChatbot'),
    closeChatbot: document.getElementById('closeChatbot'),
    chatbotInput: document.getElementById('chatbotInput'),
    sendChatbot: document.getElementById('sendChatbot'),
    chatbotMessages: document.getElementById('chatbotMessages'),
    
    // Alerts
    alert: document.getElementById('alert'),
    alertMessage: document.getElementById('alertMessage'),
    alertClose: document.querySelector('.alert-close'),
    
    // Modal switchers
    switchToRegister: document.getElementById('switchToRegister'),
    switchToLogin: document.getElementById('switchToLogin')
};

// Application State
const state = {
    currentUser: JSON.parse(localStorage.getItem('currentUser')) || null,
    products: [],
    currentFilter: 'all',
    chatHistory: [],
    apiBaseUrl: API_BASE_URL
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    try {
        // Setup event listeners
        setupEventListeners();
        
        // Load initial data
        await loadProducts();
        await loadCountries();
        
        // Update UI based on user state
        updateUIForUser();
        
        // Initialize chatbot
        initializeChatbot();
        
        // Show welcome message
        setTimeout(() => {
            showAlert('Welcome to Ajab Flour Digital Hub!', 'info');
        }, 1000);
        
    } catch (error) {
        console.error('Initialization error:', error);
        showAlert('Failed to initialize application. Please refresh the page.', 'error');
    }
}

// ============================================
// EVENT LISTENERS SETUP
// ============================================
function setupEventListeners() {
    // Navigation
    elements.hamburger?.addEventListener('click', toggleMobileMenu);
    elements.loginBtn?.addEventListener('click', () => showModal(elements.loginModal));
    elements.registerBtn?.addEventListener('click', () => showModal(elements.registerModal));
    
    // Modal controls
    elements.closeModals.forEach(btn => {
        btn.addEventListener('click', () => {
            hideModal(elements.loginModal);
            hideModal(elements.registerModal);
        });
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === elements.loginModal) hideModal(elements.loginModal);
        if (e.target === elements.registerModal) hideModal(elements.registerModal);
    });
    
    // Form submissions
    elements.loginForm?.addEventListener('submit', handleLogin);
    elements.registerForm?.addEventListener('submit', handleRegister);
    elements.orderForm?.addEventListener('submit', handleOrderSubmit);
    
    // Modal switchers
    elements.switchToRegister?.addEventListener('click', (e) => {
        e.preventDefault();
        hideModal(elements.loginModal);
        showModal(elements.registerModal);
    });
    
    elements.switchToLogin?.addEventListener('click', (e) => {
        e.preventDefault();
        hideModal(elements.registerModal);
        showModal(elements.loginModal);
    });
    
    // Product filters
    elements.filterBtns?.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.currentFilter = btn.dataset.filter;
            filterProducts();
        });
    });
    
    // Chatbot
    elements.toggleChatbot?.addEventListener('click', toggleChatbot);
    elements.closeChatbot?.addEventListener('click', () => {
        elements.chatbotWidget.classList.remove('active');
    });
    
    elements.sendChatbot?.addEventListener('click', sendChatMessage);
    elements.chatbotInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });
    
    // Alert close button
    elements.alertClose?.addEventListener('click', () => {
        elements.alert.classList.remove('active');
    });
    
    // Close alert after 5 seconds
    setInterval(() => {
        if (elements.alert.classList.contains('active')) {
            elements.alert.classList.remove('active');
        }
    }, 5000);
}

// ============================================
// MODAL FUNCTIONS
// ============================================
function showModal(modal) {
    if (!modal) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function hideModal(modal) {
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    
    // Reset forms
    if (modal === elements.loginModal) {
        elements.loginForm?.reset();
    } else if (modal === elements.registerModal) {
        elements.registerForm?.reset();
    }
}

// ============================================
// MOBILE MENU
// ============================================
function toggleMobileMenu() {
    elements.navLinks.classList.toggle('active');
}

// ============================================
// ALERT SYSTEM
// ============================================
function showAlert(message, type = 'success') {
    if (!elements.alert || !elements.alertMessage) return;
    
    elements.alertMessage.textContent = message;
    elements.alert.className = `alert ${type} active`;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        elements.alert.classList.remove('active');
    }, 5000);
}

// ============================================
// PRODUCT FUNCTIONS
// ============================================
async function loadProducts() {
    try {
        showLoadingState('productGrid', 'Loading products...');
        
        const response = await fetch(`${state.apiBaseUrl}/api/products`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            state.products = data.products;
            renderProducts();
        } else {
            throw new Error(data.error || 'Failed to load products');
        }
        
    } catch (error) {
        console.error('Error loading products:', error);
        showAlert('Failed to load products. Using demo data.', 'warning');
        loadSampleProducts(); // Fallback to sample data
    }
}

function loadSampleProducts() {
    state.products = [
        {
            id: 1,
            name: "Ajab Fortified Maize Flour",
            description: "Perfect for soft, delicious ugali. Fortified with Vitamin A, Iron, and Zinc.",
            category: "maize_flour",
            weight: "2kg, 5kg, 25kg",
            price: 250,
            stock_quantity: 1000,
            image_url: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300&q=80",
            is_featured: true
        },
        {
            id: 2,
            name: "Ajab Millet Flour",
            description: "Gluten-free, high-fiber flour perfect for chapatis and porridge.",
            category: "millet_flour",
            weight: "1kg, 2kg, 10kg",
            price: 320,
            stock_quantity: 800,
            image_url: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300&q=80",
            is_featured: true
        },
        {
            id: 3,
            name: "Ajab Fortified Atta",
            description: "Whole wheat atta for soft, fluffy chapatis and mandazi.",
            category: "atta",
            weight: "2kg, 5kg",
            price: 280,
            stock_quantity: 1200,
            image_url: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300&q=80",
            is_featured: false
        },
        {
            id: 4,
            name: "Ajab Self Raising Flour",
            description: "Perfect for cakes, breads, and pastries. Ghee enriched.",
            category: "self_raising",
            weight: "1kg, 2kg",
            price: 300,
            stock_quantity: 600,
            image_url: "https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300&q=80",
            is_featured: false
        },
        {
            id: 5,
            name: "Ajab Baking Flour",
            description: "All-purpose flour for all your baking needs.",
            category: "baking",
            weight: "2kg, 5kg",
            price: 270,
            stock_quantity: 900,
            image_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300&q=80",
            is_featured: false
        },
        {
            id: 6,
            name: "Ajab Whole Wheat Flour",
            description: "100% whole wheat for nutritious breads and pastries.",
            category: "atta",
            weight: "2kg, 5kg",
            price: 290,
            stock_quantity: 700,
            image_url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300&q=80",
            is_featured: true
        }
    ];
    
    renderProducts();
}

function renderProducts() {
    if (!elements.productGrid) return;
    
    // Clear existing content
    elements.productGrid.innerHTML = '';
    
    // Filter products based on current filter
    const filteredProducts = state.currentFilter === 'all' 
        ? state.products 
        : state.products.filter(p => p.category === state.currentFilter);
    
    // If no products, show message
    if (filteredProducts.length === 0) {
        elements.productGrid.innerHTML = `
            <div class="no-products">
                <i class="fas fa-box-open"></i>
                <h3>No products found</h3>
                <p>Try selecting a different category</p>
            </div>
        `;
        return;
    }
    
    // Create product cards
    filteredProducts.forEach(product => {
        const productCard = createProductCard(product);
        elements.productGrid.appendChild(productCard);
    });
    
    // Update product select in order form
    updateProductSelect();
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    card.innerHTML = `
        ${product.is_featured ? '<div class="product-featured">Featured</div>' : ''}
        <div class="product-image">
            <img src="${product.image_url}" alt="${product.name}" onerror="this.src='https://images.unsplash.com/photo-1592924357228-91a4daadcfea?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'">
        </div>
        <div class="product-info">
            <div class="product-category">${formatCategory(product.category)}</div>
            <h3 class="product-name">${product.name}</h3>
            <p class="product-description">${product.description}</p>
            <div class="product-meta">
                <div class="product-price">KSh ${product.price.toFixed(2)}</div>
                <div class="product-weight">${product.weight}</div>
            </div>
            <button class="btn btn-primary" onclick="orderProduct(${product.id})" style="width:100%; margin-top:10px;">
                <i class="fas fa-shopping-cart"></i> Order Now
            </button>
        </div>
    `;
    
    return card;
}

function filterProducts() {
    renderProducts();
}

function formatCategory(category) {
    const categoryMap = {
        'maize_flour': 'Maize Flour',
        'millet_flour': 'Millet Flour',
        'atta': 'Atta Flour',
        'self_raising': 'Self Raising',
        'baking': 'Baking Flour'
    };
    
    return categoryMap[category] || category;
}

function updateProductSelect() {
    const productSelect = document.getElementById('product');
    if (!productSelect) return;
    
    // Clear existing options except first
    while (productSelect.options.length > 1) {
        productSelect.remove(1);
    }
    
    // Add products to select
    state.products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = `${product.name} (${product.weight}) - KSh ${product.price}`;
        productSelect.appendChild(option);
    });
}

function orderProduct(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    
    // Update product select
    const productSelect = document.getElementById('product');
    if (productSelect) {
        productSelect.value = productId;
    }
    
    // Set default quantity
    const quantityInput = document.getElementById('quantity');
    if (quantityInput) {
        quantityInput.value = 50;
    }
    
    // Scroll to order form
    document.getElementById('bulk-order')?.scrollIntoView({ 
        behavior: 'smooth' 
    });
    
    showAlert(`Added ${product.name} to order form`, 'success');
}

// ============================================
// LOADING STATES
// ============================================
function showLoadingState(elementId, message = 'Loading...') {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    element.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>${message}</p>
        </div>
    `;
}

// ============================================
// COUNTRY FUNCTIONS
// ============================================
async function loadCountries() {
    try {
        const response = await fetch(`${state.apiBaseUrl}/api/countries`);
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                populateCountrySelects(data.countries);
            }
        }
    } catch (error) {
        console.error('Error loading countries:', error);
        // Use default countries
        const defaultCountries = [
            { code: '+254', name: 'Kenya', flag: '🇰🇪' },
            { code: '+255', name: 'Tanzania', flag: '🇹🇿' },
            { code: '+256', name: 'Uganda', flag: '🇺🇬' },
            { code: '+250', name: 'Rwanda', flag: '🇷🇼' },
            { code: '+27', name: 'South Africa', flag: '🇿🇦' },
            { code: '+234', name: 'Nigeria', flag: '🇳🇬' },
            { code: '+233', name: 'Ghana', flag: '🇬🇭' }
        ];
        populateCountrySelects(defaultCountries);
    }
}

function populateCountrySelects(countries) {
    // Populate country select in order form
    const countrySelect = document.getElementById('country');
    if (countrySelect) {
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country.name;
            option.textContent = `${country.flag} ${country.name}`;
            countrySelect.appendChild(option);
        });
    }
    
    // Populate country select in registration
    const regCountrySelect = document.getElementById('regCountry');
    if (regCountrySelect) {
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country.name;
            option.textContent = `${country.flag} ${country.name}`;
            regCountrySelect.appendChild(option);
        });
    }
    
    // Populate country code selects
    const codeSelects = document.querySelectorAll('#regCountryCode, .country-code');
    codeSelects.forEach(select => {
        // Clear existing options
        select.innerHTML = '';
        
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country.code;
            option.textContent = `${country.flag} ${country.code}`;
            if (country.code === '+254') option.selected = true; // Default to Kenya
            select.appendChild(option);
        });
    });
}

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Basic validation
    if (!email || !password) {
        showAlert('Please fill in all fields', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${state.apiBaseUrl}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Save user data and token
           localStorage.setItem('currentUser', JSON.stringify(data.user));
           localStorage.setItem('token', data.token);
            
            state.currentUser = data.user;
            updateUIForUser();
            
            hideModal(elements.loginModal);
            showAlert('Login successful!', 'success');
            
            // Reset form
            elements.loginForm.reset();
        } else {
            showAlert(data.error || 'Login failed', 'error');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showAlert('Network error. Please try again.', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const country = document.getElementById('regCountry').value;
    const countryCode = document.getElementById('regCountryCode').value;
    const phone = document.getElementById('regPhone').value;
    
    // Validation
    if (!name || !email || !password || !country || !phone) {
        showAlert('Please fill in all required fields', 'error');
        return;
    }
    
    if (password.length < 6) {
        showAlert('Password must be at least 6 characters', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${state.apiBaseUrl}/api/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                email,
                password,
                country,
                country_code: countryCode,
                phone
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Save user data and token
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            localStorage.setItem('token', data.token);
            
            state.currentUser = data.user;
            updateUIForUser();
            
            hideModal(elements.registerModal);
            showAlert('Registration successful! Welcome to Ajab Flour.', 'success');
            
            // Reset form
            elements.registerForm.reset();
        } else {
            showAlert(data.error || 'Registration failed', 'error');
        }
        
    } catch (error) {
        console.error('Registration error:', error);
        showAlert('Network error. Please try again.', 'error');
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');

        state.currentUser = null;
        updateUIForUser();
        showAlert('Logged out successfully', 'success');
    }
}

function updateUIForUser() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    
    if (state.currentUser) {
        // User is logged in
        if (loginBtn) {
            loginBtn.innerHTML = `<i class="fas fa-user"></i> ${state.currentUser.name.split(' ')[0]}`;
            loginBtn.onclick = logout;
            loginBtn.className = 'btn btn-login'; // Keep login button styling
        }
        
        if (registerBtn) {
            registerBtn.style.display = 'none';
        }
    } else {
        // User is not logged in
        if (loginBtn) {
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
            loginBtn.onclick = () => showModal(elements.loginModal);
            loginBtn.className = 'btn btn-login'; // Keep login button styling
        }
        
        if (registerBtn) {
            registerBtn.style.display = 'inline-flex';
        }
    }
}

// ============================================
// ORDER FUNCTIONS
// ============================================
async function handleOrderSubmit(e) {
    e.preventDefault();
    
    // Get form values
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const countryCode = document.getElementById('countryCode').value;
    const country = document.getElementById('country').value;
    const productId = document.getElementById('product').value;
    const quantity = document.getElementById('quantity').value;
    const delivery = document.getElementById('delivery').value;
    const urgency = document.getElementById('urgency').value;
    const notes = document.getElementById('notes').value;
    
    // Validation
    if (!name || !email || !phone || !country || !productId || !quantity || !delivery) {
        showAlert('Please fill in all required fields', 'error');
        return;
    }
    
    if (parseInt(quantity) < 50) {
        showAlert('Minimum order quantity is 50 kg', 'error');
        return;
    }
    
    // Prepare order data
    const orderData = {
        name,
        email,
        phone: `${countryCode} ${phone}`,
        product_id: parseInt(productId),
        quantity: parseInt(quantity),
        delivery_address: delivery,
        country,
        notes: `${notes} (Urgency: ${urgency})`
    };
    
    // Prepare headers
    const headers = {
        'Content-Type': 'application/json'
    };
    
    // Add authorization header if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
        const response = await fetch(`${state.apiBaseUrl}/api/inquiries`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(orderData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('Order inquiry submitted successfully! Our sales team will contact you within 24 hours.', 'success');
            
            // Reset form
            elements.orderForm.reset();
            
            // Add chatbot notification
            addChatbotMessage(`Thank you for your order inquiry! Reference #ORD${data.inquiry.id}. We'll contact you at ${email}`, 'bot');
        } else {
            showAlert(data.error || 'Failed to submit order', 'error');
        }
        
    } catch (error) {
        console.error('Order submission error:', error);
        showAlert('Network error. Please try again.', 'error');
    }
}

// ============================================
// CHATBOT FUNCTIONS
// ============================================
function initializeChatbot() {
    // Load initial chatbot message
    state.chatHistory = [{
        type: 'bot',
        message: "Hello! I'm Ajab Assistant. I can help you with product information, pricing, delivery, and store locations. How can I help you today?"
    }];
    
    renderChatHistory();
}

function toggleChatbot() {
    elements.chatbotWidget.classList.toggle('active');
    
    if (elements.chatbotWidget.classList.contains('active')) {
        elements.chatbotInput.focus();
    }
}

async function sendChatMessage() {
    const input = elements.chatbotInput;
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    addChatbotMessage(message, 'user');
    input.value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        const response = await fetch(`${state.apiBaseUrl}/api/chatbot/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ question: message })
        });
        
        const data = await response.json();
        
        // Remove typing indicator
        removeTypingIndicator();
        
        if (data.success) {
            // Add bot response
            addChatbotMessage(data.response, 'bot');
            
            // Add suggestions if available
            if (data.suggestions && data.suggestions.length > 0) {
                setTimeout(() => {
                    addChatbotMessage('You might also ask: ' + data.suggestions.join(', '), 'bot');
                }, 500);
            }
        } else {
            addChatbotMessage('Sorry, I encountered an error. Please try again or contact our customer care.', 'bot');
        }
        
    } catch (error) {
        console.error('Chatbot error:', error);
        removeTypingIndicator();
        addChatbotMessage('I apologize, but I am experiencing technical difficulties. Please contact our customer care at +254 700 000 000.', 'bot');
    }
}

function addChatbotMessage(message, type) {
    const messageObj = {
        type,
        message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    state.chatHistory.push(messageObj);
    renderChatHistory();
}

function renderChatHistory() {
    if (!elements.chatbotMessages) return;
    
    elements.chatbotMessages.innerHTML = '';
    
    state.chatHistory.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chatbot-message ${msg.type}`;
        
        messageDiv.innerHTML = `
            <div class="message-content">${msg.message}</div>
            <div class="message-time">${msg.timestamp}</div>
        `;
        
        elements.chatbotMessages.appendChild(messageDiv);
    });
    
    // Scroll to bottom
    elements.chatbotMessages.scrollTop = elements.chatbotMessages.scrollHeight;
}

function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chatbot-message bot typing';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
        <div class="message-content">
            <span class="typing-dots">
                <span>.</span>
                <span>.</span>
                <span>.</span>
            </span>
        </div>
    `;
    
    elements.chatbotMessages.appendChild(typingDiv);
    elements.chatbotMessages.scrollTop = elements.chatbotMessages.scrollHeight;
}

function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// ============================================
// EXPORT FUNCTIONS FOR HTML ONCLICK
// ============================================
// Make functions available globally for onclick attributes
window.orderProduct = orderProduct;
window.logout = logout;
window.toggleChatbot = toggleChatbot;