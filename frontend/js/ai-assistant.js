// ============================================
// AJAB AI ASSISTANT - Simple Rule-Based Chatbot with Sound
// ============================================

class AjabAIAssistant {
    constructor() {
        this.apiUrl = 'https://ajab-flour-hub.onrender.com/api/chatbot/query';
        this.soundEnabled = true;
        this.voiceEnabled = false;
        this.context = {
            user: null,
            lastQuestion: '',
            sessionId: this.generateSessionId(),
            conversationHistory: []
        };
        
        // Initialize sounds
        this.sounds = {
            notification: null,
            send: null,
            receive: null,
            error: null
        };
        
        this.initSounds();
        this.initUI();
    }
    
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    initSounds() {
        try {
            // Create audio contexts for sounds
            this.sounds.notification = this.createNotificationSound();
            this.sounds.send = this.createSendSound();
            this.sounds.receive = this.createReceiveSound();
            this.sounds.error = this.createErrorSound();
        } catch (e) {
            console.log('Sound initialization failed:', e.message);
        }
    }
    
    createNotificationSound() {
        // Simple beep using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        return {
            play: () => {
                if (!this.soundEnabled) return;
                
                try {
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    
                    oscillator.type = 'sine';
                    oscillator.frequency.value = 800;
                    gainNode.gain.value = 0.1;
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    oscillator.start();
                    oscillator.stop(audioContext.currentTime + 0.1);
                } catch (e) {
                    console.log('Sound play failed');
                }
            }
        };
    }
    
    createSendSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        return {
            play: () => {
                if (!this.soundEnabled) return;
                
                try {
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    
                    oscillator.type = 'sine';
                    oscillator.frequency.value = 600;
                    gainNode.gain.value = 0.1;
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    oscillator.start();
                    oscillator.frequency.exponentialRampToValue(1200, 0.1);
                    oscillator.stop(audioContext.currentTime + 0.15);
                } catch (e) {}
            }
        };
    }
    
    createReceiveSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        return {
            play: () => {
                if (!this.soundEnabled) return;
                
                try {
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    
                    oscillator.type = 'sine';
                    oscillator.frequency.value = 400;
                    gainNode.gain.value = 0.1;
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    oscillator.start();
                    oscillator.frequency.exponentialRampToValue(200, 0.1);
                    oscillator.stop(audioContext.currentTime + 0.2);
                } catch (e) {}
            }
        };
    }
    
    createErrorSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        return {
            play: () => {
                if (!this.soundEnabled) return;
                
                try {
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    
                    oscillator.type = 'sawtooth';
                    oscillator.frequency.value = 200;
                    gainNode.gain.value = 0.1;
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    oscillator.start();
                    oscillator.stop(audioContext.currentTime + 0.3);
                } catch (e) {}
            }
        };
    }
    
    initUI() {
        // Create chatbot UI if it doesn't exist
        if (!document.querySelector('.chatbot-widget')) {
            this.createChatbotUI();
        }
        
        // Add event listeners
        this.setupEventListeners();
    }
    
    createChatbotUI() {
        const chatbotHTML = `
            <div class="chatbot-widget" id="chatbotWidget">
                <div class="chatbot-header">
                    <div class="chatbot-title">
                        <i class="fas fa-robot"></i>
                        <h4>Ajab Assistant</h4>
                    </div>
                    <div class="chatbot-controls">
                        <button class="chatbot-sound" id="chatbotSound" title="Toggle Sound">
                            <i class="fas fa-volume-up"></i>
                        </button>
                        <button class="chatbot-close" id="closeChatbot">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="chatbot-messages" id="chatbotMessages">
                    <div class="chatbot-message bot">
                        <div class="message-content">
                            Hello! I'm Ajab Assistant. How can I help you today?
                        </div>
                        <div class="message-time">Just now</div>
                    </div>
                </div>
                <div class="chatbot-input">
                    <input type="text" id="chatbotInput" placeholder="Type your question here...">
                    <button class="btn-send" id="sendChatbot">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
            
            <button class="chatbot-toggle" id="toggleChatbot">
                <i class="fas fa-comment-dots"></i>
                <span class="chatbot-notification">1</span>
            </button>
        `;
        
        document.body.insertAdjacentHTML('beforeend', chatbotHTML);
    }
    
    setupEventListeners() {
        // Toggle chatbot
        const toggleBtn = document.getElementById('toggleChatbot');
        const closeBtn = document.getElementById('closeChatbot');
        const sendBtn = document.getElementById('sendChatbot');
        const input = document.getElementById('chatbotInput');
        const soundBtn = document.getElementById('chatbotSound');
        
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleChatbot());
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideChatbot());
        }
        
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }
        
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendMessage();
            });
        }
        
        if (soundBtn) {
            soundBtn.addEventListener('click', () => this.toggleSound());
        }
        
        // Remove notification on first open
        setTimeout(() => {
            const notification = document.querySelector('.chatbot-notification');
            if (notification) notification.style.display = 'none';
        }, 5000);
    }
    
    toggleChatbot() {
        const widget = document.getElementById('chatbotWidget');
        if (widget) {
            widget.classList.toggle('active');
            if (widget.classList.contains('active')) {
                document.getElementById('chatbotInput')?.focus();
                
                // Play notification sound
                if (this.sounds.notification) this.sounds.notification.play();
            }
        }
    }
    
    hideChatbot() {
        const widget = document.getElementById('chatbotWidget');
        if (widget) {
            widget.classList.remove('active');
        }
    }
    
    async sendMessage() {
        const input = document.getElementById('chatbotInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Add user message
        this.addMessage(message, 'user');
        input.value = '';
        
        // Play send sound
        if (this.sounds.send) this.sounds.send.play();
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    question: message,
                    session_id: this.context.sessionId
                })
            });
            
            const data = await response.json();
            
            // Remove typing indicator
            this.removeTypingIndicator();
            
            if (data.success) {
                // Add bot response
                this.addMessage(data.response, 'bot');
                
                // Play receive sound
                if (this.sounds.receive) this.sounds.receive.play();
                
                // Add suggestions if available
                if (data.suggestions && data.suggestions.length > 0) {
                    setTimeout(() => {
                        this.addMessage('You might also ask about: ' + data.suggestions.join(', '), 'bot');
                    }, 500);
                }
            } else {
                this.addMessage('Sorry, I encountered an error. Please try again.', 'bot');
                if (this.sounds.error) this.sounds.error.play();
            }
            
        } catch (error) {
            console.error('Chatbot error:', error);
            this.removeTypingIndicator();
            this.addMessage('I apologize, but I am experiencing technical difficulties. Please contact our customer care at +254 700 000 000.', 'bot');
            if (this.sounds.error) this.sounds.error.play();
        }
    }
    
    addMessage(message, type) {
        const messagesContainer = document.getElementById('chatbotMessages');
        if (!messagesContainer) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `chatbot-message ${type}`;
        
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.innerHTML = `
            <div class="message-content">${message}</div>
            <div class="message-time">${time}</div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Add to history
        this.context.conversationHistory.push({
            role: type,
            content: message,
            time: time
        });
    }
    
    showTypingIndicator() {
        const messagesContainer = document.getElementById('chatbotMessages');
        if (!messagesContainer) return;
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chatbot-message bot typing';
        typingDiv.id = 'typingIndicator';
        typingDiv.innerHTML = `
            <div class="message-content">
                <span class="typing-dots">
                    <span>.</span>
                    <span>.</span>
                    <span>.</span>
                </span>
            </div>
        `;
        
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    removeTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        
        const soundBtn = document.getElementById('chatbotSound');
        if (soundBtn) {
            const icon = soundBtn.querySelector('i');
            if (icon) {
                icon.className = this.soundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
            }
        }
        
        return this.soundEnabled;
    }
}

// Initialize global assistant when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.ajabAssistant = new AjabAIAssistant();
});