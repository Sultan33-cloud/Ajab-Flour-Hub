-- Create database (already done manually)
-- CREATE DATABASE ajab_flour_hub;

-- Connect to the database first (run this in psql: \c ajab_flour_hub)

-- Users table
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

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) CHECK (category IN ('maize_flour', 'millet_flour', 'atta', 'self_raising', 'baking')),
    weight VARCHAR(20),
    price DECIMAL(10,2),
    stock_quantity INTEGER DEFAULT 0,
    image_url VARCHAR(500),
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders/Inquiries table
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

-- Inventory logs
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

-- FAQ for chatbot
CREATE TABLE IF NOT EXISTS faqs (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT true
);

-- Insert sample FAQs
INSERT INTO faqs (question, answer, category) VALUES
('Where is your mill located?', 'Our main mill is located in Nairobi, Kenya with distribution centers across East Africa.', 'general'),
('Do you deliver internationally?', 'Yes, we deliver across Africa. Select your country during checkout for delivery options.', 'delivery'),
('What are your prices?', 'Prices vary by product and quantity. Please check our product catalog or contact sales for bulk pricing.', 'pricing'),
('What is the shelf life of your flour?', 'Our fortified flours have a shelf life of 6-8 months when stored in cool, dry conditions.', 'products'),
('Can I visit your factory?', 'Yes, we offer factory tours by appointment. Please contact our customer care to schedule.', 'general');

-- Insert sample admin user (password: admin123)
INSERT INTO users (name, email, password, role) VALUES
('Admin User', 'admin@ajabflour.co.ke', '$2a$10$YourHashedPasswordHere', 'admin');

-- Insert sample products
INSERT INTO products (name, description, category, weight, price, stock_quantity, image_url, is_featured) VALUES
('Ajab Fortified Maize Flour', 'Premium quality maize flour for perfect ugali, fortified with essential vitamins.', 'maize_flour', '2kg, 5kg, 25kg', 250, 1000, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', true),
('Ajab Millet Flour', 'Nutritious millet flour rich in fiber and minerals, perfect for healthy chapatis.', 'millet_flour', '1kg, 2kg, 10kg', 320, 800, 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', true),
('Ajab Fortified Atta', 'Whole wheat atta for soft, fluffy chapatis and mandazi.', 'atta', '2kg, 5kg', 280, 1200, 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', false),
('Ajab Self Raising Flour', 'Perfect for baking cakes, breads, and pastries with ghee enrichment.', 'self_raising', '1kg, 2kg', 300, 600, 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', false),
('Ajab Baking Flour', 'All-purpose home baking flour for all your baking needs.', 'baking', '2kg, 5kg', 270, 900, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', false);