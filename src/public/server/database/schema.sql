-- Second Chances Database Schema
-- Run this in your PostgreSQL database

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_premium BOOLEAN DEFAULT FALSE,
    subscription_id VARCHAR(255),
    subscription_plan VARCHAR(50),
    subscription_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Posts (missed connections) table
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    location VARCHAR(255) NOT NULL,
    encounter_date DATE NOT NULL,
    encounter_time VARCHAR(50),
    your_description TEXT,
    their_description TEXT NOT NULL,
    story TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Post responses table
CREATE TABLE post_responses (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages table (for premium private messaging)
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES posts(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions table (for tracking subscription history)
CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    plan_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User sessions table (for JWT token management)
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_location ON posts(location);
CREATE INDEX idx_posts_encounter_date ON posts(encounter_date);
CREATE INDEX idx_posts_created_at ON posts(created_at);
CREATE INDEX idx_post_responses_post_id ON post_responses(post_id);
CREATE INDEX idx_post_responses_user_id ON post_responses(user_id);
CREATE INDEX idx_messages_sender_recipient ON messages(sender_id, recipient_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing (optional)
INSERT INTO users (email, password_hash, name, is_premium) VALUES 
('test@example.com', '$2b$10$example_hash_here', 'Test User', false),
('premium@example.com', '$2b$10$example_hash_here', 'Premium User', true);

-- Sample posts
INSERT INTO posts (user_id, location, encounter_date, encounter_time, your_description, their_description, story) VALUES 
(1, 'Walmart - Halifax', '2025-08-02', '3:30 PM', 'Brown hair, blue top, probably seemed like I was staring', 'Lovely smile, blue shirt, no ring visible', 'You were in the grocery section and our eyes met a few times. Your smile absolutely took my breath away and I regret not having the courage to say hello.'),
(1, 'Tim Hortons - Dartmouth', '2025-08-01', '8:15 AM', 'Red jacket, ordering a double-double', 'Beautiful laugh, long dark hair, reading a book', 'You were reading while waiting for your order. When you laughed at something in your book, it was the most genuine sound. I was too shy to interrupt your reading.');

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
