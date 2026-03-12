// ============================================
// AJAB FLOUR - ENVIRONMENT CONFIGURATION
// ============================================

const Config = {
    // Your Render URL looks like: https://your-app-name.onrender.com
    RENDER_URL: 'https://ajab-flour-hub.onrender.com', 
    
    // Get the correct API URL based on environment
    getApiUrl() {
        // Check if we're running on Netlify (production)
        const hostname = window.location.hostname;
        
        if (hostname.includes('netlify.app') || hostname === 'ajab-flour-hub.netlify.app') {
            console.log('🌐 Using production API:', this.RENDER_URL);
            return this.RENDER_URL;
        } 
        // Check if we're running locally
        else if (hostname === 'localhost' || hostname === '127.0.0.1') {
            console.log('💻 Using local API: http://localhost:5300');
            return 'http://localhost:5300';
        }
        // Default to production
        else {
            console.log('🌐 Using production API:', this.RENDER_URL);
            return this.RENDER_URL;
        }
    },
    
    // Get WebSocket URL if needed
    getWsUrl() {
        const apiUrl = this.getApiUrl();
        return apiUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    }
};

// Make Config available globally
window.Config = Config;

// Log which environment we're in
console.log('🔧 Config loaded. Environment:', window.location.hostname);
console.log('🔧 API URL:', Config.getApiUrl());