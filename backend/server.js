// ============================================
// AJAB FLOUR BACKEND SERVER - PORT 5300
// ============================================

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('./database');
require('dotenv').config();

const app = express();
const PORT = 5300; // Changed to 5300
const JWT_SECRET = process.env.JWT_SECRET || 'ajab_flour_secret_key_2024';

// Initialize database
const db = new Database();
let isDatabaseConnected = false;

// ===== MIDDLEWARE SETUP =====
app.use(cors({
    origin: [
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'http://localhost:3300',
        'http://127.0.0.1:3300',
        'https://ajab-flour-hub.netlify.app', // Your Netlify URL
        'https://*.netlify.app'               // Allow all Netlify subdomains
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept']
}));
// Handle preflight requests
app.options('*', cors());

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ success: false, error: 'Access denied. No token provided.' });
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ success: false, error: 'Invalid or expired token.' });
        req.user = user;
        next();
    });
};

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Admin access required.' });
    next();
};

const isAdminOrSales = (req, res, next) => {
    if (!['admin', 'sales'].includes(req.user.role)) return res.status(403).json({ success: false, error: 'Admin or sales access required.' });
    next();
};

// In-memory fallback
const inMemoryDB = {
    users: [],
    products: [],
    orders: [],
    carts: [],
    cartItems: [],
    faqs: []
};

// ============================================
// API ROUTES
// ============================================

// Health check
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '🚀 Ajab Flour API is running!',
        version: '2.0.0',
        database: isDatabaseConnected ? 'Connected to PostgreSQL' : 'Using in-memory demo',
        endpoints: {
            products: 'GET /api/products',
            register: 'POST /api/register',
            login: 'POST /api/login',
            cart: 'GET/POST /api/cart',
            checkout: 'POST /api/checkout',
            orders: 'GET /api/orders',
            chatbot: 'POST /api/chatbot/query'
        }
    });
});

// Get all products
app.get('/api/products', async (req, res) => {
    try {
        if (isDatabaseConnected) {
            const result = await db.query('SELECT * FROM products ORDER BY id');
            if (result.success) {
                return res.json({ success: true, products: result.data });
            }
        }
        res.json({ success: true, products: inMemoryDB.products });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        if (isDatabaseConnected) {
            const result = await db.query('SELECT * FROM products WHERE id = $1', [id]);
            if (result.success && result.data.length > 0) {
                return res.json({ success: true, product: result.data[0] });
            }
        }
        
        const product = inMemoryDB.products.find(p => p.id === parseInt(id));
        if (product) {
            res.json({ success: true, product });
        } else {
            res.status(404).json({ success: false, error: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// User registration
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password, country_code, phone } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, error: 'Name, email, and password are required' });
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        if (isDatabaseConnected) {
            // Check if user exists
            const checkResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
            if (checkResult.success && checkResult.data.length > 0) {
                return res.status(400).json({ success: false, error: 'User already exists' });
            }
            
            // Insert user
            const insertResult = await db.query(
                `INSERT INTO users (name, email, password, country_code, phone, role) 
                 VALUES ($1, $2, $3, $4, $5, 'customer') 
                 RETURNING id, name, email, country_code, phone, role, created_at`,
                [name, email, hashedPassword, country_code || '+254', phone || '']
            );
            
            if (insertResult.success && insertResult.data.length > 0) {
                const user = insertResult.data[0];
                const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
                
                return res.json({
                    success: true,
                    message: 'Registration successful',
                    user,
                    token
                });
            }
        }
        
        // In-memory fallback
        const existingUser = inMemoryDB.users.find(u => u.email === email);
        if (existingUser) {
            return res.status(400).json({ success: false, error: 'User already exists' });
        }
        
        const newUser = {
            id: inMemoryDB.users.length + 1,
            name,
            email,
            password: hashedPassword,
            country_code: country_code || '+254',
            phone: phone || '',
            role: 'customer',
            created_at: new Date()
        };
        inMemoryDB.users.push(newUser);
        
        const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });
        
        res.json({
            success: true,
            message: 'Registration successful (demo mode)',
            user: { ...newUser, password: undefined },
            token
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, error: 'Registration failed' });
    }
});

