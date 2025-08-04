// server.js - Main backend file
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../build')));

// JWT middleware for protected routes
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// ===== AUTH ROUTES =====

// Register user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id, email, name',
      [email, hashedPassword, name]
    );
    
    const token = jwt.sign(
      { userId: result.rows[0].id, email: result.rows[0].email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({ token, user: result.rows[0] });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        is_premium: user.is_premium 
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ===== POSTS ROUTES =====

// Get all posts with filters
app.get('/api/posts', async (req, res) => {
  try {
    const { location, date, keywords, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT p.*, u.name as author_name, 
             (SELECT COUNT(*) FROM post_responses WHERE post_id = p.id) as response_count
      FROM posts p 
      JOIN users u ON p.user_id = u.id 
      WHERE p.is_active = true
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (location) {
      paramCount++;
      query += ` AND p.location ILIKE $${paramCount}`;
      params.push(`%${location}%`);
    }
    
    if (date) {
      paramCount++;
      query += ` AND p.encounter_date = $${paramCount}`;
      params.push(date);
    }
    
    if (keywords) {
      paramCount++;
      query += ` AND (p.story ILIKE $${paramCount} OR p.their_description ILIKE $${paramCount})`;
      params.push(`%${keywords}%`);
    }
    
    query += ` ORDER BY p.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Create new post
app.post('/api/posts', authenticateToken, async (req, res) => {
  try {
    const { location, encounter_date, encounter_time, your_description, their_description, story } = req.body;
    
    const result = await pool.query(`
      INSERT INTO posts (user_id, location, encounter_date, encounter_time, your_description, their_description, story, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
    `, [req.user.userId, location, encounter_date, encounter_time, your_description, their_description, story]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// ===== RESPONSES ROUTES =====

// Respond to a post
app.post('/api/posts/:postId/respond', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { message } = req.body;
    
    const result = await pool.query(`
      INSERT INTO post_responses (post_id, user_id, message, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `, [postId, req.user.userId, message]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating response:', error);
    res.status(500).json({ error: 'Failed to create response' });
  }
});

// Get responses for a post (premium feature)
app.get('/api/posts/:postId/responses', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    
    // Check if user is premium or owns the post
    const postCheck = await pool.query('SELECT user_id FROM posts WHERE id = $1', [postId]);
    const userCheck = await pool.query('SELECT is_premium FROM users WHERE id = $1', [req.user.userId]);
    
    if (postCheck.rows[0].user_id !== req.user.userId && !userCheck.rows[0].is_premium) {
      return res.status(403).json({ error: 'Premium subscription required' });
    }
    
    const result = await pool.query(`
      SELECT r.*, u.name, u.email 
      FROM post_responses r
      JOIN users u ON r.user_id = u.id
      WHERE r.post_id = $1
      ORDER BY r.created_at DESC
    `, [postId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching responses:', error);
    res.status(500).json({ error: 'Failed to fetch responses' });
  }
});

// ===== SUBSCRIPTION ROUTES =====

// Create Stripe checkout session
app.post('/api/subscriptions/create-checkout', authenticateToken, async (req, res) => {
  try {
    const { planId } = req.body;
    
    const plans = {
      'monthly': { price: 999, interval: 'month' },
      'quarterly': { price: 2499, interval: 'month', interval_count: 3 },
      'semi-annual': { price: 4499, interval: 'month', interval_count: 6 },
      'annual': { price: 7999, interval: 'year' }
    };
    
    const plan = plans[planId];
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan' });
    }
    
    const session = await stripe.checkout.sessions.create({
      customer_email: req.user.email,
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'cad',
          product_data: {
            name: 'Second Chances Premium',
            description: 'Premium subscription for Second Chances app'
          },
          unit_amount: plan.price,
          recurring: {
            interval: plan.interval,
            interval_count: plan.interval_count || 1
          }
        },
        quantity: 1
      }],
      mode: 'subscription',
      success_url: `${process.env.CLIENT_URL}/success`,
      cancel_url: `${process.env.CLIENT_URL}/cancel`,
      metadata: {
        userId: req.user.userId,
        planId: planId
      }
    });
    
    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Stripe webhook handler
app.post('/api/webhooks/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle subscription events
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      await pool.query(
        'UPDATE users SET is_premium = true, subscription_id = $1 WHERE id = $2',
        [session.subscription, session.metadata.userId]
      );
      break;
      
    case 'invoice.payment_failed':
      // Handle failed payment
      break;
      
    case 'customer.subscription.deleted':
      const subscription = event.data.object;
      await pool.query(
        'UPDATE users SET is_premium = false WHERE subscription_id = $1',
        [subscription.id]
      );
      break;
  }
  
  res.json({received: true});
});

// ===== SERVE REACT APP =====

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
