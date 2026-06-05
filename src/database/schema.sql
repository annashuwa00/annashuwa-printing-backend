-- Annashuwa Printing Solution Database Schema
-- PostgreSQL Database

-- Drop existing tables if they exist (for development)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS service_requests CASCADE;
DROP TABLE IF EXISTS designs CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    fullname VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'super_admin')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    email_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(255),
    reset_password_token VARCHAR(255),
    reset_password_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    available_colors JSONB,
    dimensions VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders Table
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    service_type VARCHAR(255) NOT NULL,
    description TEXT,
    quantity INTEGER DEFAULT 1,
    amount DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'delivered')),
    tracking_number VARCHAR(50) UNIQUE,
    delivery_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Designs Table
CREATE TABLE designs (
    design_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    design_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    thumbnail_path VARCHAR(500),
    design_data JSONB,
    template_type VARCHAR(100),
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service Requests Table
CREATE TABLE service_requests (
    request_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    service VARCHAR(255) NOT NULL,
    details TEXT,
    quantity INTEGER,
    deadline DATE,
    budget DECIMAL(10,2),
    priority VARCHAR(50) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'in_progress', 'completed')),
    reference_files TEXT[],
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions Table
CREATE TABLE transactions (
    transaction_id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(order_id),
    user_id INTEGER REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(100) CHECK (payment_method IN ('paystack', 'flutterwave', 'bank_transfer')),
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'success', 'failed', 'refunded')),
    transaction_reference VARCHAR(255) UNIQUE,
    gateway_response JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(50) CHECK (type IN ('order', 'design', 'service', 'payment', 'system')),
    read BOOLEAN DEFAULT false,
    link VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_designs_user_id ON designs(user_id);
CREATE INDEX idx_service_requests_user_id ON service_requests(user_id);
CREATE INDEX idx_service_requests_status ON service_requests(status);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_order_id ON transactions(order_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);

-- Insert default admin user (password: admin123 - should be changed in production)
INSERT INTO users (fullname, email, phone, password_hash, role, status, email_verified) 
VALUES ('Super Admin', 'admin@annashuwa.com', '+2348000000000', '$2a$10$rQ8K8Z8Z8Z8Z8Z8Z8Z8Z8e8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8', 'super_admin', 'active', true);

-- Insert sample products
INSERT INTO products (name, category, base_price, description, available_colors) VALUES
-- Apparel
('Custom T-Shirt', 'apparel', 2500.00, 'High-quality cotton t-shirt with custom printing', '["white", "black", "red", "blue", "yellow"]'),
('Custom Hoodie', 'apparel', 4500.00, 'Comfortable hoodie with custom design', '["white", "black", "gray", "navy"]'),
('Custom Polo Shirt', 'apparel', 3000.00, 'Professional polo shirt with embroidery', '["white", "black", "navy", "red"]'),
('Custom Jersey', 'apparel', 3500.00, 'Sports jersey with team printing', '["white", "black", "red", "blue"]'),
-- Drinkware
('Custom Mug', 'drinkware', 1500.00, 'Ceramic mug with full-color printing', '["white", "black", "red", "blue"]'),
('Custom Water Bottle', 'drinkware', 2000.00, 'Insulated water bottle with custom print', '["white", "black", "blue", "red"]'),
('Custom Wine Glass', 'drinkware', 1800.00, 'Elegant wine glass with etched design', '["clear", "colored"]'),
('Custom Tumbler', 'drinkware', 2200.00, 'Double-wall tumbler with custom wrap', '["white", "black", "clear"]'),
-- Headwear
('Custom Cap', 'headwear', 2000.00, 'Adjustable cap with embroidered design', '["white", "black", "navy", "red"]'),
('Custom Beanie', 'headwear', 1800.00, 'Warm beanie with custom patch', '["black", "gray", "navy", "red"]'),
('Custom Snapback', 'headwear', 2500.00, 'Trendy snapback with custom design', '["black", "white", "navy", "red"]'),
-- Paper Products
('Business Card', 'paper', 500.00, 'Premium business cards with various finishes', '["white", "cream", "grey"]'),
('Flyer', 'paper', 800.00, 'Professional flyers for marketing', '["white", "colored"]'),
('Brochure', 'paper', 1200.00, 'Tri-fold brochure with full color', '["glossy", "matte"]'),
('Letterhead', 'paper', 600.00, 'Custom letterhead for business', '["white", "cream", "colored"]'),
('Envelope', 'paper', 400.00, 'Custom printed envelopes', '["white", "kraft", "colored"]'),
('Notepad', 'paper', 700.00, 'Custom notepad with logo', '["white", "yellow", "colored"]'),
-- Large Format
('Banner', 'large_format', 5000.00, 'Large format banners for events', '["white", "colored"]'),
('Poster', 'large_format', 1200.00, 'High-quality poster printing', '["glossy", "matte"]'),
('Flex Banner', 'large_format', 4500.00, 'Durable flex banner for outdoor use', '["white", "colored"]'),
('Vinyl Banner', 'large_format', 5500.00, 'Weather-resistant vinyl banner', '["white", "colored"]'),
('Backdrop', 'large_format', 8000.00, 'Step and repeat backdrop for events', '["white", "colored"]'),
-- Framing
('Frame', 'framing', 3500.00, 'Custom picture frames', '["black", "brown", "white", "silver"]'),
('Canvas Print', 'framing', 4000.00, 'Canvas print with wooden frame', '["natural", "black", "white"]'),
('Acrylic Frame', 'framing', 5000.00, 'Modern acrylic frame with stand', '["clear", "colored"]'),
-- Display
('Roll-Up Stand', "display", 15000.00, 'Portable roll-up banner stand', '["silver", "black"]'),
('X-Banner Stand', "display", 12000.00, 'X-banner stand for indoor display', '["silver", "black"]'),
('Pop-Up Display', "display", 25000.00, 'Large pop-up display for exhibitions', '["various"]'),
('Table Cover', "display", 8000.00, 'Custom printed table cover', '["white", "black", "colored"]'),
-- Decals & Stickers
('Sticker', 'decals', 300.00, 'Custom stickers and decals', '["white", "transparent", "colored"]'),
('Car Decal', 'decals', 2500.00, 'Vehicle decal with custom design', '["white", "transparent", "colored"]'),
('Window Decal', 'decals', 1500.00, 'Window decal for storefront', '["white", "transparent", "colored"]'),
('Wall Decal', 'decals', 2000.00, 'Removable wall decal for decoration', '["various colors"]'),
('Label', 'decals', 400.00, 'Custom product labels', '["white", "transparent", "colored"]');
