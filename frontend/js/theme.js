// ============================================
// AJAB THEME MANAGER - Dark/Light Mode with Stars & Sunset
// ============================================

class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'light';
        this.starsCount = 100;
        this.stars = [];
        this.isDark = this.theme === 'dark';
        
        this.init();
    }
    
    init() {
        // Create theme elements
        this.createThemeElements();
        
        // Apply initial theme
        this.applyTheme(this.isDark);
        
        // Listen for system theme changes
        this.listenToSystemTheme();
    }
    
    createThemeElements() {
        // Create sunset overlay (light mode)
        if (!document.querySelector('.sunset-overlay')) {
            const sunsetOverlay = document.createElement('div');
            sunsetOverlay.className = 'sunset-overlay';
            document.body.appendChild(sunsetOverlay);
        }
        
        // Create stars container (dark mode)
        if (!document.getElementById('starsContainer')) {
            const starsContainer = document.createElement('div');
            starsContainer.className = 'stars-container';
            starsContainer.id = 'starsContainer';
            document.body.appendChild(starsContainer);
        }
        
        // Create theme toggle button
        this.createThemeToggle();
    }
    
    createThemeToggle() {
        // Check if toggle already exists
        if (document.getElementById('themeToggle')) return;
        
        // Find where to insert
        const navLinks = document.querySelector('.nav-links');
        if (!navLinks) {
            setTimeout(() => this.createThemeToggle(), 500);
            return;
        }
        
        const themeToggle = document.createElement('li');
        themeToggle.innerHTML = `
            <button class="btn btn-theme-toggle" id="themeToggle">
                <i class="fas ${this.isDark ? 'fa-sun' : 'fa-moon'}"></i>
                <span>${this.isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
        `;
        
        // Insert before login/register buttons
        const lastIndex = navLinks.children.length;
        const insertPosition = Math.max(0, lastIndex - 2);
        navLinks.insertBefore(themeToggle, navLinks.children[insertPosition]);
        
        // Add event listener
        document.getElementById('themeToggle')?.addEventListener('click', () => this.toggle());
    }
    
    applyTheme(isDark) {
        this.isDark = isDark;
        this.theme = isDark ? 'dark' : 'light';
        
        // Set data attribute
        document.documentElement.setAttribute('data-theme', this.theme);
        
        // Save to localStorage
        localStorage.setItem('theme', this.theme);
        
        // Update stars
        this.updateStars(isDark);
        
        // Update theme toggle button
        this.updateThemeToggle();
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme: this.theme, isDark } 
        }));
        
        console.log(`Theme changed to ${this.theme}`);
    }
    
    toggle() {
        this.applyTheme(!this.isDark);
    }
    
    updateStars(show) {
        const starsContainer = document.getElementById('starsContainer');
        if (!starsContainer) return;
        
        if (show) {
            // Clear existing stars
            starsContainer.innerHTML = '';
            this.stars = [];
            
            // Generate new stars
            for (let i = 0; i < this.starsCount; i++) {
                const star = document.createElement('div');
                const size = Math.random() * 3 + 1;
                const x = Math.random() * 100;
                const y = Math.random() * 100;
                const duration = Math.random() * 3 + 2;
                
                // Star class based on size
                star.className = 'star';
                if (size < 1.5) {
                    star.classList.add('small');
                } else if (size < 2.5) {
                    star.classList.add('medium');
                } else {
                    star.classList.add('large');
                }
                
                // Random position and animation
                star.style.cssText = `
                    left: ${x}vw;
                    top: ${y}vh;
                    width: ${size}px;
                    height: ${size}px;
                    animation-duration: ${duration}s;
                    animation-delay: ${Math.random() * duration}s;
                    opacity: ${Math.random() * 0.7 + 0.3};
                `;
                
                starsContainer.appendChild(star);
                this.stars.push(star);
            }
        } else {
            // Hide stars
            starsContainer.innerHTML = '';
            this.stars = [];
        }
    }
    
    updateThemeToggle() {
        const toggleBtn = document.getElementById('themeToggle');
        if (!toggleBtn) return;
        
        const icon = toggleBtn.querySelector('i');
        const text = toggleBtn.querySelector('span');
        
        if (icon) {
            icon.className = `fas ${this.isDark ? 'fa-sun' : 'fa-moon'}`;
        }
        
        if (text) {
            text.textContent = this.isDark ? 'Light Mode' : 'Dark Mode';
        }
    }
    
    listenToSystemTheme() {
        // Check if user prefers dark mode
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
        
        prefersDark.addEventListener('change', (e) => {
            // Only change if user hasn't manually set a preference
            if (!localStorage.getItem('theme')) {
                this.applyTheme(e.matches);
            }
        });
    }
    
    getCurrentTheme() {
        return {
            theme: this.theme,
            isDark: this.isDark,
            stars: this.stars.length
        };
    }
}

// Initialize theme manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
});