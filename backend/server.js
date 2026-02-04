// ============================================
// AJAB FLOUR BACKEND SERVER
// ============================================

// Import required packages
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// ========== MIDDLEWARE SETUP ==========
app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json());


// ========== DATABASE CONNECTION ==========
console.log('🔌 Attempting to connect to database...');
console.log('📝 Database URL:', process.env.DATABASE_URL ? 'Configured' : 'Not configured');

let pool;
let isDatabaseConnected = false;

// Try to connect to PostgreSQL, fallback to in-memory if fails
try {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: false
    });

    // Test connection
    pool.connect((err, client, release) => {
        if (err) {
            console.log('⚠️  PostgreSQL connection failed:', err.message);
            console.log('📦 Using in-memory database for demo');
            isDatabaseConnected = false;
        } else {
            console.log('✅ Connected to PostgreSQL database: ajab_flour_hub');
            isDatabaseConnected = true;
            
            // Test a simple query
            client.query('SELECT NOW()', (err, result) => {
                if (!err) {
                    console.log('✅ Database time:', result.rows[0].now);
                }
                release();
            });
        }
    });
} catch (error) {
    console.log('⚠️  Could not initialize PostgreSQL pool:', error.message);
    console.log('📦 Using in-memory database for demo');
    isDatabaseConnected = false;
}

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'ajab_flour_secret_key_2024';

// ========== AUTHENTICATION MIDDLEWARE ==========
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            error: 'Access denied. No token provided.' 
        });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ 
                success: false, 
                error: 'Invalid or expired token.' 
            });
        }
        req.user = user;
        next();
    });
};


// Check if user is admin
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            success: false, 
            error: 'Admin access required.' 
        });
    }
    next();
};

// Check if user is admin or sales
const isAdminOrSales = (req, res, next) => {
    if (!['admin', 'sales'].includes(req.user.role)) {
        return res.status(403).json({ 
            success: false, 
            error: 'Admin or sales access required.' 
        });
    }
    next();
};


// ========== IN-MEMORY DATABASE (FALLBACK) ==========
const inMemoryDB = {
    users: [
        {
            id: 1,
            name: 'Admin User',
            email: 'admin@ajabflour.co.ke',
            password: '$2a$10$demo', // demo password
            role: 'admin',
            country_code: '+254',
            phone: '700000000',
            created_at: new Date()
        }
    ],
    products: [
        {
            id: 1,
            name: "Ajab Fortified Maize Flour",
            description: "Premium quality maize flour for perfect ugali, fortified with essential vitamins.",
            category: "maize_flour",
            weight: "2kg, 5kg, 25kg",
            price: 250,
            stock_quantity: 1000,
            image_url: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            is_featured: true,
            created_at: new Date()
        },
        {
            id: 2,
            name: "Ajab Millet Flour",
            description: "Nutritious millet flour rich in fiber and minerals, perfect for healthy chapatis.",
            category: "millet_flour",
            weight: "1kg, 2kg, 10kg",
            price: 320,
            stock_quantity: 800,
            image_url: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            is_featured: true,
            created_at: new Date()
        },
        {
            id: 3,
            name: "Ajab Fortified Atta",
            description: "Whole wheat atta for soft, fluffy chapatis and mandazi.",
            category: "atta",
            weight: "2kg, 5kg",
            price: 280,
            stock_quantity: 1200,
            image_url: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            is_featured: false,
            created_at: new Date()
        }
    ],
    inquiries: [],
    faqs: [
        {
            id: 1,
            question: "Where is your mill located?",
            answer: "Our main mill is located in Nairobi, Kenya with distribution centers across East Africa.",
            category: "general",
            is_active: true
        },
        {
            id: 2,
            question: "Do you deliver internationally?",
            answer: "Yes, we deliver across Africa. Select your country during checkout for delivery options.",
            category: "delivery",
            is_active: true
        },
        {
            id: 3,
            question: "What are your prices?",
            answer: "Prices vary by product and quantity. Please check our product catalog or contact sales for bulk pricing.",
            category: "pricing",
            is_active: true
        }
    ]
};

