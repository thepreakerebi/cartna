'use client';

import { useCart } from '@/store/cartContext';
import styles from './page.module.css';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import useAuthStore from '@/store/auth';

export default function CartPage() {
  const { cartItems, updateCartItemQuantity, updateLocalCartItemQuantity, removeFromCart, loading } = useCart();
  const router = useRouter();
  const { token } = useAuthStore();

  useEffect(() => {
    if (!token) {
      router.push('/login');
    }
  }, [token, router]);

  const calculateTotal = () => {
    if (!cartItems) return 0;
    return cartItems.reduce((total, item) => {
      const price = item.product?.price || item.product?.unitPrice || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    updateLocalCartItemQuantity(productId, newQuantity);
  };

  const handleRemoveItem = async (productId) => {
    await removeFromCart(productId);
  };

  const handleBackClick = () => {
    router.push('/home');
  };

  const handleCheckout = async () => {
    try {
      // Sync all cart items with the backend
      for (const item of cartItems) {
        await updateCartItemQuantity(item.product._id, item.quantity);
      }
      // After successful sync, you can proceed with checkout
      // For now, we'll just show an alert
      alert('Cart synchronized successfully! Checkout functionality coming soon.');
    } catch (error) {
      console.error('Error during checkout:', error);
      alert('Failed to sync cart items. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading cart...</div>
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.cartHeader}>
          <button onClick={handleBackClick} className={styles.backButton}>
            <ArrowLeft size={24} />
          </button>
          <h1 className={styles.cartHeaderText}>Your Cart</h1>
        </div>
        <div className={styles.emptyCart}>
          <h2>Your cart is empty</h2>
          <p>Add some items to your cart to see them here</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.cartHeader}>
        <button onClick={handleBackClick} className={styles.backButton}>
          <ArrowLeft size={24} />
        </button>
        <h1 className={styles.cartHeaderText}>Your Cart</h1>
      </div>
      <div className={styles.mainCartContent}>
        <p className={styles.cartCount}>{cartItems.length} items in your cart</p>
        <div className={styles.cartContent}>
            <div className={styles.cartItems}>
            {cartItems.map((item) => {
                if (!item?.product) return null;
                const price = item.product.price || item.product.unitPrice || 0;
                return (
                <div key={item.product._id} className={styles.cartItem}>
                    <div className={styles.productImage}>
                    {item.product.images && item.product.images.length > 0 && (
                        <Image
                        src={item.product.images[0]}
                        alt={`Product image of ${item.product.name}`}
                        width={80}
                        height={80}
                        style={{ objectFit: "cover" }}
                        priority={true}
                        />
                    )}
                    </div>
                    <div className={styles.productInfo}>
                    <h3>{item.product.name}</h3>
                    <p className={styles.price}>RWF {price.toLocaleString()}</p>
                    <p className={styles.supermarket}>{item.product.supermarket}</p>
                    </div>
                    <div className={styles.quantityControls}>
                    <button
                        className={styles.quantityButton}
                        onClick={() => handleQuantityChange(item.product._id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                    >
                        -
                    </button>
                    <span className={styles.quantity}>{item.quantity}</span>
                    <button
                        className={styles.quantityButton}
                        onClick={() => handleQuantityChange(item.product._id, item.quantity + 1)}
                    >
                        +
                    </button>
                    </div>
                    <div className={styles.itemTotal}>
                    RWF {(price * item.quantity).toLocaleString()}
                    </div>
                    <button
                    className={styles.removeButton}
                    onClick={() => handleRemoveItem(item.product._id)}
                    >
                    Remove
                    </button>
                </div>
                );
            })}
            </div>
            <div className={styles.cartSummary}>
            <div className={styles.totalAmount}>
                <span>Total</span>
                <span>RWF {calculateTotal().toLocaleString()}</span>
            </div>
            <button 
              className={styles.checkoutButton}
              onClick={handleCheckout}
            >
              Proceed to Checkout
            </button>
            </div>
        </div>
        </div>
      </div>
  );
}