// ============================================
// SAMPLE DATA SEEDING SCRIPT
// Run this to populate database with sample data
// ============================================

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../backend/.env' });

const sampleData = {
    products: [
        {
            name: 'Ajab Fortified Maize Flour',
            description: 'Premium quality maize flour for perfect ugali, fortified with essential vitamins.',
            category: 'maize_flour',
            weight: '2kg, 5kg, 25kg',
            price: 250,
            stock_quantity: 1000,
            image_url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea',
            is_featured: true
        },
        {
            name: 'Ajab Millet Flour',
            description: 'Nutritious millet flour rich in fiber and minerals, perfect for healthy chapatis.',
            category: 'millet_flour',
            weight: '1kg, 2kg, 10kg',
            price: 320,
            stock_quantity: 800,
            image_url: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445',
            is_featured: true
        },
        {
            name: 'Ajab Fortified Atta',
            description: 'Whole wheat atta for soft, fluffy chapatis and mandazi.',
            category: 'atta',
            weight: '2kg, 5kg',
            price: 280,
            stock_quantity: 1200,
            image_url: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187',
            is_featured: false
        },
        {
            name: 'Ajab Self Raising Flour',
            description: 'Perfect for cakes, breads, and pastries with ghee enrichment.',
            category: 'self_raising',
            weight: '1kg, 2kg',
            price: 300,
            stock_quantity: 600,
            image_url: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd',
            is_featured: false
        },
        {
            name: 'Ajab Baking Flour',
            description: 'All-purpose home baking flour for all your baking needs.',
            category: 'baking',
            weight: '2kg, 5kg',
            price: 270,
            stock_quantity: 900,
            image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff',
            is_featured: false
        },
        {
            name: 'Ajab Whole Wheat Flour',
            description: '100% whole wheat for nutritious breads and pastries.',
            category: 'whole_wheat',
            weight: '2kg, 5kg',
            price: 290,
            stock_quantity: 700,
            image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999',
            is_featured: true
        }
    ],
    
    faqs: [
        {
            question: 'Where is your mill located?',
            answer: 'Our main mill is located in Nairobi, Kenya with distribution centers across East Africa.',
            category: 'general',
            is_active: true
        },
        {
            question: 'Do you deliver internationally?',
            answer: 'Yes, we deliver across Africa. Select your country during checkout for delivery options.',
            category: 'delivery',
            is_active: true
        },
        {
            question: 'What are your prices?',
            answer: 'Prices vary by product and quantity. Please check our product catalog or contact sales for bulk pricing.',
            category: 'pricing',
            is_active: true
        },
        {
            question: 'What is the shelf life of your flour?',
            answer: 'Our fortified flours have a shelf life of 6-8 months when stored in cool, dry conditions.',
            category: 'products',
            is_active: true
        },
        {
            question: 'Can I visit your factory?',
            answer: 'Yes, we offer factory tours by appointment. Please contact our customer care to schedule.',
            category: 'general',
            is_active: true
        },
        {
            question: 'How do I place a bulk order?',
            answer: 'You can use our bulk order form on the website, or contact our sales team directly at sales@ajabflour.co.ke',
            category: 'orders',
            is_active: true
        },
        {
            question: 'What payment methods do you accept?',
            answer: 'We accept M-Pesa (for Kenya), credit/debit cards, and bank transfers for orders within Kenya.',
            category: 'payments',
            is_active: true
        }
    ]
};

async function seedDatabase() {
    console.log('🌱 Seeding database with sample data...');
    
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: false
    });
    
    try {
        const client = await pool.connect();
        
        // Hash passwords for sample users
        const salt = await bcrypt.genSalt(10);
        const adminPass = await bcrypt.hash('admin123', salt);
        const salesPass = await bcrypt.hash('sales123', salt);
        const customerPass = await bcrypt.hash('customer123', salt);
        
        // Insert users
        await client.query(`
            INSERT INTO users (id, name, email, password, role, country_code, phone) 
            VALUES 
            (1, 'Admin User', 'admin@ajabflour.co.ke', $1, 'admin', '+254', '700000000'),
            (2, 'Sales Manager', 'sales@ajabflour.co.ke', $2, 'sales', '+254', '711111111'),
            (3, 'John Customer', 'customer@example.com', $3, 'customer', '+254', '722222222')
            ON CONFLICT (id) DO NOTHING;
        `, [adminPass, salesPass, customerPass]);
        console.log('✅ Users seeded');
        
        // Insert products
        for (const product of sampleData.products) {
            await client.query(`
                INSERT INTO products (name, description, category, weight, price, stock_quantity, image_url, is_featured)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT DO NOTHING;
            `, [product.name, product.description, product.category, product.weight, product.price, product.stock_quantity, product.image_url, product.is_featured]);
        }
        console.log('✅ Products seeded');
        
        // Insert FAQs
        for (const faq of sampleData.faqs) {
            await client.query(`
                INSERT INTO faqs (question, answer, category, is_active)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT DO NOTHING;
            `, [faq.question, faq.answer, faq.category, faq.is_active]);
        }
        console.log('✅ FAQs seeded');
        
        // Create sample orders
        await client.query(`
            INSERT INTO orders (order_number, user_id, customer_name, customer_email, customer_phone, customer_country, delivery_address, subtotal, total_amount, status, payment_status)
            VALUES 
            ('ORD-2024-001', 3, 'John Customer', 'customer@example.com', '+254722222222', 'Kenya', '123 Nairobi Street', 5000, 6300, 'delivered', 'paid'),
            ('ORD-2024-002', 3, 'John Customer', 'customer@example.com', '+254722222222', 'Kenya', '123 Nairobi Street', 7500, 9200, 'processing', 'paid')
            ON CONFLICT DO NOTHING;
        `);
        console.log('✅ Sample orders created');
        
        client.release();
        console.log('🎉 Database seeding complete!');
        
    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        await pool.end();
    }
}

seedDatabase();