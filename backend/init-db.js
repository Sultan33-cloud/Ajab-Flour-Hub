const Database = require('./database');
require('dotenv').config();

async function initializeDatabase() {
    console.log('🔧 Initializing database...');
    
    const db = new Database();
    await db.initialize();
    
    console.log('🎉 Database initialization complete!');
    process.exit(0);
}

initializeDatabase();