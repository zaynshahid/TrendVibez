import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const WishlistContext = createContext(null);
const STORAGE_KEY = 'tv_wishlist';

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    try {
      const storedWishlist = localStorage.getItem(STORAGE_KEY);
      setWishlist(storedWishlist ? JSON.parse(storedWishlist) : []);
    } catch (error) {
      console.error('Failed to load wishlist:', error);
      setWishlist([]);
    }
  }, []);

  const persistWishlist = (nextWishlist) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextWishlist));
    return nextWishlist;
  };

  const addToWishlist = (product) => {
    if (!product?.id) return;

    setWishlist((current) => {
      if (current.some((item) => item.id === product.id)) return current;
      return persistWishlist([
        ...current,
        {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          category: product.category,
          image: product.image,
          stock: product.stock,
          rating: product.rating,
        },
      ]);
    });
  };

  const removeFromWishlist = (productId) => {
    setWishlist((current) => persistWishlist(current.filter((item) => item.id !== productId)));
  };

  const toggleWishlist = (product) => {
    if (!product?.id) return;
    setWishlist((current) => {
      if (current.some((item) => item.id === product.id)) {
        return persistWishlist(current.filter((item) => item.id !== product.id));
      }
      return persistWishlist([
        ...current,
        {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          category: product.category,
          image: product.image,
          stock: product.stock,
          rating: product.rating,
        },
      ]);
    });
  };

  const clearWishlist = () => {
    setWishlist([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(() => ({
    wishlist,
    wishlistCount: wishlist.length,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    clearWishlist,
    isWishlisted: (productId) => wishlist.some((item) => item.id === productId),
  }), [wishlist]);

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