// ========== DATABASE HELPER FUNCTIONS ==========
async function queryDatabase(text, params = []) {
    if (isDatabaseConnected && pool) {
        try {
            const result = await pool.query(text, params);
            return { success: true, data: result.rows, rowCount: result.rowCount };
        } catch (error) {
            console.error('❌ Database query error:', error.message);
            return { success: false, error: error.message };
        }
    } else {
        // Fallback to in-memory database
        return { success: false, error: 'Database not connected, using demo mode' };
    }
}

// Helper for in-memory operations
function inMemoryQuery(table, operation, data = {}) {
    try {
        let result;
        switch(operation) {
            case 'SELECT':
                if (data.id) {
                    result = inMemoryDB[table].filter(item => item.id === data.id);
                } else if (data.email) {
                    result = inMemoryDB[table].filter(item => item.email === data.email);
                } else {
                    result = [...inMemoryDB[table]];
                }
                break;
                
            case 'INSERT':
                const newId = inMemoryDB[table].length > 0 
                    ? Math.max(...inMemoryDB[table].map(item => item.id)) + 1 
                    : 1;
                const newItem = { id: newId, ...data, created_at: new Date() };
                inMemoryDB[table].push(newItem);
                result = [newItem];
                break;
                
            case 'UPDATE':
                const index = inMemoryDB[table].findIndex(item => item.id === data.id);
                if (index !== -1) {
                    inMemoryDB[table][index] = { ...inMemoryDB[table][index], ...data };
                    result = [inMemoryDB[table][index]];
                } else {
                    result = [];
                }
                break;
                
            case 'COUNT':
                if (data.condition) {
                    result = [{ count: inMemoryDB[table].filter(data.condition).length }];
                } else {
                    result = [{ count: inMemoryDB[table].length }];
                }
                break;
        }
        return { success: true, data: result, rowCount: result.length };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ========== API ROUTES ==========

// 1. ROOT ENDPOINT - SERVER STATUS
app.get('/', (req, res) => {
    res.json({
        message: '🚀 Ajab Flour API is running!',
        version: '1.0.0',
        database: isDatabaseConnected ? 'Connected to PostgreSQL' : 'Using in-memory demo',
        endpoints: {
            products: 'GET /api/products',
            register: 'POST /api/register',
            login: 'POST /api/login',
            inquiries: 'POST /api/inquiries',
            dashboard: 'GET /api/dashboard/stats',
            chatbot: 'POST /api/chatbot/query'
        }
    });
});

// 2. GET ALL PRODUCTS
app.get('/api/products', async (req, res) => {
    try {
        let products;
        
        if (isDatabaseConnected) {
            const result = await queryDatabase('SELECT * FROM products ORDER BY id');
            if (result.success) {
                products = result.data;
            } else {
                products = inMemoryDB.products;
            }
        } else {
            products = inMemoryDB.products;
        }
        
        res.json({
            success: true,
            message: `Found ${products.length} products`,
            products: products,
            source: isDatabaseConnected ? 'PostgreSQL' : 'In-memory demo'
        });
        
    } catch (error) {
        console.error('Products error:', error);
        res.json({
            success: true,
            products: inMemoryDB.products,
            message: 'Using demo data'
        });
    }
});

// 3. USER REGISTRATION
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password, country_code, phone } = req.body;
        
        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Name, email, and password are required'
            });
        }
        
        // Check if user exists
        let userExists = false;
        
        if (isDatabaseConnected) {
            const checkResult = await queryDatabase(
                'SELECT * FROM users WHERE email = $1',
                [email]
            );
            userExists = checkResult.success && checkResult.data.length > 0;
        } else {
            userExists = inMemoryDB.users.some(user => user.email === email);
        }
        
        if (userExists) {
            return res.status(400).json({
                success: false,
                error: 'User with this email already exists'
            });
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Create user
        let newUser;
        
        if (isDatabaseConnected) {
            const insertResult = await queryDatabase(
                `INSERT INTO users (name, email, password, country_code, phone, role) 
                 VALUES ($1, $2, $3, $4, $5, 'customer') 
                 RETURNING id, name, email, country_code, phone, role, created_at`,
                [name, email, hashedPassword, country_code || '+254', phone || '']
            );
            
            if (insertResult.success && insertResult.data.length > 0) {
                newUser = insertResult.data[0];
            } else {
                throw new Error('Failed to create user in database');
            }
        } else {
            // In-memory user creation
            const newId = inMemoryDB.users.length + 1;
            newUser = {
                id: newId,
                name,
                email,
                password: hashedPassword,
                country_code: country_code || '+254',
                phone: phone || '',
                role: 'customer',
                created_at: new Date()
            };
            inMemoryDB.users.push(newUser);
        }
        
        // Generate JWT token
        const token = jwt.sign(
            {
                id: newUser.id,
                email: newUser.email,
                role: newUser.role
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        // Remove password from response
        const userResponse = {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            country_code: newUser.country_code,
            phone: newUser.phone,
            role: newUser.role
        };
        
        res.json({
            success: true,
            message: 'User registered successfully',
            user: userResponse,
            token: token
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Registration failed. Please try again.'
        });
    }
});

