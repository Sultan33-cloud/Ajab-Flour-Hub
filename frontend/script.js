// ============================================
// AJAB FLOUR DIGITAL HUB - FRONTEND JAVASCRIPT
// ============================================

// API Configuration
const API_BASE_URL = 'https://ajab-flour-hub.onrender.com'; // Production

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
        console.log('=== Initializing App ===');
        
        // Setup event listeners
        setupEventListeners();
        
        // Load initial data
        console.log('Loading products...');
        await loadProducts();
        
        console.log('Loading countries...');
        await loadCountries();
        
        // Debug: Check if products loaded
        console.log('Products loaded:', state.products.length);
        console.log('Product select element:', document.getElementById('product'));
        
        // Force update dropdown
        setTimeout(() => {
            if (document.getElementById('product') && state.products.length > 0) {
                updateProductSelect();
                console.log('Dropdown updated after delay');
            }
        }, 500);
        
        // Update UI based on user state
        updateUIForUser();
        
        // Initialize chatbot
        initializeChatbot();
        
        // Show welcome message
        setTimeout(() => {
            showAlert('Welcome to Ajab Flour Digital Hub!', 'info');
        }, 1000);
        
        console.log('=== App Initialized ===');
        
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
    
    // Product dropdown change listener
    const productSelect = document.getElementById('product');
    if (productSelect) {
        productSelect.addEventListener('change', function() {
            console.log('Product selected:', this.value);
            const selectedProduct = state.products.find(p => p.id == this.value);
            console.log('Selected product details:', selectedProduct);
        });
    }
    
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
        console.log('Loading products from:', `${state.apiBaseUrl}/api/products`);
        showLoadingState('productGrid', 'Loading products...');
        
        const response = await fetch(`${state.apiBaseUrl}/api/products`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Products API response:', data);
        
        if (data.success && data.products) {
            state.products = data.products;
            console.log(`Loaded ${state.products.length} products`);
            
            // Render products AND update dropdown
            renderProducts();
            updateProductSelect();
            
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
    console.log('Loading sample products...');
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
    
    console.log(`Loaded ${state.products.length} sample products`);
    renderProducts();
    updateProductSelect();
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
    if (!productSelect) {
        console.error('Product select element not found!');
        return;
    }
    
    // Clear existing options except first
    productSelect.innerHTML = '<option value="">Select Product</option>';
    
    // Check if we have products
    if (!state.products || state.products.length === 0) {
        console.warn('No products available to populate dropdown');
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Loading products...';
        productSelect.appendChild(option);
        return;
    }
    
    console.log(`Populating dropdown with ${state.products.length} products`);
    
    // Add products to select
    state.products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = `${product.name} (${product.weight}) - KSh ${product.price}`;
        productSelect.appendChild(option);
    });
    
    console.log('Product dropdown populated successfully');
}

function orderProduct(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) {
        showAlert('Product not found', 'error');
        return;
    }
    
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
        countrySelect.innerHTML = '<option value="">Select Country</option>';
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
        regCountrySelect.innerHTML = '<option value="">Select Country</option>';
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
    
    // Debug logging
    console.log('=== LOGIN DEBUG ===');
    console.log('Email:', email);
    console.log('Password:', password ? '***' : 'empty');
    console.log('API URL:', `${state.apiBaseUrl}/api/login`);
    
    // Basic validation
    if (!email || !password) {
        showAlert('Please fill in all fields', 'error');
        return;
    }
    
    try {
        console.log('Attempting login for:', email);
        
        const response = await fetch(`${state.apiBaseUrl}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        console.log('Login response:', data);
        
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
            
            // If admin, redirect to admin panel
            if (data.user.role === 'admin' || data.user.role === 'sales') {
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 1500);
            }
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
    
    if (productId === "") {
        showAlert('Please select a product', 'error');
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
    
    console.log('Submitting order:', orderData);
    
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
        console.log('Order response:', data);
        
        if (data.success) {
            showAlert('Order inquiry submitted successfully! Our sales team will contact you within 24 hours.', 'success');
            
            // Reset form
            elements.orderForm.reset();
            
            // Reset product dropdown
            updateProductSelect();
            
            // Add chatbot notification
            if (data.order_id) {
                addChatbotMessage(`Thank you for your order inquiry! Reference #${data.order_id}. We'll contact you at ${email}`, 'bot');
            } else {
                addChatbotMessage(`Thank you for your order inquiry! We'll contact you at ${email}`, 'bot');
            }
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
// DEBUG FUNCTIONS
// ============================================
function testProductDropdown() {
    console.log('=== Testing Product Dropdown ===');
    
    // Check if element exists
    const productSelect = document.getElementById('product');
    console.log('1. Product select element exists:', !!productSelect);
    
    // Check current state
    console.log('2. Number of products in state:', state.products.length);
    console.log('3. Products in state:', state.products);
    
    // Check dropdown options
    if (productSelect) {
        console.log('4. Dropdown options count:', productSelect.options.length);
        console.log('5. Dropdown options:', 
            Array.from(productSelect.options).map(opt => ({
                value: opt.value,
                text: opt.text
            }))
        );
    }
    
    // Try to manually populate
    updateProductSelect();
    console.log('6. Dropdown refreshed');
}

function refreshProductDropdown() {
    console.log('Manually refreshing product dropdown...');
    console.log('Current products:', state.products);
    updateProductSelect();
}

// ============================================
// THEME SYSTEM - DARK/LIGHT MODE WITH STARS
// ============================================

// Theme state
const themeState = {
    isDarkMode: localStorage.getItem('theme') === 'dark',
    stars: [],
    starCount: 100
};

// Initialize theme system
function initializeThemeSystem() {
    console.log('🎨 Initializing theme system...');
    
    // Create theme elements
    createThemeElements();
    
    // Wait a bit for DOM to be ready, then create toggle button
    setTimeout(() => {
        createThemeToggle();
        
        // Apply saved theme
        applyTheme(themeState.isDarkMode);
        
        // Setup event listener
        const toggleBtn = document.getElementById('themeToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', toggleTheme);
        }
        
        // Generate stars if dark mode
        if (themeState.isDarkMode) {
            setTimeout(generateStars, 100);
        }
        
        console.log('🎨 Theme system initialized successfully');
    }, 500);
}

