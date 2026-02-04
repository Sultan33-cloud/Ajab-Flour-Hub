// ============================================
// AJAB FLOUR ADMIN DASHBOARD - JAVASCRIPT
// ============================================

// API Configuration
const API_BASE_URL = 'https://ajab-flour-hub.onrender.com'; // Update with your backend URL

// ============================================
// AUTHENTICATION CHECK
// ============================================
function checkAdminAuth() {
    const user = JSON.parse(localStorage.getItem('currentUser')); // Changed from 'ajab_user'
    const token = localStorage.getItem('token'); // Changed from 'ajab_token'
    
    if (!user || !token) {
        // Not logged in, redirect to main site
        window.location.href = 'index.html';
        return false;
    }
    
    // Check if user has admin or sales role
    if (!['admin', 'sales'].includes(user.role)) {
        alert('Access denied. Admin privileges required.');
        window.location.href = 'index.html';
        return false;
    }
    
    // Set user info in sidebar
    document.getElementById('adminName').textContent = user.name;
    document.getElementById('adminEmail').textContent = user.email;
    
    // Update role display
    const roleElement = document.querySelector('.user-role');
    if (roleElement) {
        roleElement.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
    }
    
    return { user, token };
}

// Sample Data for Demo
const sampleData = {
    products: [
        { id: 1, name: 'Ajab Fortified Maize Flour', category: 'maize_flour', stock: 450, price: 250, weight: '2kg, 5kg, 25kg', status: 'high' },
        { id: 2, name: 'Ajab Millet Flour', category: 'millet_flour', stock: 120, price: 320, weight: '1kg, 2kg, 10kg', status: 'medium' },
        { id: 3, name: 'Ajab Fortified Atta', category: 'atta', stock: 800, price: 280, weight: '2kg, 5kg', status: 'high' },
        { id: 4, name: 'Ajab Self Raising Flour', category: 'self_raising', stock: 45, price: 300, weight: '1kg, 2kg', status: 'low' },
        { id: 5, name: 'Ajab Baking Flour', category: 'baking', stock: 60, price: 270, weight: '2kg, 5kg', status: 'low' }
    ],
    orders: [
        { id: 'ORD-001', customer: 'John Kamau', product: 'Maize Flour 25kg', quantity: 50, amount: 12500, status: 'pending', date: '2024-03-15' },
        { id: 'ORD-002', customer: 'Sarah Mohammed', product: 'Millet Flour 10kg', quantity: 100, amount: 32000, status: 'processing', date: '2024-03-14' },
        { id: 'ORD-003', customer: 'David Ochieng', product: 'Atta 5kg', quantity: 200, amount: 56000, status: 'completed', date: '2024-03-13' },
        { id: 'ORD-004', customer: 'Grace Akinyi', product: 'Self Raising 2kg', quantity: 150, amount: 45000, status: 'pending', date: '2024-03-12' },
        { id: 'ORD-005', customer: 'Robert Mugabe', product: 'Baking Flour 5kg', quantity: 80, amount: 21600, status: 'completed', date: '2024-03-11' }
    ],
    customers: [
        { id: 1, name: 'John Kamau', email: 'john@example.com', phone: '+254712345678', country: 'Kenya', orders: 12, total: 145000 },
        { id: 2, name: 'Sarah Mohammed', email: 'sarah@example.com', phone: '+255712345678', country: 'Tanzania', orders: 8, total: 98000 },
        { id: 3, name: 'David Ochieng', email: 'david@example.com', phone: '+256712345678', country: 'Uganda', orders: 15, total: 210000 },
        { id: 4, name: 'Grace Akinyi', email: 'grace@example.com', phone: '+254723456789', country: 'Kenya', orders: 5, total: 45000 }
    ],
    notifications: [
        { id: 1, type: 'order', title: 'New Order Received', message: 'Order ORD-006 for 100kg Maize Flour', time: '10 minutes ago', read: false },
        { id: 2, type: 'stock', title: 'Low Stock Alert', message: 'Self Raising Flour stock below minimum', time: '2 hours ago', read: false },
        { id: 3, type: 'payment', title: 'Payment Received', message: 'Payment confirmed for ORD-003', time: '1 day ago', read: true }
    ]
};

