'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, ShoppingCart } from 'lucide-react';
import useAuthStore from '@/store/auth';
import { useCart } from '@/store/cartContext';
import styles from './Header.module.css';

export default function Header() {
  const router = useRouter();
  const { customer, clearAuth } = useAuthStore();
  const { cartItems } = useCart();
  const [showPopover, setShowPopover] = useState(false);

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
            {cartItems.length > 0 && (
              <span className={styles.cartBadge}>{cartItems.length}</span>
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