// Create theme toggle button
function createThemeToggle() {
    console.log('🎨 Creating theme toggle button...');
    
    // First check if navbar exists
    const navbar = document.querySelector('.nav-links');
    if (!navbar) {
        console.warn('❌ Navbar not found, will retry...');
        setTimeout(createThemeToggle, 100);
        return;
    }
    
    // Check if button already exists
    if (document.getElementById('themeToggle')) {
        console.log('✅ Theme toggle already exists');
        return;
    }
    
    const themeToggle = document.createElement('li');
    themeToggle.innerHTML = `
        <button class="btn btn-theme-toggle" id="themeToggle">
            <i class="fas ${themeState.isDarkMode ? 'fa-sun' : 'fa-moon'}"></i>
            <span>${themeState.isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
    `;
    
    // Insert before the last 2 buttons (login/register/admin)
    const lastIndex = navbar.children.length;
    const insertPosition = Math.max(0, lastIndex - 3);
    navbar.insertBefore(themeToggle, navbar.children[insertPosition]);
    
    console.log('✅ Theme toggle button created');
}

// Create sunset and stars containers
function createThemeElements() {
    console.log('🎨 Creating theme elements...');
    
    // Check if elements already exist
    if (!document.querySelector('.sunset-overlay')) {
        // Sunset overlay for light mode
        const sunsetOverlay = document.createElement('div');
        sunsetOverlay.className = 'sunset-overlay';
        document.body.appendChild(sunsetOverlay);
        console.log('✅ Sunset overlay created');
    }
    
    if (!document.getElementById('starsContainer')) {
        // Stars container for dark mode
        const starsContainer = document.createElement('div');
        starsContainer.className = 'stars-container';
        starsContainer.id = 'starsContainer';
        document.body.appendChild(starsContainer);
        console.log('✅ Stars container created');
    }
}

// Apply theme - FIXED VERSION
function applyTheme(isDark) {
    console.log(`🎨 Applying ${isDark ? 'dark' : 'light'} theme...`);
    
    const theme = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update toggle button if it exists
    updateThemeToggle(isDark);
    
    // Toggle stars
    const starsContainer = document.getElementById('starsContainer');
    if (starsContainer) {
        if (isDark) {
            setTimeout(() => {
                generateStars();
                console.log('⭐ Stars generated');
            }, 200);
        } else {
            clearStars();
            console.log('⭐ Stars cleared');
        }
    }
    
    // Update localStorage
    localStorage.setItem('theme', theme);
    themeState.isDarkMode = isDark;
    
    console.log(`✅ ${isDark ? 'Dark' : 'Light'} theme applied`);
}

// Update theme toggle button
function updateThemeToggle(isDark) {
    const toggleBtn = document.getElementById('themeToggle');
    if (toggleBtn) {
        const icon = toggleBtn.querySelector('i');
        const text = toggleBtn.querySelector('span');
        
        if (icon) {
            icon.className = `fas ${isDark ? 'fa-sun' : 'fa-moon'}`;
        }
        
        if (text) {
            text.textContent = isDark ? 'Light Mode' : 'Dark Mode';
        }
        
        console.log('✅ Theme toggle updated');
    } else {
        console.log('ℹ️ Theme toggle button not found, will create it');
        setTimeout(() => createThemeToggle(), 100);
    }
}

