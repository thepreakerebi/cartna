'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';
import useAuthStore from './auth';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuthStore();

  const fetchCart = async () => {
    try {
      const response = await api.get('/cart', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setCartItems(response.data);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    try {
      const response = await api.post('/cart', { productId, quantity }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setCartItems(response.data);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const response = await api.delete('/cart', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        data: { productId }
      });
      setCartItems(response.data.data);
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const updateCartItemQuantity = async (productId, quantity) => {
    try {
      const response = await api.put('/cart', { productId, quantity }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setCartItems(response.data.data);
    } catch (error) {
      console.error('Error updating cart:', error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCart();
    }
  }, [token]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loading,
        addToCart,
        removeFromCart,
        updateCartItemQuantity,
        fetchCart,
      }}
    >
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