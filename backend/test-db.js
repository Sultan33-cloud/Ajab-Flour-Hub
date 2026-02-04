const { Pool } = require('pg');
require('dotenv').config();

async function testConnection() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: false
    });

    try {
        console.log('🔌 Testing database connection...');
        
        // Test connection
        const client = await pool.connect();
        console.log('✅ Connected to PostgreSQL!');
        
        // Test query
        const result = await client.query('SELECT NOW() as current_time');
        console.log('✅ Current database time:', result.rows[0].current_time);
        
        // Check tables
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);
        
        console.log('✅ Available tables:');
        tables.rows.forEach(row => {
            console.log('   -', row.table_name);
        });
        
        // Check sample data
        const products = await client.query('SELECT COUNT(*) as count FROM products');
        console.log('✅ Products in database:', products.rows[0].count);
        
        const users = await client.query('SELECT COUNT(*) as count FROM users');
        console.log('✅ Users in database:', users.rows[0].count);
        
        client.release();
        
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Is PostgreSQL running?');
        console.log('2. Check your .env file DATABASE_URL');
        console.log('3. Verify username/password');
        console.log('4. Check if database "ajab_flour_hub" exists');
    } finally {
        await pool.end();
    }
}

testConnection();