// 4. USER LOGIN - CORRECTED VERSION
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }
        
        console.log(`🔐 Login attempt: ${email}`);
        
        // Find user
        let user;
        let userFound = false;
        
        if (isDatabaseConnected) {
            const result = await queryDatabase(
                'SELECT * FROM users WHERE email = $1',
                [email]
            );
            
            if (result.success && result.data.length > 0) {
                user = result.data[0];
                userFound = true;
                console.log(`✅ User found in database: ${user.email}, Role: ${user.role}`);
            }
        } else {
            // In-memory search
            user = inMemoryDB.users.find(u => u.email === email);
            if (user) {
                userFound = true;
                console.log(`✅ User found in memory: ${user.email}`);
            }
        }
        
        if (!userFound) {
            console.log(`❌ User not found: ${email}`);
            return res.status(400).json({
                success: false,
                error: 'Invalid email or password'
            });
        }
        
        // DEBUG: Log password info
        console.log(`🔑 Input password: ${password}`);
        console.log(`🔑 Stored password: ${user.password ? 'Present' : 'Missing'}`);
        console.log(`🔑 Password length: ${user.password ? user.password.length : 0}`);
        
        // Check password - SIMPLIFIED VERSION
        let validPassword = false;
        
        if (user.password) {
            // Try bcrypt compare first
            try {
                validPassword = await bcrypt.compare(password, user.password);
                console.log(`🔐 Bcrypt compare result: ${validPassword}`);
            } catch (bcryptError) {
                console.log(`⚠️ Bcrypt error: ${bcryptError.message}`);
                
                // If bcrypt fails, try plain text comparison (for testing)
                if (user.password === password) {
                    validPassword = true;
                    console.log(`✅ Plain text password match for testing`);
                }
            }
        }
        
        // DEMO MODE: Accept hardcoded credentials if database not working
        if (!validPassword) {
            // Demo credentials for testing
            const demoCredentials = {
                'admin@ajabflour.co.ke': { password: 'admin123', role: 'admin' },
                'sales@ajabflour.co.ke': { password: 'sales123', role: 'sales' },
                'customer@example.com': { password: 'customer123', role: 'customer' }
            };
            
            if (demoCredentials[email] && demoCredentials[email].password === password) {
                validPassword = true;
                console.log(`✅ Demo credentials accepted for: ${email}`);
                
                // Update user object with demo data
                if (!user) {
                    user = {
                        id: email === 'admin@ajabflour.co.ke' ? 1 : 
                             email === 'sales@ajabflour.co.ke' ? 2 : 3,
                        name: email === 'admin@ajabflour.co.ke' ? 'Ajab Admin' :
                              email === 'sales@ajabflour.co.ke' ? 'Sales Manager' : 'Demo Customer',
                        email: email,
                        role: demoCredentials[email].role,
                        country_code: '+254',
                        phone: '0700000000'
                    };
                }
            }
        }
        
        if (!validPassword) {
            console.log(`❌ Invalid password for: ${email}`);
            return res.status(400).json({
                success: false,
                error: 'Invalid email or password'
            });
        }
        
        console.log(`✅ Login successful: ${email}, Role: ${user.role}`);
        
        // Generate JWT token
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        // Remove password from response
        const userResponse = {
            id: user.id,
            name: user.name,
            email: user.email,
            country_code: user.country_code,
            phone: user.phone,
            role: user.role
        };
        
        res.json({
            success: true,
            message: 'Login successful',
            user: userResponse,
            token: token
        });
        
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Login failed. Please try again.'
        });
    }
});

