'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, ShoppingCart } from 'lucide-react';
import useAuthStore from '@/store/auth';
import styles from './Header.module.css';

export default function Header() {
  const router = useRouter();
  const { customer, clearAuth } = useAuthStore();
  const [showPopover, setShowPopover] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);

  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        const response = await fetch('/api/cart', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        if (data.status === 'success') {
          setCartItemCount(data.data.items.length);
        }
      } catch (error) {
        console.error('Error fetching cart:', error);
      }
    };

    fetchCartItems();
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.brandContainer}>
          <h1 className={styles.brandName}>Cartna</h1>
          <button className={styles.cartButton} aria-label="Shopping cart">
            <ShoppingCart size={24} />
            {cartItemCount > 0 && (
              <span className={styles.cartBadge}>{cartItemCount}</span>
            )}
          </button>
        </div>
        <div className={styles.userContainer}>
          <span className={styles.userName}>{customer.firstName} {customer.lastName}</span>
          <div className={styles.userMenuContainer}>
            <button
              className={styles.userButton}
              onClick={() => setShowPopover(!showPopover)}
              aria-label="User menu"
            >
              <User size={24} />
            </button>
            {showPopover && (
              <div className={styles.popover}>
                <button onClick={handleLogout} className={styles.logoutButton}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}