// Toggle theme
function toggleTheme() {
    console.log('🎨 Toggling theme...');
    const newTheme = !themeState.isDarkMode;
    applyTheme(newTheme);
}

// Generate stars for dark mode
function generateStars() {
    console.log('⭐ Generating stars...');
    
    const starsContainer = document.getElementById('starsContainer');
    if (!starsContainer) {
        console.warn('❌ Stars container not found');
        return;
    }
    
    clearStars();
    
    // Create stars
    for (let i = 0; i < themeState.starCount; i++) {
        const star = document.createElement('div');
        const size = Math.random() * 3 + 1;
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const duration = Math.random() * 3 + 2;
        
        star.className = 'star';
        if (size < 1.5) {
            star.classList.add('small');
        } else if (size < 2.5) {
            star.classList.add('medium');
        } else {
            star.classList.add('large');
        }
        
        star.style.cssText = `
            left: ${x}vw;
            top: ${y}vh;
            width: ${size}px;
            height: ${size}px;
            animation-duration: ${duration}s;
            animation-delay: ${Math.random() * duration}s;
            opacity: ${Math.random() * 0.7 + 0.3};
        `;
        
        starsContainer.appendChild(star);
        themeState.stars.push(star);
    }
    
    console.log(`✅ ${themeState.starCount} stars created`);
}

// Clear stars
function clearStars() {
    const starsContainer = document.getElementById('starsContainer');
    if (!starsContainer) return;
    
    starsContainer.innerHTML = '';
    themeState.stars = [];
    console.log('✅ Stars cleared');
}

// ============================================
// APPLY ENHANCED BORDERS
// ============================================
function applyEnhancedBorders() {
    console.log('🎨 Applying enhanced borders...');
    
    // List of selectors to enhance
    const selectors = [
        '.hero .container',
        '.about-content',
        '.product-card',
        '.order-form',
        '.order-info',
        '.retailer-card',
        '.feature',
        '.stat'
    ];
    
    let enhancedCount = 0;
    
    selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            if (!element.classList.contains('enhanced-border')) {
                element.classList.add('enhanced-border');
                enhancedCount++;
            }
        });
    });
    
    console.log(`✅ Enhanced ${enhancedCount} elements with borders`);
}

// ============================================
// UPDATE TYPOGRAPHY
// ============================================
function updateTypography() {
    console.log('🎨 Updating typography...');
    
    // Add Inter font if not already loaded
    if (!document.querySelector('link[href*="Inter"]')) {
        const fontLink = document.createElement('link');
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap';
        fontLink.rel = 'stylesheet';
        document.head.appendChild(fontLink);
        console.log('✅ Inter font loaded');
    }
    
    // Apply font classes to elements
    document.querySelectorAll('h1, h2, h3').forEach(el => {
        el.style.fontFamily = "'Poppins', sans-serif";
    });
    
    document.querySelectorAll('p, .product-description, .section-subtitle').forEach(el => {
        el.style.fontFamily = "'Inter', sans-serif";
    });
    
    console.log('✅ Typography updated');
}

// ============================================
// INITIALIZE ENHANCEMENTS
// ============================================
function initializeEnhancements() {
    console.log('🚀 Initializing all enhancements...');
    
    // Add Inter font to head first
    const interFont = document.createElement('link');
    interFont.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap';
    interFont.rel = 'stylesheet';
    document.head.appendChild(interFont);
    
    // Initialize theme system after a short delay
    setTimeout(initializeThemeSystem, 300);
    
    // Apply other enhancements after theme
    setTimeout(() => {
        applyEnhancedBorders();
        updateTypography();
        
        console.log('🎉 All enhancements initialized successfully!');
    }, 1000);
}

// Run when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM loaded, starting enhancements...');
    initializeEnhancements();
});

// Also run when page is fully loaded
window.addEventListener('load', function() {
    console.log('🖼️ Page fully loaded, finalizing enhancements...');
    // Final check for theme toggle
    if (!document.getElementById('themeToggle')) {
        setTimeout(createThemeToggle, 500);
    }
});

// Export functions for debugging
window.toggleTheme = toggleTheme;
window.generateStars = generateStars;
window.clearStars = clearStars;
window.applyTheme = applyTheme;

console.log('🎨 Theme system script loaded');

// ============================================
// EXPORT FUNCTIONS FOR HTML ONCLICK
// ============================================
// Make functions available globally for onclick attributes
window.orderProduct = orderProduct;
window.logout = logout;
window.toggleChatbot = toggleChatbot;
window.testProductDropdown = testProductDropdown;
window.refreshProductDropdown = refreshProductDropdown;

// Debug on load
console.log('Script loaded successfully');
console.log('API Base URL:', API_BASE_URL);
console.log('Current user:', state.currentUser);
console.log('Products loaded:', state.products.length);