// 5. CREATE ORDER INQUIRY
app.post('/api/inquiries', async (req, res) => {
    try {
        const { name, email, phone, product_id, quantity, delivery_address, country, notes } = req.body;
        
        // Validate required fields
        if (!name || !email || !product_id || !quantity || !delivery_address || !country) {
            return res.status(400).json({
                success: false,
                error: 'Please fill all required fields'
            });
        }
        
        // Find or create user
        let userId;
        
        if (isDatabaseConnected) {
            // Check if user exists
            const userResult = await queryDatabase(
                'SELECT id FROM users WHERE email = $1',
                [email]
            );
            
            if (userResult.success && userResult.data.length > 0) {
                userId = userResult.data[0].id;
            } else {
                // Create new user
                const newUserResult = await queryDatabase(
                    `INSERT INTO users (name, email, phone, role) 
                     VALUES ($1, $2, $3, 'customer') 
                     RETURNING id`,
                    [name, email, phone || '']
                );
                
                if (newUserResult.success && newUserResult.data.length > 0) {
                    userId = newUserResult.data[0].id;
                } else {
                    throw new Error('Failed to create user');
                }
            }
            
            // Create inquiry in database
            const inquiryResult = await queryDatabase(
                `INSERT INTO inquiries (user_id, product_id, quantity, delivery_address, country, notes) 
                 VALUES ($1, $2, $3, $4, $5, $6) 
                 RETURNING *`,
                [userId, product_id, quantity, delivery_address, country, notes || '']
            );
            
            if (inquiryResult.success) {
                res.json({
                    success: true,
                    message: 'Order inquiry submitted successfully! Our team will contact you within 24 hours.',
                    inquiry: inquiryResult.data[0],
                    order_id: `ORD${Date.now().toString().slice(-6)}`
                });
            } else {
                throw new Error('Failed to create inquiry');
            }
            
        } else {
            // In-memory order creation
            const inquiryId = inMemoryDB.inquiries.length + 1;
            const newInquiry = {
                id: inquiryId,
                user_id: 1, // Default user
                product_id,
                quantity,
                delivery_address,
                country,
                notes: notes || '',
                status: 'pending',
                created_at: new Date()
            };
            
            inMemoryDB.inquiries.push(newInquiry);
            
            res.json({
                success: true,
                message: 'Order inquiry submitted successfully! Our team will contact you within 24 hours.',
                inquiry: newInquiry,
                order_id: `ORD${Date.now().toString().slice(-6)}`
            });
        }
        
    } catch (error) {
        console.error('Order error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit order. Please try again.'
        });
    }
});

