'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import useAuthStore from '@/store/auth';
import styles from './page.module.css';

export default function ShoppingListPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [list, setList] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push('/login');
    }
  }, [router, token]);

  const handleSave = async () => {
    if (!list.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shopping-list/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ list })
      });

      if (response.ok) {
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Error saving shopping list:', error);
    } finally {
      setIsLoading(false);
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
          placeholder="Enter your shopping list here..."
          className={styles.textarea}
        />
        <button 
          onClick={handleSave}
          disabled={isLoading || !list.trim()}
          className={styles.saveButton}
        >
          {isLoading ? 'Processing...' : 'Save List'}
        </button>
      </main>
    </div>
  );
}