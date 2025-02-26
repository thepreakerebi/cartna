'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import useAuthStore from '@/store/auth';
import { useShoppingList } from '@/store/shoppingListContext';
import { useCart } from '@/store/cartContext';
import styles from './page.module.css';

export default function ShoppingListPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const { list, setList, isProcessing, processShoppingList } = useShoppingList();
  const { fetchCart } = useCart();
  const [isSaved, setIsSaved] = useState(false);
  const [toast, setToast] = useState({ message: '', visible: false });

  useEffect(() => {
    if (!token) {
      router.push('/login');
    }
  }, [router, token]);

  const handleSave = async () => {
    if (!list.trim()) return;

    try {
      await processShoppingList(list);
      await fetchCart(); // Fetch updated cart data
      setIsSaved(true);
      setToast({ message: 'Products successfully added to cart', visible: true });
      setTimeout(() => setToast({ message: '', visible: false }), 3000);
    } catch (error) {
      console.error('Error saving shopping list:', error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isProcessing && list.trim()) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button 
            onClick={() => router.back()} 
            className={styles.backButton}
            aria-label="Go back"
          >
            <ArrowLeft size={24} />
          </button>
          <h1>Shopping List</h1>
        </div>
        {isSaved && (
          <button 
            onClick={() => router.push('/cart')} 
            className={styles.cartButton}
          >
            <ShoppingCart size={24} />
            See cart
          </button>
        )}
      </header>
      <main className={styles.main}>
        <textarea
          value={list}
          onChange={(e) => setList(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter your shopping list here..."
          className={styles.textarea}
        />
        <button 
          onClick={handleSave}
          disabled={isProcessing || !list.trim()}
          className={styles.saveButton}
        >
          {isProcessing ? 'Processing...' : 'Save List'}
        </button>
      </main>
      {toast.visible && (
        <div className={styles.toast}>
          {toast.message}
        </div>
      )}
    </div>
  );
}