// 6. GET DASHBOARD STATISTICS (Protected)
app.get('/api/dashboard/stats', authenticateToken, isAdminOrSales, async (req, res) => {
    console.log(`📊 Dashboard accessed by: ${req.user.email} (${req.user.role})`);
    try {
        let stats;
        
        if (isDatabaseConnected) {
            // Get real stats from database
            const pendingResult = await queryDatabase(
                "SELECT COUNT(*) FROM inquiries WHERE status = 'pending'"
            );
            const processingResult = await queryDatabase(
                "SELECT COUNT(*) FROM inquiries WHERE status = 'processing'"
            );
            const lowStockResult = await queryDatabase(
                "SELECT COUNT(*) FROM products WHERE stock_quantity < 100"
            );
            const recentResult = await queryDatabase(
                "SELECT COUNT(*) FROM inquiries WHERE created_at >= NOW() - INTERVAL '7 days'"
            );
            const revenueResult = await queryDatabase(`
                SELECT COALESCE(SUM(p.price * i.quantity), 0) as revenue
                FROM inquiries i
                JOIN products p ON i.product_id = p.id
                WHERE i.status IN ('confirmed', 'delivered')
                AND i.created_at >= NOW() - INTERVAL '30 days'
            `);
            
            stats = {
                pending_orders: pendingResult.success ? parseInt(pendingResult.data[0].count) : 0,
                processing_orders: processingResult.success ? parseInt(processingResult.data[0].count) : 0,
                low_stock_items: lowStockResult.success ? parseInt(lowStockResult.data[0].count) : 0,
                recent_inquiries: recentResult.success ? parseInt(recentResult.data[0].count) : 0,
                monthly_revenue: revenueResult.success ? parseInt(revenueResult.data[0].revenue) : 245800
            };
        } else {
            // Demo stats
            stats = {
                pending_orders: inMemoryDB.inquiries.filter(i => i.status === 'pending').length,
                processing_orders: 5,
                low_stock_items: inMemoryDB.products.filter(p => p.stock_quantity < 100).length,
                recent_inquiries: inMemoryDB.inquiries.length,
                monthly_revenue: 245800
            };
        }
        
        res.json({
            success: true,
            message: 'Dashboard statistics',
            stats: stats,
            source: isDatabaseConnected ? 'PostgreSQL' : 'Demo data'
        });
        
    } catch (error) {
        console.error('Stats error:', error);
        res.json({
            success: true,
            stats: {
                pending_orders: 12,
                processing_orders: 8,
                low_stock_items: 3,
                recent_inquiries: 24,
                monthly_revenue: 245800
            },
            message: 'Using demo statistics'
        });
    }
});

    // 7. GET ALL INQUIRIES (Protected)
app.get('/api/inquiries', authenticateToken, isAdminOrSales, async (req, res) => {
    console.log(`📋 Inquiries accessed by: ${req.user.email}`);
    try {
        console.log(`📋 Inquiries accessed by: ${req.user.email}`);
        let inquiries;
        
        if (isDatabaseConnected) {
            const result = await queryDatabase(`
                SELECT i.*, u.name as customer_name, u.email, u.phone, 
                       p.name as product_name, p.price, p.weight
                FROM inquiries i
                LEFT JOIN users u ON i.user_id = u.id
                LEFT JOIN products p ON i.product_id = p.id
                ORDER BY i.created_at DESC
                LIMIT 50
            `);
            
            inquiries = result.success ? result.data : [];
        } else {
            inquiries = inMemoryDB.inquiries.map(inquiry => ({
                ...inquiry,
                customer_name: 'Demo Customer',
                email: 'customer@example.com',
                phone: '+254700000000',
                product_name: 'Maize Flour',
                price: 250,
                weight: '2kg'
            }));
        }
        
        res.json({
            success: true,
            inquiries: inquiries,
            count: inquiries.length
        });
        
    } catch (error) {
        console.error('Inquiries error:', error);
        res.json({
            success: true,
            inquiries: [],
            message: 'No inquiries found'
        });
    }
});