// User login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email and password are required' });
        }
        
        console.log(`Login attempt: ${email}`);
        
        // Try database first
        if (isDatabaseConnected) {
            const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
            if (result.success && result.data.length > 0) {
                const user = result.data[0];
                const validPassword = await bcrypt.compare(password, user.password);
                
                if (validPassword) {
                    const token = jwt.sign(
                        { id: user.id, email: user.email, role: user.role },
                        JWT_SECRET,
                        { expiresIn: '7d' }
                    );
                    
                    return res.json({
                        success: true,
                        message: 'Login successful',
                        user: { ...user, password: undefined },
                        token
                    });
                }
            }
        }
        
        // Demo credentials
        const demoCredentials = {
            'admin@ajabflour.co.ke': { password: 'admin123', role: 'admin', name: 'Admin User' },
            'sales@ajabflour.co.ke': { password: 'sales123', role: 'sales', name: 'Sales Manager' },
            'customer@example.com': { password: 'customer123', role: 'customer', name: 'John Customer' }
        };
        
        if (demoCredentials[email] && demoCredentials[email].password === password) {
            const user = {
                id: email === 'admin@ajabflour.co.ke' ? 1 : email === 'sales@ajabflour.co.ke' ? 2 : 3,
                name: demoCredentials[email].name,
                email: email,
                role: demoCredentials[email].role,
                country_code: '+254',
                phone: '0700000000'
            };
            
            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                JWT_SECRET,
                { expiresIn: '7d' }
            );
            
            return res.json({
                success: true,
                message: 'Login successful (demo mode)',
                user,
                token
            });
        }
        
        res.status(400).json({ success: false, error: 'Invalid email or password' });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, error: 'Login failed' });
    }
});

