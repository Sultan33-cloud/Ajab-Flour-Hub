// ============================================
// AJAB SHOPPING CART SYSTEM
// ============================================

class CartSystem {
    constructor() {
        this.apiUrl = window.Config ? Config.getApiUrl() + '/api' : 'http://localhost:5300/api';
        this.items = [];
        this.total = 0;
        this.user = null;
        
        this.init();
    }
    
    init() {
        // Load user from localStorage
        this.user = JSON.parse(localStorage.getItem('currentUser'));
        
        // Load cart from localStorage
        this.loadCart();
        
        // Setup event listeners
        this.setupEventListeners();
    }
    
    loadCart() {
        const savedCart = localStorage.getItem('ajab_cart');
        if (savedCart) {
            try {
                this.items = JSON.parse(savedCart);
                this.calculateTotal();
            } catch (e) {
                console.error('Failed to load cart:', e);
                this.items = [];
            }
        }
        
        // If user is logged in, sync with server
        if (this.user && this.user.id) {
            this.syncWithServer();
        }
        
        this.updateUI();
    }
    
    async syncWithServer() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        const response = await fetch(`${this.apiUrl}/cart`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.cart) {
                this.mergeCarts(data.cart.items);
            }
        } else if (response.status === 403) {
            console.log('Not authenticated for cart sync');
        }
    } catch (error) {
        console.log('Server sync failed, using local cart');
    }
}
    
    mergeCarts(serverItems) {
        // Create a map of local items
        const localMap = new Map(this.items.map(item => [item.id, item]));
        
        // Add server items
        serverItems.forEach(serverItem => {
            const localItem = localMap.get(serverItem.product_id);
            if (localItem) {
                // Use the larger quantity
                localItem.quantity = Math.max(localItem.quantity, serverItem.quantity);
            } else {
                this.items.push({
                    id: serverItem.product_id,
                    name: serverItem.name,
                    price: serverItem.price,
                    weight: serverItem.weight,
                    image_url: serverItem.image_url,
                    quantity: serverItem.quantity
                });
            }
        });
        
        this.saveCart();
    }
    
    saveCart() {
        localStorage.setItem('ajab_cart', JSON.stringify(this.items));
        this.calculateTotal();
        this.updateUI();
    }
    
    calculateTotal() {
        this.total = this.items.reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0);
    }
    
    addItem(product, quantity = 1) {
        if (!product || !product.id) return false;
        
        const existingItem = this.items.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.items.push({
                id: product.id,
                name: product.name,
                price: product.price,
                weight: product.weight,
                image_url: product.image_url,
                quantity: quantity
            });
        }
        
        this.saveCart();
        this.showNotification(`${product.name} added to cart!`);
        
        // If logged in, sync with server
        if (this.user) {
            this.syncAddToServer(product.id, quantity);
        }
        
        return true;
    }
    
    async syncAddToServer(productId, quantity) {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        try {
            await fetch(`${this.apiUrl}/cart/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ product_id: productId, quantity })
            });
        } catch (error) {
            console.log('Server sync failed');
        }
    }
    
    removeItem(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.saveCart();
        this.showNotification('Item removed from cart');
        
        // Sync with server
        if (this.user) {
            this.syncRemoveFromServer(productId);
        }
    }
    
    async syncRemoveFromServer(productId) {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        try {
            await fetch(`${this.apiUrl}/cart/remove/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.log('Server sync failed');
        }
    }
    
    updateQuantity(productId, quantity) {
        const item = this.items.find(item => item.id === productId);
        
        if (item) {
            if (quantity <= 0) {
                this.removeItem(productId);
            } else {
                item.quantity = quantity;
                this.saveCart();
            }
        }
    }
    
    clearCart() {
        this.items = [];
        this.saveCart();
        this.showNotification('Cart cleared');
    }
    
    getItemCount() {
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
    }
    
    getSubtotal() {
        return this.total;
    }
    
    getTax() {
        return this.total * 0.16; // 16% VAT
    }
    
    getShipping() {
        return this.total > 5000 ? 0 : 500; // Free shipping over KSh 5000
    }
    
    getTotal() {
        return this.total + this.getTax() + this.getShipping();
    }
    
    showNotification(message) {
        // Check if notification already exists
        const existing = document.querySelector('.cart-notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
            <a href="#" onclick="cartSystem.showCart(); return false;">View Cart</a>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    showCart() {
        const cartModal = document.getElementById('cartModal');
        if (cartModal) {
            cartModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            this.renderCartModal();
        }
    }
    
    hideCart() {
        const cartModal = document.getElementById('cartModal');
        if (cartModal) {
            cartModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }
    
    renderCartModal() {
        const cartItems = document.getElementById('cartItems');
        const cartSubtotal = document.getElementById('cartSubtotal');
        const cartTax = document.getElementById('cartTax');
        const cartShipping = document.getElementById('cartShipping');
        const cartTotal = document.getElementById('cartModalTotal');
        
        if (!cartItems) return;
        
        if (this.items.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <h3>Your cart is empty</h3>
                    <p>Add some products to get started</p>
                    <button class="btn btn-primary" onclick="cartSystem.hideCart()">
                        Continue Shopping
                    </button>
                </div>
            `;
            return;
        }
        
        let itemsHTML = '';
        this.items.forEach(item => {
            itemsHTML += `
                <div class="cart-item" data-id="${item.id}">
                    <div class="cart-item-image">
                        <img src="${item.image_url || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'}" 
                             alt="${item.name}">
                    </div>
                    <div class="cart-item-details">
                        <h4>${item.name}</h4>
                        <div class="cart-item-meta">
                            <span class="cart-item-price">KSh ${item.price.toLocaleString()}</span>
                            <span class="cart-item-weight">${item.weight || 'Various sizes'}</span>
                        </div>
                        <div class="cart-item-actions">
                            <div class="quantity-control">
                                <button class="quantity-btn" onclick="cartSystem.updateQuantity(${item.id}, ${item.quantity - 1})">
                                    <i class="fas fa-minus"></i>
                                </button>
                                <input type="number" value="${item.quantity}" min="1" 
                                       onchange="cartSystem.updateQuantity(${item.id}, parseInt(this.value))">
                                <button class="quantity-btn" onclick="cartSystem.updateQuantity(${item.id}, ${item.quantity + 1})">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                            <button class="remove-item" onclick="cartSystem.removeItem(${item.id})">
                                <i class="fas fa-trash"></i> Remove
                            </button>
                        </div>
                    </div>
                    <div class="cart-item-total">
                        KSh ${(item.price * item.quantity).toLocaleString()}
                    </div>
                </div>
            `;
        });
        
        cartItems.innerHTML = itemsHTML;
        
        const subtotal = this.getSubtotal();
        const tax = this.getTax();
        const shipping = this.getShipping();
        const total = this.getTotal();
        
        if (cartSubtotal) cartSubtotal.textContent = `KSh ${subtotal.toLocaleString()}`;
        if (cartTax) cartTax.textContent = `KSh ${tax.toLocaleString()}`;
        if (cartShipping) cartShipping.innerHTML = shipping === 0 ? 'Free' : `KSh ${shipping}`;
        if (cartTotal) cartTotal.textContent = `KSh ${total.toLocaleString()}`;
    }
    
    updateUI() {
        const cartCount = document.getElementById('cartCount');
        const cartTotal = document.getElementById('cartTotal');
        
        if (cartCount) {
            const count = this.getItemCount();
            cartCount.textContent = count;
            cartCount.style.display = count > 0 ? 'flex' : 'none';
        }
        
        if (cartTotal) {
            cartTotal.textContent = `KSh ${this.getTotal().toLocaleString()}`;
        }
        
        // Update cart modal if open
        this.renderCartModal();
    }
    
    setupEventListeners() {
        // Cart button
        const cartBtn = document.getElementById('cartBtn');
        if (cartBtn) {
            cartBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showCart();
            });
        }
        
        // Close cart
        const closeCart = document.getElementById('closeCart');
        if (closeCart) {
            closeCart.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideCart();
            });
        }
        
        // Checkout button
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.proceedToCheckout();
            });
        }
        
        // Close on outside click
        window.addEventListener('click', (e) => {
            const cartModal = document.getElementById('cartModal');
            if (cartModal && e.target === cartModal) {
                this.hideCart();
            }
        });
    }
    
    proceedToCheckout() {
        if (this.items.length === 0) {
            this.showNotification('Your cart is empty');
            return;
        }
        
        // Save cart for checkout
        localStorage.setItem('checkout_cart', JSON.stringify(this.items));
        localStorage.setItem('checkout_subtotal', this.getSubtotal().toString());
        localStorage.setItem('checkout_total', this.getTotal().toString());
        
        // Redirect to checkout
        window.location.href = 'checkout.html';
    }
}

// Initialize cart system
const cartSystem = new CartSystem();

// Export for use in other files
window.cartSystem = cartSystem;