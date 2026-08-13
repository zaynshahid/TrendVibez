import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth, API_URL } from './AuthContext.jsx';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user, token } = useAuth();
  const [cart, setCart] = useState([]);
  const [loadingCart, setLoadingCart] = useState(true);

  // Load cart on boot or user/token change
  useEffect(() => {
    async function syncCart() {
      setLoadingCart(true);
      if (token && user) {
        try {
          // If there are items in the local guest cart, merge them into the database first
          const guestCartJson = localStorage.getItem('tv_guest_cart');
          if (guestCartJson) {
            const guestCart = JSON.parse(guestCartJson);
            for (const item of guestCart) {
              await fetch(`${API_URL}/cart`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  productId: item.productId,
                  variantId: item.variantId || '',
                  selectedColor: item.selectedColor || '',
                  quantity: item.quantity
                })
              });
            }
            // Clear guest cart once synced
            localStorage.removeItem('tv_guest_cart');
          }

          // Now fetch the fully consolidated database cart
          const res = await fetch(`${API_URL}/cart`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const dbCart = await res.json();
            setCart(dbCart);
          }
        } catch (error) {
          console.error('Failed to sync/fetch cart:', error);
        }
      } else {
        // Logged out / Guest user: read cart from local storage
        const localCart = localStorage.getItem('tv_guest_cart');
        if (localCart) {
          try {
            setCart(JSON.parse(localCart));
          } catch (e) {
            setCart([]);
          }
        } else {
          setCart([]);
        }
      }
      setLoadingCart(false);
    }

    syncCart();
  }, [token, user]);

  const addToCart = async (productId, quantity = 1, variantId = '', selectedColor = '') => {
    if (token) {
      // Logged in: API call
      const res = await fetch(`${API_URL}/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId, variantId, selectedColor, quantity })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to add item to cart');
      }
      setCart(data);
    } else {
      // Guest: Local storage
      const res = await fetch(`${API_URL}/products/${productId}`);
      if (!res.ok) {
        throw new Error('Product not found');
      }
      const product = await res.json();

      let stockLimit = product.stock;
      let variant = null;
      if (variantId && Array.isArray(product.variants)) {
        variant = product.variants.find(item => item.id === variantId) || null;
        if (variant) stockLimit = parseInt(variant.stock || 0);
      }

      setCart(prevCart => {
        const itemIndex = prevCart.findIndex(item => item.productId === productId && (item.variantId || '') === variantId);
        let newCart = [...prevCart];
        const sizeLabels = ['XS', 'S', 'M', 'L', 'XL', 'Small', 'Medium', 'Large'];
        const derivedVariantType = variant ? (variant.variantType || 'color') : (sizeLabels.includes(selectedColor) ? 'size' : 'color');

        if (itemIndex > -1) {
          const newQty = newCart[itemIndex].quantity + quantity;
          if (newQty > stockLimit) {
            throw new Error(`Insufficient stock. Only ${stockLimit} items available.`);
          }
          newCart[itemIndex].quantity = newQty;
          newCart[itemIndex].selectedColor = selectedColor || newCart[itemIndex].selectedColor;
          newCart[itemIndex].variantType = newCart[itemIndex].variantType || derivedVariantType;
        } else {
          if (quantity > stockLimit) {
            throw new Error(`Insufficient stock. Only ${stockLimit} items available.`);
          }
          newCart.push({
            productId,
            variantId,
            selectedColor,
            variantType: derivedVariantType,
            quantity,
            product: {
              ...product,
              stock: stockLimit
            }
          });
        }
        localStorage.setItem('tv_guest_cart', JSON.stringify(newCart));
        return newCart;
      });
    }
  };

  const updateQuantity = async (productId, quantity, variantId = '', selectedColor = '') => {
    if (quantity <= 0) {
      return removeFromCart(productId, variantId);
    }

    if (token) {
      const res = await fetch(`${API_URL}/cart`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId, variantId, selectedColor, quantity })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update quantity');
      }
      setCart(data);
    } else {
      const res = await fetch(`${API_URL}/products/${productId}`);
      if (!res.ok) throw new Error('Product not found');
      const product = await res.json();

      let stockLimit = product.stock;
      if (variantId && Array.isArray(product.variants)) {
        const v = product.variants.find(item => item.id === variantId);
        if (v) stockLimit = v.stock;
      }

      if (quantity > stockLimit) {
        throw new Error(`Insufficient stock. Only ${stockLimit} items available.`);
      }

      setCart(prevCart => {
        const newCart = prevCart.map(item => 
          (item.productId === productId && (item.variantId || '') === variantId) ? { ...item, quantity } : item
        );
        localStorage.setItem('tv_guest_cart', JSON.stringify(newCart));
        return newCart;
      });
    }
  };

  const removeFromCart = async (productId, variantId = '') => {
    if (token) {
      const url = `${API_URL}/cart/${productId}${variantId ? `?variantId=${variantId}` : ''}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to remove item');
      }
      setCart(data);
    } else {
      setCart(prevCart => {
        const newCart = prevCart.filter(item => !(item.productId === productId && (item.variantId || '') === variantId));
        localStorage.setItem('tv_guest_cart', JSON.stringify(newCart));
        return newCart;
      });
    }
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('tv_guest_cart');
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.product?.price || 0) * item.quantity, 0);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart,
      loadingCart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      cartTotal: parseFloat(cartTotal.toFixed(2)),
      cartCount
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
