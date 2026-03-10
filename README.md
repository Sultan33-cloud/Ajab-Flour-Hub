# Ajab Flour Digital Hub

A full-featured e-commerce platform for Ajab Flour Company, built as a software engineering portfolio project.

## 🚀 Features

### Customer Features
- Product catalog with filtering by category
- Shopping cart with quantity management
- Secure checkout process
- Bulk order inquiries
- AI-powered chatbot assistant with sound notifications
- Dark/Light theme with stars and sunset effects
- Video header on landing page
- User registration and login
- Order history tracking

### Admin Features
- Dashboard with real-time statistics
- Order management (view, update status)
- Product management (add, edit, delete)
- Inventory tracking with low stock alerts
- Customer management
- Sales analytics and reports

### Technical Features
- JWT authentication
- PostgreSQL database with JavaScript setup
- RESTful API
- Responsive design for all devices
- M-Pesa payment simulation
- Real-time cart synchronization

## 🛠️ Technology Stack

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- Chart.js for analytics
- Font Awesome icons
- Google Fonts (Poppins, Inter, Playfair Display)
- Web Audio API for sound effects

### Backend
- Node.js with Express
- PostgreSQL database
- JWT for authentication
- bcrypt for password hashing

## 📁 Project Structure
AJAB-FLOUR-HUB/
├── backend/
│ ├── node_modules/
│ ├── .env
│ ├── database.js # Database setup and queries
│ ├── init-db.js # Database initialization
│ ├── server.js # Main backend server (port 5300)
│ ├── package.json
│ └── package-lock.json
├── frontend/
│ ├── index.html # Landing page with video header
│ ├── admin-login.html # Admin login page
│ ├── admin.html # Admin dashboard
│ ├── checkout.html # Checkout page
│ ├── order-confirmation.html # Order confirmation
│ ├── css/
│ │ ├── styles.css # Main styles with glowing fonts
│ │ └── admin.css # Admin dashboard styles
│ ├── js/
│ │ ├── main.js # Main site functionality
│ │ ├── admin.js # Admin dashboard logic
│ │ ├── cart.js # Shopping cart system
│ │ ├── ai-assistant.js # AI chatbot with sound
│ │ └── theme.js # Dark/light theme manager
│ └── assets/
│ ├── images/ # Background images
│ ├── videos/ # Header video
│ └── sounds/ # AI assistant sounds
├── scripts/
│ └── seed-data.js # Sample data seeder
└── README.md

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Database Setup

1. **Create PostgreSQL database:**
```bash
psql -U postgres
CREATE DATABASE ajab_flour_hub;
\q