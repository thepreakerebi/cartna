'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/auth';
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
      <header className={styles.header}>
        <h1>Welcome, {customer.firstName}!</h1>
      </header>
      
      <main className={styles.main}>
        <section className={styles.profileSection}>
          <h2>Your Profile</h2>
          <div className={styles.profileInfo}>
            <p><strong>Name:</strong> {customer.firstName} {customer.lastName}</p>
            <p><strong>Mobile:</strong> {customer.mobileNumber}</p>
          </div>
        </section>
      </main>
    </div>
  );
}