// DOM Elements
const elements = {
    // Loading
    loadingScreen: document.getElementById('loadingScreen'),
    
    // Sidebar
    sidebarToggle: document.getElementById('sidebarToggle'),
    navItems: document.querySelectorAll('.nav-item'),
    
    // Top Bar
    pageTitle: document.getElementById('pageTitle'),
    pageSubtitle: document.getElementById('pageSubtitle'),
    currentDateTime: document.getElementById('currentDateTime'),
    notificationBtn: document.getElementById('notificationBtn'),
    notificationDropdown: document.getElementById('notificationDropdown'),
    notificationList: document.getElementById('notificationList'),
    notificationCount: document.getElementById('notificationCount'),
    
    // Pages
    contentArea: document.getElementById('contentArea'),
    pageSections: document.querySelectorAll('.page-section'),
    
    // Dashboard
    revenueAmount: document.getElementById('revenueAmount'),
    totalOrders: document.getElementById('totalOrders'),
    totalCustomers: document.getElementById('totalCustomers'),
    totalProducts: document.getElementById('totalProducts'),
    recentOrdersTable: document.getElementById('recentOrdersTable'),
    lowStockList: document.getElementById('lowStockList'),
    
    // Orders
    ordersSection: document.getElementById('ordersSection'),
    ordersTable: document.getElementById('ordersTable'),
    orderSearch: document.getElementById('orderSearch'),
    
    // Products
    productsSection: document.getElementById('productsSection'),
    productsGrid: document.getElementById('productsGrid'),
    addProductBtn: document.getElementById('addProductBtn'),
    productModal: document.getElementById('productModal'),
    productForm: document.getElementById('productForm'),
    
    // Inventory
    inventorySection: document.getElementById('inventorySection'),
    inventoryTable: document.getElementById('inventoryTable'),
    
    // Modals
    modals: document.querySelectorAll('.modal'),
    closeModals: document.querySelectorAll('.close-modal'),
    orderDetailsModal: document.getElementById('orderDetailsModal'),
    orderDetailsContent: document.getElementById('orderDetailsContent'),
    
    // Alert
    adminAlert: document.getElementById('adminAlert'),
    alertMessage: document.getElementById('alertMessage'),
    
    // Footer
    lastUpdated: document.getElementById('lastUpdated'),
    databaseStatus: document.getElementById('databaseStatus'),
    
    // Logout
    logoutBtn: document.getElementById('logoutBtn')
};

// Charts
let salesChart, productsChart, revenueChart, countriesChart, growthChart, statusChart;

// Application State
const state = {
    currentPage: 'dashboard',
    currentUser: null,
    products: [],
    orders: [],
    customers: [],
    notifications: [],
    filteredOrders: []
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initializeAdminDashboard();
});

