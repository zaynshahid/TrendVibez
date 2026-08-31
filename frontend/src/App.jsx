import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Context Providers
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { WishlistProvider } from './context/WishlistContext.jsx';
import { CurrencyProvider } from './context/CurrencyContext.jsx';

// Core UI Layout Components
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Chatbot from './components/Chatbot.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';

// Route Guards
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminRoute from './components/AdminRoute.jsx';

// Page Views
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Products from './pages/Products.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Cart from './pages/Cart.jsx';
import Wishlist from './pages/Wishlist.jsx';
import Checkout from './pages/Checkout.jsx';
import Payment from './pages/Payment.jsx';
import Receipt from './pages/Receipt.jsx';
import Dashboard from './pages/Dashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import Support from './pages/Support.jsx';

export default function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <CartProvider>
          <WishlistProvider>
            <BrowserRouter>
            <ScrollToTop />
            <div
              className="flex flex-col min-h-screen"
              style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            >
            {/* Header Sticky Navbar */}
            <Navbar />

            {/* Main Content viewport */}
            <main className="flex-1 w-full">
              <Routes>
                {/* 1. Public Storefront Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/support" element={<Support />} />

                {/* 2. Authentication Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* 3. Protected Flow Routes */}
                <Route path="/checkout" element={
                  <ProtectedRoute>
                    <Checkout />
                  </ProtectedRoute>
                } />
                <Route path="/payment" element={
                  <ProtectedRoute>
                    <Payment />
                  </ProtectedRoute>
                } />
                <Route path="/receipt" element={
                  <ProtectedRoute>
                    <Receipt />
                  </ProtectedRoute>
                } />

                {/* 4. Protected Client Dashboard */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />

                {/* 5. Protected Admin dashboard panel */}
                <Route path="/admin" element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } />

                {/* 6. Fallback redirect handler */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            {/* Footer Brand Banner */}
            <Footer />

            {/* AI Assistant Floating Chatbot */}
            <Chatbot />
            </div>
          </BrowserRouter>
        </WishlistProvider>
      </CartProvider>
    </CurrencyProvider>
    </AuthProvider>
  );
}
