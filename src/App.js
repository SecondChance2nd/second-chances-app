import React, { useState, useEffect } from 'react';
import { Heart, MapPin, Clock, Search, Plus, MessageCircle, Star, Filter, User, LogOut, LogIn } from 'lucide-react';

const API_BASE = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001';

const MissedConnectionsApp = () => {
  const [currentView, setCurrentView] = useState('browse');
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [searchFilters, setSearchFilters] = useState({
    location: '',
    date: '',
    keywords: ''
  });
  const [showSubscription, setShowSubscription] = useState(false);
  const [newPost, setNewPost] = useState({
    location: '',
    encounter_date: '',
    encounter_time: '',
    your_description: '',
    their_description: '',
    story: ''
  });
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    name: ''
  });

  const subscriptionPlans = [
    {
      id: 'monthly',
      name: 'Monthly',
      price: 9.99,
      originalPrice: 9.99,
      period: 'month',
      savings: 0,
      popular: false
    },
    {
      id: 'quarterly',
      name: '3 Months',
      price: 24.99,
      originalPrice: 29.97,
      period: '3 months',
      savings: 17,
      popular: false
    },
    {
      id: 'semi-annual',
      name: '6 Months',
      price: 44.99,
      originalPrice: 59.94,
      period: '6 months',
      savings: 25,
      popular: true
    },
    {
      id: 'annual',
      name: '12 Months',
      price: 79.99,
      originalPrice: 119.88,
      period: 'year',
      savings: 33,
      popular: false
    }
  ];

  // Check for existing token on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and get user info
      fetchUserInfo(token);
    }
    fetchPosts();
  }, []);

  const fetchUserInfo = async (token) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      localStorage.removeItem('token');
    }
  };

  const fetchPosts = async () => {
    try {
      const params = new URLSearchParams();
      if (searchFilters.location) params.append('location', searchFilters.location);
      if (searchFilters.date) params.append('date', searchFilters.date);
      if (searchFilters.keywords) params.append('keywords', searchFilters.keywords);

      const response = await fetch(`${API_BASE}/api/posts?${params}`);
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(authForm)
      });

      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        setShowAuth(false);
        setAuthForm({ email: '', password: '', name: '' });
      } else {
        alert(data.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Auth error:', error);
      alert('Authentication failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setCurrentView('browse');
  };

  const handlePostSubmit = async () => {
    if (!user) {
      setShowAuth(true);
      return;
    }

    if (newPost.location && newPost.encounter_date && newPost.their_description) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/api/posts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(newPost)
        });

        if (response.ok) {
          const post = await response.json();
          setPosts([post, ...posts]);
          setNewPost({
            location: '',
            encounter_date: '',
            encounter_time: '',
            your_description: '',
            their_description: '',
            story: ''
          });
          setCurrentView('browse');
          fetchPosts(); // Refresh posts
        } else {
          alert('Failed to create post');
        }
      } catch (error) {
        console.error('Error creating post:', error);
        alert('Failed to create post');
      }
    }
  };

  const handleSubscribe = async (planId) => {
    if (!user) {
      setShowAuth(true);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/subscriptions/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ planId })
      });

      const data = await response.json();
      
      if (response.ok) {
        // Redirect to Stripe Checkout
        const stripe = window.Stripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
        stripe.redirectToCheckout({ sessionId: data.sessionId });
      } else {
        alert('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Failed to start subscription');
    }
  };

  const PostCard = ({ post }) => (
    <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center text-gray-600 text-sm">
          <MapPin className="w-4 h-4 mr-1" />
          {post.location}
        </div>
        <div className="flex items-center text-gray-500 text-sm">
          <Clock className="w-4 h-4 mr-1" />
          {new Date(post.created_at).toLocaleDateString()}
        </div>
      </div>
      
      <div className="mb-4">
        <div className="text-sm text-gray-600 mb-2">
          <strong>{new Date(post.encounter_date).toLocaleDateString()}</strong> 
          {post.encounter_time && <span> at <strong>{post.encounter_time}</strong></span>}
        </div>
        <div className="bg-rose-50 p-3 rounded-lg mb-3">
          {post.your_description && (
            <p className="text-sm text-gray-700 mb-2">
              <strong>I was:</strong> {post.your_description}
            </p>
          )}
          <p className="text-sm text-gray-700">
            <strong>You were:</strong> {post.their_description}
          </p>
        </div>
        {post.story && <p className="text-gray-800 leading-relaxed">{post.story}</p>}
      </div>
      
      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
        <div className="flex items-center text-gray-500 text-sm">
          <Heart className="w-4 h-4 mr-1" />
          {post.response_count || 0} responses
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => !user ? setShowAuth(true) : null}
            className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors text-sm"
          >
            This might be me!
          </button>
          {user && user.is_premium && (
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center">
              <MessageCircle className="w-4 h-4 mr-1" />
              Message
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const AuthModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {isLogin ? 'Sign In' : 'Create Account'}
          </h2>
          <button 
            onClick={() => setShowAuth(false)}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                value={authForm.name}
                onChange={(e) => setAuthForm({...authForm, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                required={!isLogin}
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={authForm.email}
              onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={authForm.password}
              onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-rose-500 text-white py-2 rounded-lg hover:bg-rose-600 transition-colors"
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-rose-500 hover:text-rose-600 text-sm"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );

  const PremiumBanner = () => (
    <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white p-4 rounded-xl mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold flex items-center">
            <Star className="w-5 h-5 mr-2" />
            Upgrade to Premium
          </h3>
          <p className="text-sm opacity-90">Private messaging • Extended radius • Priority placement</p>
        </div>
        <button 
          onClick={() => setShowSubscription(true)}
          className="bg-white text-rose-500 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          View Plans
        </button>
      </div>
    </div>
  );

  const SubscriptionModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Choose Your Plan</h2>
              <p className="text-gray-600 mt-1">Unlock premium features to find your perfect connection</p>
            </div>
            <button 
              onClick={() => setShowSubscription(false)}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {subscriptionPlans.map((plan) => (
              <div 
                key={plan.id}
                className={`relative border-2 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer ${
                  plan.popular 
                    ? 'border-rose-500 bg-rose-50 transform scale-105' 
                    : 'border-gray-200 hover:border-rose-300'
                }`}
                onClick={() => handleSubscribe(plan.id)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-rose-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center">
                  <h3 className="text-xl font-medium text-gray-600 mb-2">No connections found</h3>
                  <p className="text-gray-500">Try adjusting your search filters or be the first to post!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'post' && (
          <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Share Your Missed Connection</h2>
            
            {!user && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-blue-800">
                  You need to be signed in to post a missed connection. 
                  <button 
                    onClick={() => setShowAuth(true)}
                    className="ml-1 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Sign in here
                  </button>
                </p>
              </div>
            )}
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                  <input
                    type="text"
                    placeholder="e.g., Walmart - Halifax"
                    value={newPost.location}
                    onChange={(e) => setNewPost({...newPost, location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                  <input
                    type="date"
                    value={newPost.encounter_date}
                    onChange={(e) => setNewPost({...newPost, encounter_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Approximate Time</label>
                <input
                  type="text"
                  placeholder="e.g., 3:30 PM, Morning, Evening"
                  value={newPost.encounter_time}
                  onChange={(e) => setNewPost({...newPost, encounter_time: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>

              <div className="bg-rose-50 p-4 rounded-lg">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">I was... (describe yourself)</label>
                  <textarea
                    placeholder="e.g., Brown hair, blue top, probably seemed like I was staring"
                    value={newPost.your_description}
                    onChange={(e) => setNewPost({...newPost, your_description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent h-20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">You were... (describe them) *</label>
                  <textarea
                    placeholder="e.g., Lovely smile, blue shirt, no ring visible"
                    value={newPost.their_description}
                    onChange={(e) => setNewPost({...newPost, their_description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent h-20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Story</label>
                <textarea
                  placeholder="Tell the story of your encounter... What happened? What made this moment special?"
                  value={newPost.story}
                  onChange={(e) => setNewPost({...newPost, story: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent h-32"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setCurrentView('browse')}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePostSubmit}
                  disabled={!user || !newPost.location || !newPost.encounter_date || !newPost.their_description}
                  className="px-6 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Share Your Story
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MissedConnectionsApp;="font-bold text-lg text-gray-800 mb-2">{plan.name}</h3>
                  
                  <div className="mb-4">
                    <div className="flex items-center justify-center">
                      <span className="text-3xl font-bold text-gray-800">${plan.price}</span>
                      <span className="text-gray-600 ml-1">/{plan.period}</span>
                    </div>
                    
                    {plan.savings > 0 && (
                      <div className="mt-2">
                        <div className="text-sm text-gray-500 line-through">
                          ${plan.originalPrice}
                        </div>
                        <div className="text-sm font-medium text-green-600">
                          Save {plan.savings}%
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-4">
                    ${(plan.price / (plan.period === 'month' ? 1 : plan.period === '3 months' ? 3 : plan.period === '6 months' ? 6 : 12)).toFixed(2)}/month
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
              <Star className="w-5 h-5 mr-2 text-rose-500" />
              Premium Features Include:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
              <div className="flex items-center">
                <MessageCircle className="w-4 h-4 mr-2 text-rose-500" />
                Private messaging with matches
              </div>
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-rose-500" />
                Extended search radius (up to 200km)
              </div>
              <div className="flex items-center">
                <Star className="w-4 h-4 mr-2 text-rose-500" />
                Priority post placement
              </div>
              <div className="flex items-center">
                <Search className="w-4 h-4 mr-2 text-rose-500" />
                Advanced search filters
              </div>
              <div className="flex items-center">
                <Heart className="w-4 h-4 mr-2 text-rose-500" />
                Read receipts for messages
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-rose-500" />
                See who viewed your posts
              </div>
            </div>
          </div>
          
          <div className="text-center text-xs text-gray-500">
            <p>All subscriptions auto-renew. Cancel anytime from your account settings.</p>
            <p className="mt-1">Secure payment processing • 30-day money-back guarantee</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-pink-100">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Heart className="w-8 h-8 text-rose-500 mr-3" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
                Second Chances
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentView('browse')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentView === 'browse' 
                      ? 'bg-rose-500 text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Browse
                </button>
                <button
                  onClick={() => setCurrentView('post')}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
                    currentView === 'post' 
                      ? 'bg-rose-500 text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Post
                </button>
              </div>
              
              {user ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Hi, {user.name}!</span>
                  {user.is_premium && <Star className="w-4 h-4 text-yellow-500" />}
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuth(true)}
                  className="flex items-center px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                >
                  <LogIn className="w-4 h-4 mr-1" />
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {!user?.is_premium && <PremiumBanner />}
        {showAuth && <AuthModal />}
        {showSubscription && <SubscriptionModal />}

        {currentView === 'browse' && (
          <div>
            {/* Search Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-6 mb-6">
              <div className="flex items-center mb-4">
                <Search className="w-5 h-5 text-gray-500 mr-2" />
                <h2 className="text-lg font-semibold text-gray-800">Find Your Connection</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    placeholder="e.g., Halifax, Dartmouth..."
                    value={searchFilters.location}
                    onChange={(e) => setSearchFilters({...searchFilters, location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={searchFilters.date}
                    onChange={(e) => setSearchFilters({...searchFilters, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Keywords</label>
                  <input
                    type="text"
                    placeholder="blue shirt, smile, dog..."
                    value={searchFilters.keywords}
                    onChange={(e) => setSearchFilters({...searchFilters, keywords: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={fetchPosts}
                  className="px-6 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Posts */}
            <div className="space-y-6">
              {posts.length > 0 ? (
                posts.map(post => <PostCard key={post.id} post={post} />)
              ) : (
                <div className="text-center py-12">
                  <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className