async function initializeAdminDashboard() {
    try {
        // Check authentication first
        const auth = checkAdminAuth();
        if (!auth) return;
        
        const { user, token } = auth;
        
        // Set authorization header for all fetch requests
        window.fetchWithAuth = async (url, options = {}) => {
            const defaultOptions = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            };
            
            return fetch(url, { ...defaultOptions, ...options });
        };
        
        // Hide loading screen after 1.5 seconds
        setTimeout(() => {
            elements.loadingScreen.style.opacity = '0';
            setTimeout(() => {
                elements.loadingScreen.style.display = 'none';
            }, 500);
        }, 1500);
        
        // Setup event listeners
        setupEventListeners();
        
        // Initialize data
        await loadData();
        
        // Setup real-time clock
        updateDateTime();
        setInterval(updateDateTime, 1000);
        
        // Update last updated time
        elements.lastUpdated.textContent = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Load notifications
        loadNotifications();
        
        // Initialize charts
        initializeCharts();
        
        // Show welcome message
        showAlert(`Welcome, ${user.name}! Admin dashboard loaded.`, 'success');
        
    } catch (error) {
        console.error('Initialization error:', error);
        showAlert('Failed to load dashboard. Please login again.', 'warning');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    }
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
    // Sidebar navigation
    elements.navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            switchPage(page);
        });
    });
    
    // Sidebar toggle (mobile)
    if (elements.sidebarToggle) {
        elements.sidebarToggle.addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('active');
        });
    }
    
    // Notifications dropdown
    if (elements.notificationBtn) {
        elements.notificationBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            elements.notificationDropdown.classList.toggle('active');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!elements.notificationBtn.contains(e.target) && 
                !elements.notificationDropdown.contains(e.target)) {
                elements.notificationDropdown.classList.remove('active');
            }
        });
    }
    
    // Order search
    if (elements.orderSearch) {
        elements.orderSearch.addEventListener('input', filterOrders);
    }
    
    // Add product button
    if (elements.addProductBtn) {
        elements.addProductBtn.addEventListener('click', () => {
            showModal(elements.productModal);
        });
    }
    
    // Product form submission
    if (elements.productForm) {
        elements.productForm.addEventListener('submit', handleProductSubmit);
    }
    
    // Modal controls
    elements.closeModals.forEach(btn => {
        btn.addEventListener('click', () => {
            hideAllModals();
        });
    });
    
    // Close modals when clicking outside
    elements.modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideAllModals();
            }
        });
    });
    
    // Logout
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Alert close
    const alertClose = document.querySelector('.alert-close');
    if (alertClose) {
        alertClose.addEventListener('click', () => {
            elements.adminAlert.classList.remove('active');
        });
    }
}

// ============================================
// PAGE MANAGEMENT
// ============================================
function switchPage(page) {
    // Update active nav item
    elements.navItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === page) {
            item.classList.add('active');
        }
    });
    
    // Hide all pages
    elements.pageSections.forEach(section => {
        section.style.display = 'none';
    });
    
    // Show selected page
    const pageSection = document.getElementById(`${page}Section`);
    if (pageSection) {
        pageSection.style.display = 'block';
    }
    
    // Update page title
    updatePageTitle(page);
    
    // Load page data
    loadPageData(page);
    
    // Update state
    state.currentPage = page;
}

function updatePageTitle(page) {
    const titles = {
        dashboard: { title: 'Dashboard Overview', subtitle: 'Welcome back! Here\'s what\'s happening with Ajab Flour today.' },
        orders: { title: 'Order Management', subtitle: 'Manage customer orders and track order status.' },
        products: { title: 'Product Management', subtitle: 'Add, edit, and manage your product catalog.' },
        inventory: { title: 'Inventory Management', subtitle: 'Track stock levels and manage inventory.' },
        customers: { title: 'Customer Management', subtitle: 'View and manage customer information.' },
        analytics: { title: 'Business Analytics', subtitle: 'Analyze sales trends and business performance.' },
        reports: { title: 'Reports', subtitle: 'Generate and view business reports.' },
        settings: { title: 'System Settings', subtitle: 'Configure system preferences and settings.' }
    };
    
    const pageInfo = titles[page] || titles.dashboard;
    
    if (elements.pageTitle) elements.pageTitle.textContent = pageInfo.title;
    if (elements.pageSubtitle) elements.pageSubtitle.textContent = pageInfo.subtitle;
}

function loadPageData(page) {
    switch(page) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'orders':
            loadOrdersData();
            break;
        case 'products':
            loadProductsData();
            break;
        case 'inventory':
            loadInventoryData();
            break;
        case 'customers':
            loadCustomersData();
            break;
        case 'analytics':
            loadAnalyticsData();
            break;
    }
}

