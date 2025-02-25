'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';
import useAuthStore from './auth';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { token } = useAuthStore();

  const fetchCart = async () => {
    if (!token) {
      setCartItems([]);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/cart', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const items = response.data.data.items || [];
      const mappedItems = items.map(item => ({
        ...item,
        product: {
          ...item.product,
          price: item.product.price || item.product.unitPrice || 0
        }
      }));
      setCartItems(mappedItems);
    } catch (error) {
      console.error('Error fetching cart:', error);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    if (!token) return;

    try {
      const response = await api.post('/cart', { productId, quantity }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const items = response.data.data.items || [];
      const mappedItems = items.map(item => ({
        ...item,
        product: {
          ...item.product,
          price: item.product.price || item.product.unitPrice || 0
        }
      }));
      setCartItems(mappedItems);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const removeFromCart = async (productId) => {
    if (!token) return;

    try {
      const response = await api.delete('/cart/items', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        data: { productId }
      });
      const items = response.data.data.items || [];
      const mappedItems = items.map(item => ({
        ...item,
        product: {
          ...item.product,
          price: item.product.price || item.product.unitPrice || 0
        }
      }));
      setCartItems(mappedItems);
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  // New function for local quantity updates
  const updateLocalCartItemQuantity = (productId, newQuantity) => {
    setCartItems(prevItems => {
      return prevItems.map(item => {
        if (item.product._id === productId) {
          return {
            ...item,
            quantity: newQuantity
          };
        }
        return item;
      });
    });
  };

  // Modified to handle backend synchronization
  const updateCartItemQuantity = async (productId, quantity) => {
    if (!token) return;

    try {
      const response = await api.patch('/cart', { productId, quantity }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const items = response.data.data.items || [];
      const mappedItems = items.map(item => ({
        ...item,
        product: {
          ...item.product,
          price: item.product.price || item.product.unitPrice || 0
        }
      }));
      setCartItems(mappedItems);
    } catch (error) {
      console.error('Error updating cart:', error);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchCart();
  }, [token]);

  if (!mounted) {
    return null;
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loading,
        addToCart,
        removeFromCart,
        updateCartItemQuantity,
        updateLocalCartItemQuantity,
        fetchCart
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