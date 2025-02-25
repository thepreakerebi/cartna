'use client';

import { CartProvider } from '@/store/cartContext';
import { SearchProvider } from '@/store/searchContext';

export function Providers({ children }) {
  return (
    <CartProvider>
      <SearchProvider>
        {children}
      </SearchProvider>
    </CartProvider>
  );
}