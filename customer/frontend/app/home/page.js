'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Pen } from 'lucide-react';
import useAuthStore from '@/store/auth';
import Header from '@/app/components/Header';
import QuerySection from '@/app/components/QuerySection';
import InputSection from '@/app/components/InputSection';
import styles from './page.module.css';

export default function HomePage() {
  const router = useRouter();
  const { customer, token } = useAuthStore();

  useEffect(() => {
    if (!token || !customer) {
      router.push('/login');
    }
  }, [router, token, customer]);

  if (!customer) {
    return null;
  }

  return (
    <div className={styles.container}>
      <Header />
      <main className={styles.main}>
        <QuerySection />
      </main>
      <InputSection />
      <button 
        onClick={() => router.push('/shopping-list')}
        className={styles.shoppingListButton}
        aria-label="Create shopping list"
      >
        <Pen size={24} />
      </button>
    </div>
  );
}