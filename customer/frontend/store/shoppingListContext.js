'use client';

import { createContext, useContext, useState } from 'react';
import api from '../lib/api';
import useAuthStore from './auth';

const ShoppingListContext = createContext();

export function ShoppingListProvider({ children }) {
  const [list, setList] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const { token } = useAuthStore();

  const processShoppingList = async (listContent) => {
    if (!token || !listContent.trim()) return;

    setIsProcessing(true);
    setError('');

    try {
      const response = await api.post('/shopping-list/process', 
        { list: listContent },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error processing shopping list';
      setError(errorMessage);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const updateShoppingList = async (listContent) => {
    if (!token || !listContent.trim()) return;

    setIsProcessing(true);
    setError('');

    try {
      const response = await api.put('/shopping-list/update',
        { list: listContent },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error updating shopping list';
      setError(errorMessage);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const clearShoppingList = async () => {
    if (!token) return;

    setIsProcessing(true);
    setError('');

    try {
      const response = await api.delete('/shopping-list/clear', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setList('');
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error clearing shopping list';
      setError(errorMessage);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ShoppingListContext.Provider
      value={{
        list,
        setList,
        isProcessing,
        error,
        processShoppingList,
        updateShoppingList,
        clearShoppingList
      }}
    >
      {children}
    </ShoppingListContext.Provider>
  );
}

export function useShoppingList() {
  const context = useContext(ShoppingListContext);
  if (!context) {
    throw new Error('useShoppingList must be used within a ShoppingListProvider');
  }
  return context;
}