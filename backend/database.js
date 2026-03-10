// ============================================
// AJAB FLOUR DATABASE SETUP (JavaScript)
// ============================================

const { Pool } = require('pg');
require('dotenv').config();

class Database {
    constructor() {
        this.pool = null;
        this.connected = false;
    }

    async connect() {
        try {
            this.pool = new Pool({
                connectionString: process.env.DATABASE_URL,
                ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
            });

            // Test connection
            const client = await this.pool.connect();
            console.log('✅ Connected to PostgreSQL database');
            client.release();
            this.connected = true;
            return true;
        } catch (error) {
            console.error('❌ Database connection failed:', error.message);
            console.log('📦 Using in-memory database fallback');
            this.connected = false;
            return false;
        }
    }

    async query(text, params = []) {
        if (this.connected && this.pool) {
            try {
                const result = await this.pool.query(text, params);
                return { success: true, data: result.rows, rowCount: result.rowCount };
            } catch (error) {
                console.error('Database query error:', error.message);
                return { success: false, error: error.message };
            }
        }
        return { success: false, error: 'Database not connected' };
    }

    async createTables() {
        console.log('📦 Creating database tables...');

        // Users table
        await this.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(20) CHECK (role IN ('admin', 'sales', 'customer')) DEFAULT 'customer',
                country_code VARCHAR(5),
                phone VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Products table
        await this.query(`
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                description TEXT,
                category VARCHAR(50) CHECK (category IN ('maize_flour', 'millet_flour', 'atta', 'self_raising', 'baking', 'whole_wheat')),
                weight VARCHAR(20),
                price DECIMAL(10,2),
                stock_quantity INTEGER DEFAULT 0,
                image_url VARCHAR(500),
                is_featured BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Carts table
        await this.query(`
            CREATE TABLE IF NOT EXISTS carts (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                session_id VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Cart Items table
        await this.query(`
            CREATE TABLE IF NOT EXISTS cart_items (
                id SERIAL PRIMARY KEY,
                cart_id INTEGER REFERENCES carts(id) ON DELETE CASCADE,
                product_id INTEGER REFERENCES products(id),
                quantity INTEGER NOT NULL DEFAULT 1,
                price DECIMAL(10,2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Orders table
        await this.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                order_number VARCHAR(50) UNIQUE NOT NULL,
                user_id INTEGER REFERENCES users(id),
                status VARCHAR(20) CHECK (status IN ('pending', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded')) DEFAULT 'pending',
                payment_status VARCHAR(20) CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')) DEFAULT 'pending',
                payment_method VARCHAR(50),
                payment_reference VARCHAR(255),
                customer_name VARCHAR(100) NOT NULL,
                customer_email VARCHAR(100) NOT NULL,
                customer_phone VARCHAR(20),
                customer_country VARCHAR(50),
                delivery_address TEXT,
                delivery_city VARCHAR(100),
                delivery_postal_code VARCHAR(20),
                delivery_notes TEXT,
                subtotal DECIMAL(10,2) DEFAULT 0,
                tax_amount DECIMAL(10,2) DEFAULT 0,
                shipping_amount DECIMAL(10,2) DEFAULT 0,
                total_amount DECIMAL(10,2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Order Items table
        await this.query(`
            CREATE TABLE IF NOT EXISTS order_items (
                id SERIAL PRIMARY KEY,
                order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
                product_id INTEGER REFERENCES products(id),
                product_name VARCHAR(200),
                product_price DECIMAL(10,2),
                quantity INTEGER NOT NULL,
                total_price DECIMAL(10,2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Payments table
        await this.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id SERIAL PRIMARY KEY,
                order_id INTEGER REFERENCES orders(id),
                payment_method VARCHAR(50),
                amount DECIMAL(10,2),
                transaction_id VARCHAR(255),
                status VARCHAR(20) CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
                mpesa_code VARCHAR(50),
                phone_number VARCHAR(20),
                metadata JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Shipments table
        await this.query(`
            CREATE TABLE IF NOT EXISTS shipments (
                id SERIAL PRIMARY KEY,
                order_id INTEGER REFERENCES orders(id),
                tracking_number VARCHAR(100),
                carrier VARCHAR(50),
                status VARCHAR(20) CHECK (status IN ('pending', 'picked_up', 'in_transit', 'delivered', 'delayed')),
                estimated_delivery DATE,
                actual_delivery DATE,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Inventory logs table
        await this.query(`
            CREATE TABLE IF NOT EXISTS inventory_logs (
                id SERIAL PRIMARY KEY,
                product_id INTEGER REFERENCES products(id),
                change_type VARCHAR(20) CHECK (change_type IN ('purchase', 'sale', 'adjustment', 'damage')),
                quantity_change INTEGER,
                previous_quantity INTEGER,
                new_quantity INTEGER,
                notes TEXT,
                created_by INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // FAQs table
        await this.query(`
            CREATE TABLE IF NOT EXISTS faqs (
                id SERIAL PRIMARY KEY,
                question TEXT NOT NULL,
                answer TEXT NOT NULL,
                category VARCHAR(50),
                is_active BOOLEAN DEFAULT true
            );
        `);

        // Inquiries table
        await this.query(`
            CREATE TABLE IF NOT EXISTS inquiries (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                product_id INTEGER REFERENCES products(id),
                quantity INTEGER NOT NULL,
                delivery_address TEXT,
                country VARCHAR(50),
                status VARCHAR(20) CHECK (status IN ('pending', 'processing', 'confirmed', 'delivered', 'cancelled')) DEFAULT 'pending',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('✅ Database tables created successfully');
    }

    async seedData() {
        console.log('🌱 Seeding database with initial data...');

        // Check if we have users
        const userCheck = await this.query('SELECT COUNT(*) FROM users');
        if (userCheck.success && userCheck.data[0].count === '0') {
            const bcrypt = require('bcryptjs');
            const salt = await bcrypt.genSalt(10);
            const adminPass = await bcrypt.hash('admin123', salt);
            const salesPass = await bcrypt.hash('sales123', salt);
            const customerPass = await bcrypt.hash('customer123', salt);

            // Insert users
            await this.query(`
                INSERT INTO users (id, name, email, password, role, country_code, phone) VALUES 
                (1, 'Admin User', 'admin@ajabflour.co.ke', $1, 'admin', '+254', '700000000'),
                (2, 'Sales Manager', 'sales@ajabflour.co.ke', $2, 'sales', '+254', '711111111'),
                (3, 'John Customer', 'customer@example.com', $3, 'customer', '+254', '722222222')
                ON CONFLICT (id) DO NOTHING;
            `, [adminPass, salesPass, customerPass]);
            console.log('✅ Users seeded');
        }

        // Check if we have products
        const productCheck = await this.query('SELECT COUNT(*) FROM products');
        if (productCheck.success && productCheck.data[0].count === '0') {
            await this.query(`
                INSERT INTO products (id, name, description, category, weight, price, stock_quantity, image_url, is_featured) VALUES
                (1, 'Ajab Fortified Maize Flour', 'Premium quality maize flour for perfect ugali, fortified with essential vitamins.', 'maize_flour', '2kg, 5kg, 25kg', 250, 1000, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', true),
                (2, 'Ajab Millet Flour', 'Nutritious millet flour rich in fiber and minerals, perfect for healthy chapatis.', 'millet_flour', '1kg, 2kg, 10kg', 320, 800, 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', true),
                (3, 'Ajab Fortified Atta', 'Whole wheat atta for soft, fluffy chapatis and mandazi.', 'atta', '2kg, 5kg', 280, 1200, 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', false),
                (4, 'Ajab Self Raising Flour', 'Perfect for cakes, breads, and pastries with ghee enrichment.', 'self_raising', '1kg, 2kg', 300, 600, 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', false),
                (5, 'Ajab Baking Flour', 'All-purpose home baking flour for all your baking needs.', 'baking', '2kg, 5kg', 270, 900, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', false),
                (6, 'Ajab Whole Wheat Flour', '100% whole wheat for nutritious breads and pastries.', 'whole_wheat', '2kg, 5kg', 290, 700, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', true)
                ON CONFLICT (id) DO NOTHING;
            `);
            console.log('✅ Products seeded');
        }

        // Check if we have FAQs
        const faqCheck = await this.query('SELECT COUNT(*) FROM faqs');
        if (faqCheck.success && faqCheck.data[0].count === '0') {
            await this.query(`
                INSERT INTO faqs (question, answer, category, is_active) VALUES
                ('Where is your mill located?', 'Our main mill is located in Nairobi, Kenya with distribution centers across East Africa.', 'general', true),
                ('Do you deliver internationally?', 'Yes, we deliver across Africa. Select your country during checkout for delivery options.', 'delivery', true),
                ('What are your prices?', 'Prices vary by product and quantity. Please check our product catalog or contact sales for bulk pricing.', 'pricing', true),
                ('What is the shelf life of your flour?', 'Our fortified flours have a shelf life of 6-8 months when stored in cool, dry conditions.', 'products', true),
                ('Can I visit your factory?', 'Yes, we offer factory tours by appointment. Please contact our customer care to schedule.', 'general', true),
                ('How do I place a bulk order?', 'You can use our bulk order form on the website, or contact our sales team directly at sales@ajabflour.co.ke', 'orders', true),
                ('What payment methods do you accept?', 'We accept M-Pesa (for Kenya), credit/debit cards, and bank transfers for orders within Kenya. International orders have additional options.', 'payments', true)
                ON CONFLICT DO NOTHING;
            `);
            console.log('✅ FAQs seeded');
        }

        console.log('✅ Database seeding completed');
    }

    async resetSequences() {
        const sequences = [
            'users_id_seq',
            'products_id_seq',
            'orders_id_seq',
            'order_items_id_seq',
            'payments_id_seq',
            'shipments_id_seq',
            'carts_id_seq',
            'cart_items_id_seq',
            'inventory_logs_id_seq',
            'faqs_id_seq',
            'inquiries_id_seq'
        ];

        for (const seq of sequences) {
            const tableName = seq.replace('_id_seq', '');
            await this.query(`SELECT setval('${seq}', COALESCE((SELECT MAX(id) FROM ${tableName}), 1), false);`);
        }
        console.log('✅ Sequences reset');
    }

    async initialize() {
        await this.connect();
        await this.createTables();
        await this.seedData();
        await this.resetSequences();
        console.log('🎉 Database initialization complete!');
        return this;
    }
}

module.exports = Database;