# Second Chances - Missed Connections App

A modern web application helping people reconnect after missed encounters. Built with React, Node.js, and PostgreSQL.

## 🚀 Features

### Free Features
- Browse missed connections in your area
- Post your own missed connection stories
- Search by location, date, and keywords
- Responsive design for mobile and desktop

### Premium Features ($9.99/month)
- Private messaging with potential matches
- Extended search radius (up to 200km)
- Priority post placement
- Advanced search filters
- Read receipts for messages
- View analytics on your posts

## 🛠️ Tech Stack

- **Frontend**: React 18, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **Authentication**: JWT tokens, bcrypt
- **Payments**: Stripe
- **Hosting**: DigitalOcean App Platform

## 📦 Installation

### Prerequisites
- Node.js 16+ and npm
- PostgreSQL database
- Stripe account for payments

### Environment Variables
Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/second_chances

# JWT Secret (generate a random string)
JWT_SECRET=your_super_secret_jwt_key_here

# Stripe Keys
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# App URLs
CLIENT_URL=http://localhost:3000
NODE_ENV=development
PORT=3001
```

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/second-chances-app.git
   cd second-chances-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   - Create a PostgreSQL database called `second_chances`
   - Run the SQL schema from `database/schema.sql`

4. **Start development servers**
   ```bash
   npm run dev
   ```

   This starts both the React frontend (port 3000) and Node.js backend (port 3001).

## 🚀 Deployment

### DigitalOcean App Platform

1. **Create Database**
   - Go to DigitalOcean → Create → Databases
   - Choose PostgreSQL, Toronto region
   - Run the schema from `database/schema.sql`

2. **Deploy App**
   - Go to DigitalOcean → Create → Apps
   - Connect your GitHub repository
   - Set environment variables in the app settings
   - Choose Toronto region for Canadian hosting

3. **Configure Stripe**
   - Set up webhook endpoint: `https://yourapp.ondigitalocean.app/api/webhooks/stripe`
   - Add webhook secret to environment variables

### Environment Variables for Production
```env
DATABASE_URL=your_digitalocean_database_url
JWT_SECRET=your_production_jwt_secret
STRIPE_SECRET_KEY=sk_live_your_live_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret
CLIENT_URL=https://yourapp.ondigitalocean.app
NODE_ENV=production
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Posts
- `GET /api/posts` - Get all posts (with filters)
- `POST /api/posts` - Create new post (auth required)
- `GET /api/posts/:id` - Get specific post
- `POST /api/posts/:id/respond` - Respond to a post (auth required)

### Subscriptions
- `POST /api/subscriptions/create-checkout` - Create Stripe checkout session
- `POST /api/webhooks/stripe` - Handle Stripe webhooks

## 💰 Pricing Structure

- **Monthly**: $9.99 CAD/month
- **3 Months**: $24.99 CAD (17% savings)
- **6 Months**: $44.99 CAD (25% savings) - Most Popular
- **12 Months**: $79.99 CAD (33% savings)

## 🔒 Security Features

- Passwords hashed with bcrypt
- JWT tokens for authentication
- CORS protection
- Rate limiting on API endpoints
- Input validation and sanitization
- HTTPS in production
- No photos initially (safety feature)

## 📱 Mobile Responsive

The app is fully responsive and works great on:
- Desktop computers
- Tablets
- Mobile phones (iOS and Android)

## 🇨🇦 Canadian Compliance

- Hosted in Canadian data centers (DigitalOcean Toronto)
- CAD currency for payments
- PIPEDA privacy compliance ready
- HST/GST tax handling through Stripe

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, email support@secondchances.app or create an issue in this repository.

## 🙏 Acknowledgments

- React community for amazing tools
- DigitalOcean for Canadian hosting
- Stripe for payment processing
- Tailwind CSS for beautiful styling
