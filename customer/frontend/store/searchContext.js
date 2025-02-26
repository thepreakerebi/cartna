'use client';

import { createContext, useContext, useState } from 'react';
import api from '../lib/api';
import useAuthStore from './auth';

const SearchContext = createContext();

export function SearchProvider({ children }) {
  const [searchResults, setSearchResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { token } = useAuthStore();

  const searchProducts = async (query) => {
    if (!query?.trim()) {
      setSearchResults(null);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/search/products', {
        query: query.trim()
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data) {
        const mappedProducts = response.data.data.map(product => ({
          _id: product.id,
          name: product.name,
          unitPrice: product.price,
          images: product.images,
          supermarket: product.supermarket,
          description: product.description
        }));

        setSearchResults({
          query: query.trim(),
          products: mappedProducts
        });
      }
    } catch (err) {
      setError('Failed to search products. Please try again.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const clearSearchResults = () => {
    setSearchResults(null);
    setError('');
  };

  return (
    <SearchContext.Provider
      value={{
        searchResults,
        isLoading,
        error,
        searchProducts,
        clearSearchResults
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}