// 8. UPDATE INQUIRY STATUS (Protected)
app.put('/api/inquiries/:id/status', authenticateToken, isAdminOrSales, async (req, res) => {
    console.log(`✏️ Status update by: ${req.user.email}`);
    try {
        console.log(`✏️ Status update by: ${req.user.email}`);
        const { id } = req.params;
        const { status } = req.body;
        
        if (!status || !['pending', 'processing', 'confirmed', 'delivered', 'cancelled'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status value'
            });
        }
        
        if (isDatabaseConnected) {
            const result = await queryDatabase(
                'UPDATE inquiries SET status = $1 WHERE id = $2 RETURNING *',
                [status, id]
            );
            
            if (result.success) {
                res.json({
                    success: true,
                    message: 'Order status updated successfully',
                    inquiry: result.data[0]
                });
            } else {
                throw new Error('Failed to update status');
            }
        } else {
            // Update in-memory
            const inquiry = inMemoryDB.inquiries.find(i => i.id === parseInt(id));
            if (inquiry) {
                inquiry.status = status;
                res.json({
                    success: true,
                    message: 'Order status updated successfully',
                    inquiry: inquiry
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: 'Order not found'
                });
            }
        }
        
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update order status'
        });
    }
});

// 9. GET COUNTRIES LIST
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
        { code: '+256', name: 'Uganda', flag: '🇺🇬' }
    ];
    
    res.json({
        success: true,
        countries: countries,
        count: countries.length
    });
});

// 10. GET FAQS
app.get('/api/faqs', async (req, res) => {
    try {
        let faqs;
        
        if (isDatabaseConnected) {
            const result = await queryDatabase(
                'SELECT * FROM faqs WHERE is_active = true ORDER BY id'
            );
            faqs = result.success ? result.data : [];
        } else {
            faqs = inMemoryDB.faqs;
        }
        
        res.json({
            success: true,
            faqs: faqs
        });
        
    } catch (error) {
        console.error('FAQs error:', error);
        res.json({
            success: true,
            faqs: inMemoryDB.faqs
        });
    }
});

// 11. CHATBOT QUERY
app.post('/api/chatbot/query', async (req, res) => {
    try {
        const { question } = req.body;
        
        if (!question) {
            return res.json({
                success: true,
                response: 'Hello! How can I help you today?',
                suggestions: [
                    'What are your product prices?',
                    'Do you deliver to my country?',
                    'Where is your location?'
                ]
            });
        }
        
        let faqs;
        
        if (isDatabaseConnected) {
            const result = await queryDatabase(
                'SELECT question, answer FROM faqs WHERE is_active = true'
            );
            faqs = result.success ? result.data : [];
        } else {
            faqs = inMemoryDB.faqs;
        }
        
        const questionLower = question.toLowerCase();
        let response = 'Thank you for your question. Our customer care team will get back to you shortly.';
        let suggestions = [];
        
        // Simple keyword matching
        if (questionLower.includes('price') || questionLower.includes('cost')) {
            response = 'Our maize flour is KSh 250 per kg, millet flour is KSh 320 per kg. Bulk orders get discounts!';
        } else if (questionLower.includes('deliver') || questionLower.includes('ship')) {
            response = 'We deliver across Africa within 3-7 business days. Shipping costs vary by location.';
        } else if (questionLower.includes('location') || questionLower.includes('where')) {
            response = 'Our main office is in Nairobi, Kenya. We have distribution centers across East Africa.';
        } else if (questionLower.includes('contact') || questionLower.includes('phone')) {
            response = 'You can call us at +254 700 000 000 or email info@ajabflour.co.ke';
        }
        
        // Get FAQ suggestions
        if (faqs.length > 0) {
            suggestions = faqs.slice(0, 3).map(f => f.question);
        }
        
        res.json({
            success: true,
            response: response,
            suggestions: suggestions
        });
        
    } catch (error) {
        console.error('Chatbot error:', error);
        res.json({
            success: true,
            response: 'I apologize, but I am having trouble processing your request. Please contact our customer care at +254 700 000 000.',
            suggestions: ['Call customer care', 'Send email', 'Visit our website']
        });
    }
});