// Get user profile
app.get('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        if (isDatabaseConnected) {
            const result = await db.query(
                'SELECT id, name, email, country_code, phone, role, created_at FROM users WHERE id = $1',
                [req.user.id]
            );
            
            if (result.success && result.data.length > 0) {
                return res.json({ success: true, user: result.data[0] });
            }
        }
        
        const user = inMemoryDB.users.find(u => u.id === req.user.id);
        if (user) {
            res.json({ success: true, user });
        } else {
            res.status(404).json({ success: false, error: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get or create cart
app.get('/api/cart', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        if (isDatabaseConnected) {
            // Find or create cart
            let cartResult = await db.query('SELECT * FROM carts WHERE user_id = $1', [userId]);
            
            if (!cartResult.success || cartResult.data.length === 0) {
                cartResult = await db.query(
                    'INSERT INTO carts (user_id) VALUES ($1) RETURNING *',
                    [userId]
                );
            }
            
            const cart = cartResult.data[0];
            
            // Get cart items with product details
            const itemsResult = await db.query(`
                SELECT ci.*, p.name, p.image_url, p.weight 
                FROM cart_items ci
                JOIN products p ON ci.product_id = p.id
                WHERE ci.cart_id = $1
            `, [cart.id]);
            
            return res.json({
                success: true,
                cart: {
                    id: cart.id,
                    items: itemsResult.data || [],
                    total: itemsResult.data.reduce((sum, item) => sum + (item.price * item.quantity), 0)
                }
            });
        }
        
        // In-memory fallback
        let cart = inMemoryDB.carts.find(c => c.user_id === userId);
        if (!cart) {
            cart = { id: inMemoryDB.carts.length + 1, user_id: userId, items: [] };
            inMemoryDB.carts.push(cart);
        }
        
        res.json({
            success: true,
            cart: {
                id: cart.id,
                items: cart.items || [],
                total: (cart.items || []).reduce((sum, item) => sum + (item.price * item.quantity), 0)
            }
        });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add item to cart
app.post('/api/cart/add', authenticateToken, async (req, res) => {
    try {
        const { product_id, quantity } = req.body;
        const userId = req.user.id;
        
        if (!product_id || !quantity) {
            return res.status(400).json({ success: false, error: 'Product ID and quantity required' });
        }
        
        if (isDatabaseConnected) {
            // Get product price
            const productResult = await db.query('SELECT price FROM products WHERE id = $1', [product_id]);
            if (!productResult.success || productResult.data.length === 0) {
                return res.status(404).json({ success: false, error: 'Product not found' });
            }
            
            const price = productResult.data[0].price;
            
            // Get or create cart
            let cartResult = await db.query('SELECT id FROM carts WHERE user_id = $1', [userId]);
            let cartId;
            
            if (cartResult.success && cartResult.data.length > 0) {
                cartId = cartResult.data[0].id;
            } else {
                const newCart = await db.query('INSERT INTO carts (user_id) VALUES ($1) RETURNING id', [userId]);
                cartId = newCart.data[0].id;
            }
            
            // Check if item already in cart
            const existingItem = await db.query(
                'SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2',
                [cartId, product_id]
            );
            
            if (existingItem.success && existingItem.data.length > 0) {
                // Update quantity
                await db.query(
                    'UPDATE cart_items SET quantity = quantity + $1 WHERE id = $2',
                    [quantity, existingItem.data[0].id]
                );
            } else {
                // Insert new item
                await db.query(
                    'INSERT INTO cart_items (cart_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
                    [cartId, product_id, quantity, price]
                );
            }
            
            return res.json({ success: true, message: 'Item added to cart' });
        }
        
        // In-memory fallback
        let cart = inMemoryDB.carts.find(c => c.user_id === userId);
        if (!cart) {
            cart = { id: inMemoryDB.carts.length + 1, user_id: userId, items: [] };
            inMemoryDB.carts.push(cart);
        }
        
        const product = inMemoryDB.products.find(p => p.id === product_id);
        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }
        
        const existingItem = cart.items.find(i => i.product_id === product_id);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.items.push({
                product_id,
                quantity,
                price: product.price,
                name: product.name
            });
        }
        
        res.json({ success: true, message: 'Item added to cart (demo mode)' });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update cart item
app.put('/api/cart/update', authenticateToken, async (req, res) => {
    try {
        const { item_id, quantity } = req.body;
        const userId = req.user.id;
        
        if (!item_id || quantity === undefined) {
            return res.status(400).json({ success: false, error: 'Item ID and quantity required' });
        }
        
        if (isDatabaseConnected) {
            if (quantity <= 0) {
                await db.query('DELETE FROM cart_items WHERE id = $1', [item_id]);
            } else {
                await db.query('UPDATE cart_items SET quantity = $1 WHERE id = $2', [quantity, item_id]);
            }
            
            return res.json({ success: true, message: 'Cart updated' });
        }
        
        // In-memory fallback
        const cart = inMemoryDB.carts.find(c => c.user_id === userId);
        if (cart) {
            const itemIndex = cart.items.findIndex(i => i.product_id === item_id);
            if (itemIndex !== -1) {
                if (quantity <= 0) {
                    cart.items.splice(itemIndex, 1);
                } else {
                    cart.items[itemIndex].quantity = quantity;
                }
            }
        }
        
        res.json({ success: true, message: 'Cart updated (demo mode)' });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Remove from cart
app.delete('/api/cart/remove/:item_id', authenticateToken, async (req, res) => {
    try {
        const { item_id } = req.params;
        const userId = req.user.id;
        
        if (isDatabaseConnected) {
            await db.query('DELETE FROM cart_items WHERE id = $1', [item_id]);
            return res.json({ success: true, message: 'Item removed from cart' });
        }
        
        // In-memory fallback
        const cart = inMemoryDB.carts.find(c => c.user_id === userId);
        if (cart) {
            cart.items = cart.items.filter(i => i.product_id !== parseInt(item_id));
        }
        
        res.json({ success: true, message: 'Item removed from cart (demo mode)' });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Clear cart
app.delete('/api/cart/clear', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        if (isDatabaseConnected) {
            const cartResult = await db.query('SELECT id FROM carts WHERE user_id = $1', [userId]);
            if (cartResult.success && cartResult.data.length > 0) {
                await db.query('DELETE FROM cart_items WHERE cart_id = $1', [cartResult.data[0].id]);
            }
            return res.json({ success: true, message: 'Cart cleared' });
        }
        
        // In-memory fallback
        const cart = inMemoryDB.carts.find(c => c.user_id === userId);
        if (cart) {
            cart.items = [];
        }
        
        res.json({ success: true, message: 'Cart cleared (demo mode)' });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Checkout - create order
app.post('/api/checkout', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            customer_name, customer_email, customer_phone, customer_country,
            delivery_address, delivery_city, delivery_postal_code, delivery_notes,
            payment_method, items, subtotal, tax_amount, shipping_amount, total_amount
        } = req.body;
        
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, error: 'No items in cart' });
        }
        
        if (!customer_name || !customer_email || !delivery_address) {
            return res.status(400).json({ success: false, error: 'Customer information required' });
        }
        
        // Generate order number
        const orderNumber = `ORD-${Date.now().toString().slice(-8)}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
        
        if (isDatabaseConnected) {
            const client = await db.pool.connect();
            
            try {
                await client.query('BEGIN');
                
                // Create order
                const orderResult = await client.query(
                    `INSERT INTO orders (
                        order_number, user_id, customer_name, customer_email, customer_phone,
                        customer_country, delivery_address, delivery_city, delivery_postal_code,
                        delivery_notes, payment_method, subtotal, tax_amount, shipping_amount,
                        total_amount, status, payment_status
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'pending', 'pending')
                    RETURNING *`,
                    [
                        orderNumber, userId, customer_name, customer_email, customer_phone,
                        customer_country, delivery_address, delivery_city, delivery_postal_code,
                        delivery_notes || '', payment_method || 'mpesa', subtotal || 0,
                        tax_amount || 0, shipping_amount || 0, total_amount || 0
                    ]
                );
                
                const order = orderResult.rows[0];
                
                // Create order items and update stock
                for (const item of items) {
                    // Get current stock
                    const stockResult = await client.query(
                        'SELECT stock_quantity FROM products WHERE id = $1',
                        [item.id]
                    );
                    
                    const currentStock = stockResult.rows[0]?.stock_quantity || 0;
                    
                    // Insert order item
                    await client.query(
                        `INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, total_price)
                         VALUES ($1, $2, $3, $4, $5, $6)`,
                        [order.id, item.id, item.name, item.price, item.quantity, item.price * item.quantity]
                    );
                    
                    // Update stock
                    await client.query(
                        'UPDATE products SET stock_quantity = $1 WHERE id = $2',
                        [currentStock - item.quantity, item.id]
                    );
                }
                
                // Clear cart
                const cartResult = await client.query('SELECT id FROM carts WHERE user_id = $1', [userId]);
                if (cartResult.rows.length > 0) {
                    await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cartResult.rows[0].id]);
                }
                
                // Create payment record
                await client.query(
                    `INSERT INTO payments (order_id, payment_method, amount, status, phone_number)
                     VALUES ($1, $2, $3, 'pending', $4)`,
                    [order.id, payment_method || 'mpesa', total_amount, customer_phone]
                );
                
                // Create shipment record
                await client.query(
                    `INSERT INTO shipments (order_id, carrier, status, estimated_delivery)
                     VALUES ($1, 'Ajab Logistics', 'pending', CURRENT_DATE + INTERVAL '7 days')`,
                    [order.id]
                );
                
                await client.query('COMMIT');
                
                res.json({
                    success: true,
                    message: 'Order created successfully',
                    order: {
                        id: order.id,
                        order_number: order.order_number,
                        total_amount: order.total_amount,
                        created_at: order.created_at
                    }
                });
                
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
        } else {
            // In-memory order creation
            const order = {
                id: Date.now(),
                order_number: orderNumber,
                user_id: userId,
                customer_name,
                customer_email,
                total_amount,
                created_at: new Date(),
                status: 'pending'
            };
            inMemoryDB.orders.push(order);
            
            res.json({
                success: true,
                message: 'Order created successfully (demo mode)',
                order
            });
        }
        
    } catch (error) {
        console.error('Checkout error:', error);
        res.status(500).json({ success: false, error: 'Failed to create order: ' + error.message });
    }
});

// Get user orders
app.get('/api/orders', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        if (isDatabaseConnected) {
            const ordersResult = await db.query(
                `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
                [userId]
            );
            
            return res.json({ success: true, orders: ordersResult.data || [] });
        }
        
        const orders = inMemoryDB.orders.filter(o => o.user_id === userId);
        res.json({ success: true, orders });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get order details
app.get('/api/orders/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        if (isDatabaseConnected) {
            const orderResult = await db.query(
                'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
                [id, userId]
            );
            
            if (!orderResult.success || orderResult.data.length === 0) {
                return res.status(404).json({ success: false, error: 'Order not found' });
            }
            
            const itemsResult = await db.query(
                'SELECT * FROM order_items WHERE order_id = $1',
                [id]
            );
            
            return res.json({
                success: true,
                order: orderResult.data[0],
                items: itemsResult.data || []
            });
        }
        
        const order = inMemoryDB.orders.find(o => o.id === parseInt(id) && o.user_id === userId);
        if (order) {
            res.json({ success: true, order, items: [] });
        } else {
            res.status(404).json({ success: false, error: 'Order not found' });
        }
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// ADMIN ROUTES
// ============================================

// Get all orders (admin)
app.get('/api/admin/orders', authenticateToken, isAdminOrSales, async (req, res) => {
    try {
        if (isDatabaseConnected) {
            const result = await db.query(`
                SELECT o.*, u.name as user_name 
                FROM orders o
                LEFT JOIN users u ON o.user_id = u.id
                ORDER BY o.created_at DESC
                LIMIT 100
            `);
            
            return res.json({ success: true, orders: result.data || [] });
        }
        
        res.json({ success: true, orders: inMemoryDB.orders });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update order status (admin)
app.put('/api/admin/orders/:id/status', authenticateToken, isAdminOrSales, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!status || !['pending', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled'].includes(status)) {
            return res.status(400).json({ success: false, error: 'Invalid status' });
        }
        
        if (isDatabaseConnected) {
            await db.query('UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [status, id]);
            return res.json({ success: true, message: 'Order status updated' });
        }
        
        res.json({ success: true, message: 'Order status updated (demo mode)' });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update payment status (admin)
app.put('/api/admin/orders/:id/payment', authenticateToken, isAdminOrSales, async (req, res) => {
    try {
        const { id } = req.params;
        const { payment_status, payment_reference } = req.body;
        
        if (!payment_status || !['pending', 'paid', 'failed', 'refunded'].includes(payment_status)) {
            return res.status(400).json({ success: false, error: 'Invalid payment status' });
        }
        
        if (isDatabaseConnected) {
            await db.query(
                'UPDATE orders SET payment_status = $1, payment_reference = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
                [payment_status, payment_reference || null, id]
            );
            return res.json({ success: true, message: 'Payment status updated' });
        }
        
        res.json({ success: true, message: 'Payment status updated (demo mode)' });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get dashboard stats (admin)
app.get('/api/admin/dashboard/stats', authenticateToken, isAdminOrSales, async (req, res) => {
    try {
        let stats = {
            total_orders: 0,
            pending_orders: 0,
            processing_orders: 0,
            completed_orders: 0,
            total_revenue: 0,
            total_customers: 0,
            total_products: 0,
            low_stock_items: 0
        };
        
        if (isDatabaseConnected) {
            // Total orders
            const totalOrders = await db.query('SELECT COUNT(*) FROM orders');
            if (totalOrders.success) stats.total_orders = parseInt(totalOrders.data[0].count);
            
            // Pending orders
            const pendingOrders = await db.query("SELECT COUNT(*) FROM orders WHERE status = 'pending'");
            if (pendingOrders.success) stats.pending_orders = parseInt(pendingOrders.data[0].count);
            
            // Processing orders
            const processingOrders = await db.query("SELECT COUNT(*) FROM orders WHERE status = 'processing'");
            if (processingOrders.success) stats.processing_orders = parseInt(processingOrders.data[0].count);
            
            // Completed orders
            const completedOrders = await db.query("SELECT COUNT(*) FROM orders WHERE status = 'delivered'");
            if (completedOrders.success) stats.completed_orders = parseInt(completedOrders.data[0].count);
            
            // Total revenue
            const revenue = await db.query("SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE payment_status = 'paid'");
            if (revenue.success) stats.total_revenue = parseFloat(revenue.data[0].coalesce);
            
            // Total customers
            const customers = await db.query("SELECT COUNT(*) FROM users WHERE role = 'customer'");
            if (customers.success) stats.total_customers = parseInt(customers.data[0].count);
            
            // Total products
            const products = await db.query('SELECT COUNT(*) FROM products');
            if (products.success) stats.total_products = parseInt(products.data[0].count);
            
            // Low stock items
            const lowStock = await db.query('SELECT COUNT(*) FROM products WHERE stock_quantity < 100');
            if (lowStock.success) stats.low_stock_items = parseInt(lowStock.data[0].count);
            
            return res.json({ success: true, stats });
        }
        
        // Demo stats
        stats = {
            total_orders: 156,
            pending_orders: 23,
            processing_orders: 45,
            completed_orders: 78,
            total_revenue: 245800,
            total_customers: 1245,
            total_products: 48,
            low_stock_items: 3
        };
        
        res.json({ success: true, stats });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all users (admin)
app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        if (isDatabaseConnected) {
            const result = await db.query(
                'SELECT id, name, email, country_code, phone, role, created_at FROM users ORDER BY id'
            );
            return res.json({ success: true, users: result.data || [] });
        }
        
        res.json({ success: true, users: inMemoryDB.users });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add product (admin)
app.post('/api/admin/products', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name, description, category, weight, price, stock_quantity, image_url, is_featured } = req.body;
        
        if (!name || !category || !price) {
            return res.status(400).json({ success: false, error: 'Name, category, and price are required' });
        }
        
        if (isDatabaseConnected) {
            const result = await db.query(
                `INSERT INTO products (name, description, category, weight, price, stock_quantity, image_url, is_featured)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
                [name, description || '', category, weight || '', price, stock_quantity || 0, image_url || '', is_featured || false]
            );
            
            return res.json({ success: true, product: result.data[0] });
        }
        
        const newProduct = {
            id: inMemoryDB.products.length + 1,
            name,
            description,
            category,
            weight,
            price,
            stock_quantity,
            image_url,
            is_featured
        };
        inMemoryDB.products.push(newProduct);
        
        res.json({ success: true, product: newProduct });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update product (admin)
app.put('/api/admin/products/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        if (isDatabaseConnected) {
            const result = await db.query(
                `UPDATE products 
                 SET name = COALESCE($1, name),
                     description = COALESCE($2, description),
                     category = COALESCE($3, category),
                     weight = COALESCE($4, weight),
                     price = COALESCE($5, price),
                     stock_quantity = COALESCE($6, stock_quantity),
                     image_url = COALESCE($7, image_url),
                     is_featured = COALESCE($8, is_featured)
                 WHERE id = $9 RETURNING *`,
                [updates.name, updates.description, updates.category, updates.weight, updates.price, updates.stock_quantity, updates.image_url, updates.is_featured, id]
            );
            
            if (result.success && result.data.length > 0) {
                return res.json({ success: true, product: result.data[0] });
            }
            return res.status(404).json({ success: false, error: 'Product not found' });
        }
        
        res.json({ success: true, message: 'Product updated (demo mode)' });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete product (admin)
app.delete('/api/admin/products/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        if (isDatabaseConnected) {
            await db.query('DELETE FROM products WHERE id = $1', [id]);
            return res.json({ success: true, message: 'Product deleted' });
        }
        
        res.json({ success: true, message: 'Product deleted (demo mode)' });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// CHATBOT / AI ASSISTANT
// ============================================

// Get FAQs
app.get('/api/faqs', async (req, res) => {
    try {
        if (isDatabaseConnected) {
            const result = await db.query('SELECT * FROM faqs WHERE is_active = true ORDER BY id');
            return res.json({ success: true, faqs: result.data || [] });
        }
        
        res.json({
            success: true,
            faqs: [
                { id: 1, question: 'Where is your mill located?', answer: 'Our main mill is located in Nairobi, Kenya with distribution centers across East Africa.', category: 'general' },
                { id: 2, question: 'Do you deliver internationally?', answer: 'Yes, we deliver across Africa. Select your country during checkout for delivery options.', category: 'delivery' },
                { id: 3, question: 'What are your prices?', answer: 'Prices vary by product and quantity. Please check our product catalog or contact sales for bulk pricing.', category: 'pricing' },
                { id: 4, question: 'What is the shelf life of your flour?', answer: 'Our fortified flours have a shelf life of 6-8 months when stored in cool, dry conditions.', category: 'products' }
            ]
        });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// AI Chatbot query
app.post('/api/chatbot/query', async (req, res) => {
    try {
        const { question, session_id } = req.body;
        
        if (!question) {
            return res.json({
                success: true,
                response: "Hello! I'm Ajab Assistant. How can I help you today?",
                suggestions: [
                    "What products do you sell?",
                    "Do you deliver to my country?",
                    "What are your prices?",
                    "Where is your location?"
                ]
            });
        }
        
        // Get FAQs from database
        let faqs = [];
        if (isDatabaseConnected) {
            const result = await db.query('SELECT question, answer FROM faqs WHERE is_active = true');
            if (result.success) faqs = result.data;
        } else {
            faqs = [
                { question: 'Where is your mill located?', answer: 'Our main mill is located in Nairobi, Kenya with distribution centers across East Africa.' },
                { question: 'Do you deliver internationally?', answer: 'Yes, we deliver across Africa. Select your country during checkout for delivery options.' },
                { question: 'What are your prices?', answer: 'Prices vary by product and quantity. Please check our product catalog or contact sales for bulk pricing.' },
                { question: 'What is the shelf life of your flour?', answer: 'Our fortified flours have a shelf life of 6-8 months when stored in cool, dry conditions.' }
            ];
        }
        
        // Simple NLP matching
        const questionLower = question.toLowerCase();
        
        // Check for matches in FAQs
        for (const faq of faqs) {
            const faqWords = faq.question.toLowerCase().split(' ');
            const matchCount = faqWords.filter(word => 
                questionLower.includes(word) && word.length > 3
            ).length;
            
            if (matchCount >= 2 || questionLower.includes(faq.question.toLowerCase().substring(0, 15))) {
                return res.json({
                    success: true,
                    response: faq.answer,
                    suggestions: getSuggestions(faq.category)
                });
            }
        }
        
        // Keyword-based responses
        if (questionLower.includes('price') || questionLower.includes('cost')) {
            return res.json({
                success: true,
                response: 'Our flour prices range from KSh 250 to KSh 320 per kg depending on the product. For bulk orders, we offer special discounts. Would you like me to connect you with our sales team?',
                suggestions: ['Maize flour price', 'Bulk discount', 'Minimum order']
            });
        }
        
        if (questionLower.includes('delivery') || questionLower.includes('shipping')) {
            return res.json({
                success: true,
                response: 'We deliver across Africa within 3-7 business days. Delivery costs vary by location. For orders over 500kg, delivery is free within East Africa.',
                suggestions: ['Delivery to Tanzania', 'Shipping cost', 'Delivery time']
            });
        }
        
        if (questionLower.includes('product') || questionLower.includes('flour')) {
            return res.json({
                success: true,
                response: 'We offer Maize Flour, Millet Flour, Atta, Self Raising Flour, Baking Flour, and Whole Wheat Flour. All our products are fortified with essential vitamins.',
                suggestions: ['Maize flour details', 'Millet flour benefits', 'Whole wheat flour']
            });
        }
        
        if (questionLower.includes('order') || questionLower.includes('buy')) {
            return res.json({
                success: true,
                response: 'You can place orders directly on our website using the order form, or contact our sales team at sales@ajabflour.co.ke for bulk purchases.',
                suggestions: ['How to order', 'Bulk order', 'Payment methods']
            });
        }
        
        if (questionLower.includes('payment') || questionLower.includes('mpesa')) {
            return res.json({
                success: true,
                response: 'We accept M-Pesa (for Kenya), credit/debit cards, and bank transfers. For international orders, we accept wire transfers.',
                suggestions: ['M-Pesa payment', 'Bank details', 'Card payment']
            });
        }
        
        if (questionLower.includes('contact') || questionLower.includes('phone')) {
            return res.json({
                success: true,
                response: 'You can reach us at:\n📞 Phone: +254 700 000 000\n📧 Email: info@ajabflour.co.ke\n🏢 Office: Nairobi, Kenya',
                suggestions: ['Call me', 'Email support', 'Visit office']
            });
        }
        
        if (questionLower.includes('stock') || questionLower.includes('available')) {
            return res.json({
                success: true,
                response: 'All our products are currently in stock. For specific quantities, please check our product catalog or contact sales.',
                suggestions: ['Check stock', 'Bulk availability', 'Restock date']
            });
        }
        
        // Default response
        res.json({
            success: true,
            response: "Thank you for your question. I'm not sure I understand. Would you like to speak with a customer service representative or try one of these common questions?",
            suggestions: [
                "What products do you sell?",
                "How do I place an order?",
                "Do you deliver to my country?",
                "Contact customer care"
            ]
        });
        
    } catch (error) {
        console.error('Chatbot error:', error);
        res.json({
            success: true,
            response: "I apologize, but I'm having trouble processing your request. Please contact our customer care at +254 700 000 000.",
            suggestions: ['Call customer care', 'Send email', 'Visit our website']
        });
    }
});

function getSuggestions(category) {
    const suggestions = {
        general: ['Where are you located?', 'Contact information', 'Working hours'],
        delivery: ['Delivery to Tanzania', 'Shipping cost', 'Delivery time'],
        pricing: ['Maize flour price', 'Bulk discount', 'Payment terms'],
        products: ['Product catalog', 'Nutrition information', 'Shelf life'],
        orders: ['How to order', 'Track my order', 'Cancel order'],
        payments: ['M-Pesa payment', 'Bank transfer', 'Card payment']
    };
    
    return suggestions[category] || ['Contact sales', 'Product catalog', 'Delivery info'];
}

// M-Pesa payment simulation
app.post('/api/mpesa/stkpush', authenticateToken, async (req, res) => {
    try {
        const { phone, amount, order_id } = req.body;
        
        if (!phone || !amount) {
            return res.status(400).json({ success: false, error: 'Phone and amount required' });
        }
        
        // Simulate M-Pesa STK Push
        const transaction_id = `MPESA${Date.now()}`;
        
        res.json({
            success: true,
            message: 'M-Pesa STK Push sent. Check your phone to complete payment.',
            transaction_id,
            merchant_request_id: `REQ${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
            checkout_request_id: `CHK${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
            response_code: '0',
            response_description: 'Success. Request accepted for processing'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// M-Pesa callback (for simulation)
app.post('/api/mpesa/callback', (req, res) => {
    console.log('M-Pesa Callback received:', req.body);
    res.json({ ResultCode: 0, ResultDesc: 'Success' });
});

// Get countries list
app.get('/api/countries', (req, res) => {
    const countries = [
        { code: '+254', name: 'Kenya', flag: '🇰🇪' },
        { code: '+255', name: 'Tanzania', flag: '🇹🇿' },
        { code: '+256', name: 'Uganda', flag: '🇺🇬' },
        { code: '+250', name: 'Rwanda', flag: '🇷🇼' },
        { code: '+257', name: 'Burundi', flag: '🇧🇮' },
        { code: '+27', name: 'South Africa', flag: '🇿🇦' },
        { code: '+234', name: 'Nigeria', flag: '🇳🇬' },
        { code: '+233', name: 'Ghana', flag: '🇬🇭' },
        { code: '+251', name: 'Ethiopia', flag: '🇪🇹' },
        { code: '+20', name: 'Egypt', flag: '🇪🇬' },
        { code: '+212', name: 'Morocco', flag: '🇲🇦' },
        { code: '+254', name: 'Kenya', flag: '🇰🇪' }
    ];
    
    res.json({ success: true, countries });
});

// Database health check
app.get('/api/health', async (req, res) => {
    let dbStatus = 'disconnected';
    let tables = {};
    
    if (isDatabaseConnected) {
        try {
            const result = await db.query('SELECT NOW() as time');
            if (result.success) {
                dbStatus = 'connected';
                
                // Get table counts
                const tablesList = ['users', 'products', 'orders', 'payments', 'faqs'];
                for (const table of tablesList) {
                    const count = await db.query(`SELECT COUNT(*) FROM ${table}`);
                    if (count.success) {
                        tables[table] = parseInt(count.data[0].count);
                    }
                }
            }
        } catch (error) {
            dbStatus = 'error';
        }
    }
    
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: dbStatus,
        tables: tables,
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

// ============================================
// START SERVER
// ============================================

async function startServer() {
    // Initialize database
    const dbInit = await db.initialize();
    isDatabaseConnected = dbInit.connected;
    
    app.listen(PORT, () => {
        console.log('\n' + '='.repeat(60));
        console.log('🚀 AJAB FLOUR BACKEND SERVER v2.0');
        console.log('='.repeat(60));
        console.log(`✅ Server running on: http://localhost:${PORT}`);
        console.log(`📊 Database: ${isDatabaseConnected ? '✅ PostgreSQL Connected' : '📦 Using In-memory Demo'}`);
        console.log(`🔐 JWT Secret: ${JWT_SECRET ? 'Configured' : 'Using default'}`);
        console.log('\n📡 Available Endpoints:');
        console.log('   Public:');
        console.log('   GET  /              - Server status');
        console.log('   GET  /api/products  - Get all products');
        console.log('   POST /api/register  - Register user');
        console.log('   POST /api/login     - Login user');
        console.log('   POST /api/chatbot   - AI Assistant');
        console.log('\n   Protected (Auth Required):');
        console.log('   GET  /api/cart      - Get user cart');
        console.log('   POST /api/cart/add  - Add to cart');
        console.log('   POST /api/checkout  - Create order');
        console.log('   GET  /api/orders    - Get user orders');
        console.log('\n   Admin (Admin/Sales Only):');
        console.log('   GET  /api/admin/dashboard/stats - Dashboard stats');
        console.log('   GET  /api/admin/orders          - All orders');
        console.log('   POST /api/admin/products        - Add product');
        console.log('='.repeat(60));
        console.log('\n💡 Demo Credentials:');
        console.log('   Admin:  admin@ajabflour.co.ke / admin123');
        console.log('   Sales:  sales@ajabflour.co.ke / sales123');
        console.log('   Customer: customer@example.com / customer123\n');
    });
}

startServer();

// Error handling
app.use((req, res) => {
    res.status(404).json({ success: false, error: `Route ${req.method} ${req.url} not found` });
});

app.use((err, req, res, next) => {
    console.error('Global error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
});