// ============================================
// DATA LOADING
// ============================================
async function loadData() {
    try {
        // Try to load from API first
        const productsResponse = await fetchWithAuth(`${API_BASE_URL}/api/products`);
        if (productsResponse.ok) {
            const data = await productsResponse.json();
            state.products = data.products || [];
        } else {
            throw new Error('API not available');
        }
        
        // Load orders from API
        const ordersResponse = await fetchWithAuth(`${API_BASE_URL}/api/inquiries`);
        if (ordersResponse.ok) {
            const data = await ordersResponse.json();
            state.orders = data.inquiries || [];
        }
        
        // Load dashboard stats
        const statsResponse = await fetchWithAuth(`${API_BASE_URL}/api/dashboard/stats`);
        if (statsResponse.ok) {
            const data = await statsResponse.json();
            updateStats(data.stats);
        }
        
    } catch (error) {
        console.log('Using demo data:', error.message);
        loadSampleData();
    }
}

function loadSampleData() {
    state.products = sampleData.products;
    state.orders = sampleData.orders;
    state.customers = sampleData.customers;
    state.notifications = sampleData.notifications;
    
    updateStats({
        pending_orders: 12,
        processing_orders: 8,
        low_stock_items: 3,
        recent_inquiries: 24,
        monthly_revenue: 245800
    });
}

function updateStats(stats) {
    if (elements.revenueAmount) {
        elements.revenueAmount.textContent = `KSh ${stats.monthly_revenue.toLocaleString()}`;
    }
    
    if (elements.totalOrders) {
        elements.totalOrders.textContent = stats.recent_inquiries;
    }
    
    // Update pending badge
    const pendingBadge = document.getElementById('pendingBadge');
    if (pendingBadge) {
        pendingBadge.textContent = stats.pending_orders;
    }
    
    // Update low stock badge
    const lowStockBadge = document.getElementById('lowStockBadge');
    if (lowStockBadge) {
        lowStockBadge.textContent = stats.low_stock_items;
    }
}

// ============================================
// DASHBOARD FUNCTIONS
// ============================================
function loadDashboardData() {
    loadRecentOrders();
    loadLowStockAlerts();
}