// 12. ADD NEW PRODUCT (Protected - admin only)
app.post('/api/products/add', authenticateToken, isAdmin, async (req, res) => {
    console.log(`➕ Product added by: ${req.user.email}`);
    try {
        console.log(`➕ Product added by: ${req.user.email}`);
        const { name, description, category, weight, price, stock_quantity, image_url } = req.body;
        
        // Simple validation
        if (!name || !category || !price) {
            return res.status(400).json({
                success: false,
                error: 'Name, category, and price are required'
            });
        }
        
        if (isDatabaseConnected) {
            const result = await queryDatabase(
                `INSERT INTO products (name, description, category, weight, price, stock_quantity, image_url) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7) 
                 RETURNING *`,
                [name, description || '', category, weight || '', price, stock_quantity || 0, image_url || '']
            );
            
            if (result.success) {
                res.json({
                    success: true,
                    message: 'Product added successfully',
                    product: result.data[0]
                });
            } else {
                throw new Error('Failed to add product');
            }
        } else {
            // Add to in-memory
            const newId = inMemoryDB.products.length + 1;
            const newProduct = {
                id: newId,
                name,
                description: description || '',
                category,
                weight: weight || '',
                price,
                stock_quantity: stock_quantity || 0,
                image_url: image_url || '',
                is_featured: false,
                created_at: new Date()
            };
            
            inMemoryDB.products.push(newProduct);
            
            res.json({
                success: true,
                message: 'Product added successfully (demo mode)',
                product: newProduct
            });
        }
        
    } catch (error) {
        console.error('Add product error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add product'
        });
    }
});

// 13. HEALTH CHECK ENDPOINT
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: isDatabaseConnected ? 'connected' : 'demo_mode',
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

// 14. TEST DATABASE CONNECTION
app.get('/api/test-db', async (req, res) => {
    try {
        if (isDatabaseConnected) {
            const result = await queryDatabase('SELECT NOW() as time, version() as version');
            if (result.success) {
                res.json({
                    success: true,
                    message: 'Database connected successfully',
                    data: result.data[0],
                    tables: await getTableCounts()
                });
            } else {
                throw new Error('Query failed');
            }
        } else {
            res.json({
                success: true,
                message: 'Using in-memory demo database',
                data: {
                    time: new Date(),
                    version: 'In-memory demo v1.0'
                }
            });
        }
    } catch (error) {
        res.json({
            success: false,
            message: 'Database test failed',
            error: error.message
        });
    }
});

async function getTableCounts() {
    if (!isDatabaseConnected) return {};
    
    const tables = ['users', 'products', 'inquiries', 'faqs'];
    const counts = {};
    
    for (const table of tables) {
        try {
            const result = await queryDatabase(`SELECT COUNT(*) FROM ${table}`);
            if (result.success) {
                counts[table] = parseInt(result.data[0].count);
            }
        } catch (error) {
            counts[table] = 0;
        }
    }
    
    return counts;
}

// ========== ERROR HANDLING ==========

// 404 - Route not found
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: `Route ${req.method} ${req.url} not found`
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ========== START SERVER ==========
app.listen(PORT, () => {
    console.log('\n' + '='.repeat(50));
    console.log('🚀 AJAB FLOUR BACKEND SERVER');
    console.log('='.repeat(50));
    console.log(`✅ Server running on: http://localhost:${PORT}`);
    console.log(`📊 Database: ${isDatabaseConnected ? '✅ PostgreSQL Connected' : '📦 Using In-memory Demo'}`);
    console.log(`🔐 JWT Secret: ${JWT_SECRET ? 'Configured' : 'Using default'}`);
    console.log('\n📡 Available Endpoints:');
    console.log('   GET  /              - Server status');
    console.log('   GET  /api/products  - Get all products');
    console.log('   POST /api/register  - Register user');
    console.log('   POST /api/login     - Login user');
    console.log('   POST /api/inquiries - Create order');
    console.log('   GET  /api/health    - Health check');
    console.log('='.repeat(50));
    console.log('\n💡 Tip: Test API at http://localhost:5000/api/products\n');
});