'use client';

import { CartProvider } from '@/store/cartContext';

export function Providers({ children }) {
  return (
    <CartProvider>
      {children}
    </CartProvider>
  );
}