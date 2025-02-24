'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from "./page.module.css";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/login');
  }, [router]);

  return (
    <div className={styles.page}>
      Redirecting...
    </div>
  );
}