function loadRecentOrders() {
    if (!elements.recentOrdersTable) return;
    
    elements.recentOrdersTable.innerHTML = '';
    
    const recentOrders = state.orders.slice(0, 5);
    
    recentOrders.forEach(order => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${order.id}</td>
            <td>${order.customer || order.customer_name || 'N/A'}</td>
            <td>${order.product || order.product_name || 'N/A'}</td>
            <td>KSh ${(order.amount || order.price || 0).toLocaleString()}</td>
            <td><span class="status-badge status-${order.status}">${order.status}</span></td>
            <td>${order.date || order.created_at?.split('T')[0] || 'N/A'}</td>
        `;
        
        elements.recentOrdersTable.appendChild(row);
    });
}

function loadLowStockAlerts() {
    if (!elements.lowStockList) return;
    
    elements.lowStockList.innerHTML = '';
    
    const lowStockProducts = state.products.filter(p => p.status === 'low' || p.stock < 100);
    
    if (lowStockProducts.length === 0) {
        elements.lowStockList.innerHTML = `
            <div class="alert-item success">
                <span>All products have sufficient stock</span>
            </div>
        `;
        return;
    }
    
    lowStockProducts.forEach(product => {
        const alertItem = document.createElement('div');
        alertItem.className = 'alert-item';
        
        alertItem.innerHTML = `
            <span><strong>${product.name}</strong> - ${product.stock} units remaining</span>
            <button class="btn-action" onclick="reorderProduct(${product.id})" title="Reorder">
                <i class="fas fa-sync"></i>
            </button>
        `;
        
        elements.lowStockList.appendChild(alertItem);
    });
}

// ============================================
// ORDERS MANAGEMENT
// ============================================
function loadOrdersData() {
    if (!elements.ordersTable) return;
    
    elements.ordersTable.innerHTML = '';
    state.filteredOrders = [...state.orders];
    
    state.filteredOrders.forEach(order => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td><input type="checkbox" class="order-checkbox" data-id="${order.id}"></td>
            <td>${order.id}</td>
            <td>${order.customer || order.customer_name || 'N/A'}</td>
            <td>${order.product || order.product_name || 'N/A'}</td>
            <td>${order.quantity || 0} kg</td>
            <td>KSh ${(order.amount || order.price || 0).toLocaleString()}</td>
            <td><span class="status-badge status-${order.status}">${order.status}</span></td>
            <td>${order.date || order.created_at?.split('T')[0] || 'N/A'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action" onclick="viewOrderDetails('${order.id}')" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action" onclick="updateOrderStatus('${order.id}')" title="Update Status">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action" onclick="deleteOrder('${order.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        elements.ordersTable.appendChild(row);
    });
}

function filterOrders() {
    const searchTerm = elements.orderSearch.value.toLowerCase();
    
    if (!searchTerm) {
        loadOrdersData();
        return;
    }
    
    const filtered = state.orders.filter(order => 
        order.id.toLowerCase().includes(searchTerm) ||
        (order.customer && order.customer.toLowerCase().includes(searchTerm)) ||
        (order.product && order.product.toLowerCase().includes(searchTerm)) ||
        order.status.toLowerCase().includes(searchTerm)
    );
    
    // Update table with filtered results
    elements.ordersTable.innerHTML = '';
    
    filtered.forEach(order => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td><input type="checkbox" class="order-checkbox" data-id="${order.id}"></td>
            <td>${order.id}</td>
            <td>${order.customer || order.customer_name || 'N/A'}</td>
            <td>${order.product || order.product_name || 'N/A'}</td>
            <td>${order.quantity || 0} kg</td>
            <td>KSh ${(order.amount || order.price || 0).toLocaleString()}</td>
            <td><span class="status-badge status-${order.status}">${order.status}</span></td>
            <td>${order.date || order.created_at?.split('T')[0] || 'N/A'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action" onclick="viewOrderDetails('${order.id}')" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action" onclick="updateOrderStatus('${order.id}')" title="Update Status">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action" onclick="deleteOrder('${order.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        elements.ordersTable.appendChild(row);
    });
}

// ============================================
// PRODUCTS MANAGEMENT
// ============================================
function loadProductsData() {
    if (!elements.productsGrid) return;
    
    elements.productsGrid.innerHTML = '';
    
    state.products.forEach(product => {
        const productCard = createProductCard(product);
        elements.productsGrid.appendChild(productCard);
    });
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-admin-card';
    
    // Determine stock status
    let stockClass = 'stock-high';
    let stockText = 'High Stock';
    
    if (product.status === 'low' || product.stock < 100) {
        stockClass = 'stock-low';
        stockText = 'Low Stock';
    } else if (product.status === 'medium' || product.stock < 200) {
        stockClass = 'stock-medium';
        stockText = 'Medium Stock';
    }
    
    card.innerHTML = `
        <div class="product-admin-image">
            <img src="${product.image_url || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'}" 
                 alt="${product.name}">
        </div>
        <div class="product-admin-info">
            <h4>${product.name}</h4>
            <span class="product-admin-category">${formatCategory(product.category)}</span>
            <div class="product-admin-meta">
                <div class="product-price">KSh ${product.price}</div>
                <div class="product-stock ${stockClass}">${product.stock} units</div>
            </div>
            <p class="product-description">${product.description || 'Premium quality flour'}</p>
            <div class="product-admin-actions">
                <button class="btn-action" onclick="editProduct(${product.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action" onclick="deleteProduct(${product.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
                <button class="btn-action" onclick="viewProduct(${product.id})" title="View">
                    <i class="fas fa-eye"></i>
                </button>
            </div>
        </div>
    `;
    
    return card;
}

function handleProductSubmit(e) {
    e.preventDefault();
    
    const productData = {
        name: document.getElementById('productName').value,
        category: document.getElementById('productCategory').value,
        weight: document.getElementById('productWeight').value,
        price: parseFloat(document.getElementById('productPrice').value),
        stock: parseInt(document.getElementById('productStock').value),
        description: document.getElementById('productDescription').value,
        image_url: document.getElementById('productImage').value || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        featured: document.getElementById('productFeatured').checked
    };
    
    // Add to state (in real app, this would be API call)
    const newProduct = {
        id: state.products.length + 1,
        ...productData,
        status: productData.stock < 100 ? 'low' : productData.stock < 200 ? 'medium' : 'high'
    };
    
    state.products.push(newProduct);
    
    // Update UI
    loadProductsData();
    loadLowStockAlerts();
    
    // Close modal and show success
    hideAllModals();
    showAlert('Product added successfully!', 'success');
    
    // Reset form
    elements.productForm.reset();
}

// ============================================
// INVENTORY MANAGEMENT
// ============================================
function loadInventoryData() {
    if (!elements.inventoryTable) return;
    
    elements.inventoryTable.innerHTML = '';
    
    state.products.forEach(product => {
        const row = document.createElement('tr');
        
        // Determine stock status
        let statusClass = 'stock-high';
        let statusText = 'In Stock';
        
        if (product.status === 'low' || product.stock < 100) {
            statusClass = 'stock-low';
            statusText = 'Low Stock';
        } else if (product.status === 'medium' || product.stock < 200) {
            statusClass = 'stock-medium';
            statusText = 'Medium Stock';
        }
        
        row.innerHTML = `
            <td>${product.name}</td>
            <td>${formatCategory(product.category)}</td>
            <td>${product.stock} units</td>
            <td>100</td>
            <td><span class="product-stock ${statusClass}">${statusText}</span></td>
            <td>${new Date().toLocaleDateString()}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action" onclick="updateProductStock(${product.id})" title="Update Stock">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action" onclick="viewProduct(${product.id})" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </td>
        `;
        
        elements.inventoryTable.appendChild(row);
    });
}

// ============================================
// CUSTOMERS MANAGEMENT
// ============================================
function loadCustomersData() {
    if (!elements.customersGrid) return;
    
    elements.customersGrid.innerHTML = '';
    
    state.customers.forEach(customer => {
        const customerCard = document.createElement('div');
        customerCard.className = 'customer-card';
        
        customerCard.innerHTML = `
            <div class="customer-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="customer-info">
                <h4>${customer.name}</h4>
                <p>${customer.email}</p>
                <p>${customer.phone} • ${customer.country}</p>
                <div class="customer-meta">
                    <span>${customer.orders} orders</span>
                    <span>KSh ${customer.total.toLocaleString()}</span>
                </div>
            </div>
        `;
        
        elements.customersGrid.appendChild(customerCard);
    });
}

// ============================================
// ANALYTICS
// ============================================
function loadAnalyticsData() {
    // Charts are initialized separately
}

function initializeCharts() {
    // Sales Chart
    const salesCtx = document.getElementById('salesChart').getContext('2d');
    salesChart = new Chart(salesCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Sales (KSh)',
                data: [120000, 190000, 150000, 180000, 220000, 245800],
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            }
        }
    });
    
    // Products Chart
    const productsCtx = document.getElementById('productsChart').getContext('2d');
    productsChart = new Chart(productsCtx, {
        type: 'bar',
        data: {
            labels: ['Maize Flour', 'Millet Flour', 'Atta', 'Self Raising', 'Baking'],
            datasets: [{
                label: 'Sales Volume (kg)',
                data: [4500, 3200, 2800, 1500, 1200],
                backgroundColor: [
                    '#2E7D32',
                    '#4CAF50',
                    '#81C784',
                    '#FF9800',
                    '#FFB74D'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// ============================================
// NOTIFICATIONS
// ============================================
function loadNotifications() {
    if (!elements.notificationList) return;
    
    elements.notificationList.innerHTML = '';
    
    state.notifications.forEach(notification => {
        const notificationItem = document.createElement('div');
        notificationItem.className = `notification-item ${notification.read ? '' : 'unread'}`;
        
        // Set icon based on type
        let iconClass = 'fas fa-bell';
        let iconBg = 'info';
        
        switch(notification.type) {
            case 'order': iconClass = 'fas fa-shopping-cart'; iconBg = 'success'; break;
            case 'stock': iconClass = 'fas fa-exclamation-triangle'; iconBg = 'warning'; break;
            case 'payment': iconClass = 'fas fa-money-bill-wave'; iconBg = 'success'; break;
        }
        
        notificationItem.innerHTML = `
            <div class="notification-icon ${iconBg}">
                <i class="${iconClass}"></i>
            </div>
            <div class="notification-content">
                <h5>${notification.title}</h5>
                <p>${notification.message}</p>
                <span class="notification-time">${notification.time}</span>
            </div>
        `;
        
        elements.notificationList.appendChild(notificationItem);
    });
    
    // Update notification count
    const unreadCount = state.notifications.filter(n => !n.read).length;
    elements.notificationCount.textContent = unreadCount;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function updateDateTime() {
    if (!elements.currentDateTime) return;
    
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    
    elements.currentDateTime.textContent = now.toLocaleDateString('en-US', options);
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

function showModal(modal) {
    if (!modal) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function hideModal(modal) {
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function hideAllModals() {
    elements.modals.forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = 'auto';
}

function showAlert(message, type = 'success') {
    if (!elements.adminAlert || !elements.alertMessage) return;
    
    elements.alertMessage.textContent = message;
    elements.adminAlert.className = `alert ${type} active`;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        elements.adminAlert.classList.remove('active');
    }, 5000);
}

// ============================================
// ACTION FUNCTIONS (Exported to window)
// ============================================
window.viewOrderDetails = function(orderId) {
    const order = state.orders.find(o => o.id === orderId);
    
    if (!order) {
        showAlert('Order not found', 'error');
        return;
    }
    
    elements.orderDetailsContent.innerHTML = `
        <div class="order-details-grid">
            <div class="detail-group">
                <h4>Order Information</h4>
                <p><strong>Order ID:</strong> ${order.id}</p>
                <p><strong>Date:</strong> ${order.date || 'N/A'}</p>
                <p><strong>Status:</strong> <span class="status-badge status-${order.status}">${order.status}</span></p>
            </div>
            
            <div class="detail-group">
                <h4>Customer Information</h4>
                <p><strong>Name:</strong> ${order.customer || 'N/A'}</p>
                <p><strong>Contact:</strong> ${order.phone || 'N/A'}</p>
                <p><strong>Email:</strong> ${order.email || 'N/A'}</p>
            </div>
            
            <div class="detail-group">
                <h4>Order Details</h4>
                <p><strong>Product:</strong> ${order.product || 'N/A'}</p>
                <p><strong>Quantity:</strong> ${order.quantity || 0} kg</p>
                <p><strong>Unit Price:</strong> KSh ${order.unitPrice || order.price || 0}</p>
                <p><strong>Total Amount:</strong> KSh ${order.amount || 'N/A'}</p>
            </div>
            
            <div class="detail-group">
                <h4>Delivery Information</h4>
                <p><strong>Address:</strong> ${order.address || 'N/A'}</p>
                <p><strong>Country:</strong> ${order.country || 'N/A'}</p>
                <p><strong>Notes:</strong> ${order.notes || 'No special instructions'}</p>
            </div>
        </div>
        
        <div class="order-actions">
            <button class="btn btn-secondary" onclick="updateOrderStatus('${order.id}')">
                <i class="fas fa-edit"></i> Update Status
            </button>
            <button class="btn btn-primary" onclick="printOrder('${order.id}')">
                <i class="fas fa-print"></i> Print Invoice
            </button>
        </div>
    `;
    
    showModal(elements.orderDetailsModal);
};

window.updateOrderStatus = async function(orderId) {
    const newStatus = prompt('Enter new status (pending, processing, confirmed, delivered, cancelled):', 'pending');
    
    if (newStatus && ['pending', 'processing', 'confirmed', 'delivered', 'cancelled'].includes(newStatus.toLowerCase())) {
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/api/inquiries/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showAlert(`Order ${orderId} status updated to ${newStatus}`, 'success');
                // Reload data
                await loadData();
                loadOrdersData();
                loadRecentOrders();
            } else {
                showAlert(data.error || 'Failed to update status', 'error');
            }
        } catch (error) {
            console.error('Update status error:', error);
            showAlert('Failed to update order status', 'error');
        }
    }
};

window.deleteOrder = function(orderId) {
    if (confirm(`Are you sure you want to delete order ${orderId}?`)) {
        state.orders = state.orders.filter(o => o.id !== orderId);
        loadOrdersData();
        loadRecentOrders();
        showAlert(`Order ${orderId} deleted successfully`, 'success');
    }
};

window.reorderProduct = function(productId) {
    const product = state.products.find(p => p.id === productId);
    
    if (!product) {
        showAlert('Product not found', 'error');
        return;
    }
    
    const quantity = prompt(`Enter reorder quantity for ${product.name}:`, '500');
    
    if (quantity && !isNaN(quantity)) {
        product.stock += parseInt(quantity);
        product.status = product.stock < 100 ? 'low' : product.stock < 200 ? 'medium' : 'high';
        
        // Update UI
        loadProductsData();
        loadInventoryData();
        loadLowStockAlerts();
        
        showAlert(`Added ${quantity} units to ${product.name} stock`, 'success');
    }
};

window.editProduct = function(productId) {
    const product = state.products.find(p => p.id === productId);
    
    if (!product) {
        showAlert('Product not found', 'error');
        return;
    }
    
    // Fill form with product data
    document.getElementById('productName').value = product.name;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productWeight').value = product.weight;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productStock').value = product.stock;
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('productImage').value = product.image_url || '';
    document.getElementById('productFeatured').checked = product.featured || false;
    
    showModal(elements.productModal);
    
    // Change form to edit mode
    const form = elements.productForm;
    form.dataset.editId = productId;
    form.querySelector('button[type="submit"]').textContent = 'Update Product';
};

window.deleteProduct = function(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        state.products = state.products.filter(p => p.id !== productId);
        loadProductsData();
        loadInventoryData();
        showAlert('Product deleted successfully', 'success');
    }
};

window.viewProduct = function(productId) {
    const product = state.products.find(p => p.id === productId);
    
    if (!product) {
        showAlert('Product not found', 'error');
        return;
    }
    
    alert(`Product Details:\n\nName: ${product.name}\nCategory: ${formatCategory(product.category)}\nPrice: KSh ${product.price}\nStock: ${product.stock} units\nWeight: ${product.weight}\n\nDescription: ${product.description || 'No description available'}`);
};

window.updateProductStock = function(productId) {
    const product = state.products.find(p => p.id === productId);
    
    if (!product) {
        showAlert('Product not found', 'error');
        return;
    }
    
    const newStock = prompt(`Enter new stock quantity for ${product.name}:`, product.stock);
    
    if (newStock && !isNaN(newStock)) {
        product.stock = parseInt(newStock);
        product.status = product.stock < 100 ? 'low' : product.stock < 200 ? 'medium' : 'high';
        
        // Update UI
        loadProductsData();
        loadInventoryData();
        loadLowStockAlerts();
        
        showAlert(`${product.name} stock updated to ${newStock} units`, 'success');
    }
};

window.printOrder = function(orderId) {
    window.print();
};

// ============================================
// LOGOUT
// ============================================
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear stored data (use consistent keys)
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
        
        // Redirect to main site
        window.location.href = 'index.html';
    }
}