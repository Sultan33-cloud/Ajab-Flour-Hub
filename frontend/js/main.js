// ============================================
// AJAB FLOUR DIGITAL HUB - MAIN JAVASCRIPT
// ============================================

// API Configuration
const API_BASE_URL = 'https://ajab-flour-hub.onrender.com'; // Updated to port 5300

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
    productGrid: document.querySelector('.product-grid'),
    filterBtns: document.querySelectorAll('.filter-btn'),
    
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
        
        // Update UI based on user state
        updateUIForUser();
        
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
            image_url: "https://www.istockphoto.com/en/photo/flour-gm535492963-57207480",
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
            image_url: "https://www.istockphoto.com/en/photo/gluten-free-concept-oat-flour-gm1144977108-308029615",
            is_featured: true
        },
        {
            id: 3,
            name: "Ajab Fortified Lottus",
            description: "Whole wheat atta for soft, fluffy chapatis and mandazi.",
            category: "atta",
            weight: "2kg, 5kg",
            price: 280,
            stock_quantity: 1200,
            image_url: "https://www.istockphoto.com/en/photo/flour-and-ears-of-wheat-on-a-black-background-close-up-bread-concept-gm1353350732-428473325",
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
            image_url: "https://www.istockphoto.com/photo/flour-background-gm465622812-59300326?utm_source=pixabay&utm_medium=affiliate&utm_campaign=sponsored_photo&utm_content=srp_topbanner_media&utm_term=flour",
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
            image_url: "https://www.istockphoto.com/photo/rice-flour-gm1400572959-454104108?utm_source=pixabay&utm_medium=affiliate&utm_campaign=sponsored_photo&utm_content=srp_topbanner_media&utm_term=flour",
            is_featured: false
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
        'baking': 'Baking Flour',
        'whole_wheat': 'Whole Wheat'
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

window.orderProduct = function(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) {
        showAlert('Product not found', 'error');
        return;
    }
    
    // Use cart system if available
    if (window.cartSystem) {
        const quantity = prompt(`How many kg of ${product.name} would you like to order?`, "1");
        if (quantity && !isNaN(quantity) && parseInt(quantity) > 0) {
            cartSystem.addItem(product, parseInt(quantity));
        }
    } else {
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
};

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

window.logout = function() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');

        state.currentUser = null;
        updateUIForUser();
        showAlert('Logged out successfully', 'success');
    }
};

function updateUIForUser() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    
    if (state.currentUser) {
        // User is logged in
        if (loginBtn) {
            loginBtn.innerHTML = `<i class="fas fa-user"></i> ${state.currentUser.name.split(' ')[0]}`;
            loginBtn.onclick = logout;
            loginBtn.className = 'btn btn-login';
        }
        
        if (registerBtn) {
            registerBtn.style.display = 'none';
        }
    } else {
        // User is not logged in
        if (loginBtn) {
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
            loginBtn.onclick = () => showModal(elements.loginModal);
            loginBtn.className = 'btn btn-login';
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
            
            // Add chatbot notification if assistant exists
            if (window.ajabAssistant && data.order_id) {
                ajabAssistant.sendMessage(`Order ${data.order_id} placed successfully`);
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
// DEBUG FUNCTIONS
// ============================================
window.testProductDropdown = function() {
    console.log('=== Testing Product Dropdown ===');
    
    const productSelect = document.getElementById('product');
    console.log('Product select element exists:', !!productSelect);
    console.log('Number of products in state:', state.products.length);
    console.log('Products in state:', state.products);
    
    if (productSelect) {
        console.log('Dropdown options count:', productSelect.options.length);
    }
    
    updateProductSelect();
    console.log('Dropdown refreshed');
};

window.refreshProductDropdown = function() {
    console.log('Manually refreshing product dropdown...');
    updateProductSelect();
};

// Export functions for HTML onclick
window.showModal = showModal;
window.hideModal = hideModal;
window.showAlert = showAlert;

console.log('Main script loaded successfully');
console.log('API Base URL:', API_BASE_URL);
console.log('Current user:', state.currentUser);