const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

async function testLogin() {
    console.log('🔧 Testing Admin Login Setup');
    console.log('='.repeat(50));
    
    // Connect to database
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: false
    });
    
    try {
        const client = await pool.connect();
        
        // 1. Check if users table exists
        console.log('1️⃣ Checking users table...');
        const tableCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'users'
            );
        `);
        
        if (!tableCheck.rows[0].exists) {
            console.log('❌ Users table does not exist!');
            return;
        }
        
        console.log('✅ Users table exists');
        
        // 2. Check admin user
        console.log('\n2️⃣ Checking admin user...');
        const adminResult = await client.query(
            'SELECT * FROM users WHERE email = $1',
            ['admin@ajabflour.co.ke']
        );
        
        if (adminResult.rows.length === 0) {
            console.log('❌ Admin user not found in database');
            
            // Create admin user
            console.log('🛠️ Creating admin user...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);
            
            await client.query(`
                INSERT INTO users (name, email, password, role, country_code, phone)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, ['Ajab Admin', 'admin@ajabflour.co.ke', hashedPassword, 'admin', '+254', '0700000000']);
            
            console.log('✅ Admin user created successfully');
        } else {
            const admin = adminResult.rows[0];
            console.log(`✅ Admin user found: ${admin.name}`);
            console.log(`   Email: ${admin.email}`);
            console.log(`   Role: ${admin.role}`);
            console.log(`   Password hash: ${admin.password.substring(0, 30)}...`);
            
            // Test password
            const testPassword = 'admin123';
            const isValid = await bcrypt.compare(testPassword, admin.password);
            console.log(`   Password "admin123" valid: ${isValid ? '✅' : '❌'}`);
            
            if (!isValid) {
                console.log('🔄 Updating admin password...');
                const salt = await bcrypt.genSalt(10);
                const newHash = await bcrypt.hash('admin123', salt);
                
                await client.query(
                    'UPDATE users SET password = $1 WHERE email = $2',
                    [newHash, 'admin@ajabflour.co.ke']
                );
                console.log('✅ Password updated');
            }
        }
        
        // 3. List all users
        console.log('\n3️⃣ All users in database:');
        const allUsers = await client.query('SELECT id, name, email, role FROM users ORDER BY id');
        
        if (allUsers.rows.length === 0) {
            console.log('   No users found');
        } else {
            allUsers.rows.forEach(user => {
                console.log(`   ${user.id}. ${user.name} (${user.email}) - ${user.role}`);
            });
        }
        
        // 4. Test login simulation
        console.log('\n4️⃣ Testing login simulation...');
        const testEmail = 'admin@ajabflour.co.ke';
        const testPass = 'admin123';
        
        const user = await client.query(
            'SELECT * FROM users WHERE email = $1',
            [testEmail]
        );
        
        if (user.rows.length > 0) {
            const dbUser = user.rows[0];
            const passwordMatch = await bcrypt.compare(testPass, dbUser.password);
            
            console.log(`   Email: ${testEmail}`);
            console.log(`   Password: ${testPass}`);
            console.log(`   Match: ${passwordMatch ? '✅ SUCCESS' : '❌ FAILED'}`);
            
            if (!passwordMatch) {
                console.log('   🔧 Fixing password...');
                const salt = await bcrypt.genSalt(10);
                const fixedHash = await bcrypt.hash(testPass, salt);
                
                await client.query(
                    'UPDATE users SET password = $1 WHERE email = $2',
                    [fixedHash, testEmail]
                );
                console.log('   ✅ Password fixed');
            }
        }
        
        client.release();
        
    } catch (error) {
        console.error('❌ Database error:', error.message);
    } finally {
        await pool.end();
    }
    
    console.log('\n='.repeat(50));
    console.log('✅ Test complete. Try logging in again.');
}

// Run the test
testLogin();