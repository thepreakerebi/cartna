'use client';

import { CartProvider } from '@/store/cartContext';
import { SearchProvider } from '@/store/searchContext';
import { ShoppingListProvider } from '@/store/shoppingListContext';

export function Providers({ children }) {
  return (
    <CartProvider>
      <SearchProvider>
        <ShoppingListProvider>
          {children}
        </ShoppingListProvider>
      </SearchProvider>
    </CartProvider>
  );
}