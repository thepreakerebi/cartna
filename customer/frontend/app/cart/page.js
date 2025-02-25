'use client';

import { useCart } from '@/store/cartContext';
import styles from './page.module.css';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const { cartItems, updateCartItemQuantity, removeFromCart, loading } = useCart();
  const router = useRouter();

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
  };

  const handleQuantityChange = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    await updateCartItemQuantity(productId, newQuantity);
  };

  const handleRemoveItem = async (productId) => {
    await removeFromCart(productId);
  };

  const handleBackClick = () => {
    router.push('/home');
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading cart...</div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.cartHeader}>
          <button onClick={handleBackClick} className={styles.backButton}>
            <ArrowLeft size={24} />
          </button>
          <h5>Your Cart</h5>
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
      <p className={styles.cartCount}>{cartItems.length} items in your cart</p>
      <div className={styles.cartContent}>
        <div className={styles.cartItems}>
          {cartItems.map((item) => (
            <div key={item.product._id} className={styles.cartItem}>
              <div className={styles.productImage}>
                {item.product.images && item.product.images.length > 0 && (
                  <Image
                    src={item.product.images[0]}
                    alt={item.product.name}
                    width={80}
                    height={80}
                    style={{ objectFit: "cover" }}
                    priority
                  />
                )}
              </div>
              <div className={styles.productInfo}>
                <h3>{item.product.name}</h3>
                <p className={styles.price}>RWF {item.product.price.toLocaleString()}</p>
                <p className={styles.supermarket}>{item.branch?.createdBy?.supermarketName}</p>
              </div>
              <div className={styles.quantityControls}>
                <button
                  onClick={() => handleQuantityChange(item.product._id, item.quantity - 1)}
                  className={styles.quantityButton}
                  disabled={item.quantity <= 1}
                >
                  -
                </button>
                <span className={styles.quantity}>{item.quantity}</span>
                <button
                  onClick={() => handleQuantityChange(item.product._id, item.quantity + 1)}
                  className={styles.quantityButton}
                >
                  +
                </button>
              </div>
              <div className={styles.itemTotal}>
                RWF {(item.product.price * item.quantity).toLocaleString()}
              </div>
              <button
                onClick={() => handleRemoveItem(item.product._id)}
                className={styles.removeButton}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <div className={styles.cartSummary}>
          <div className={styles.totalAmount}>
            <span>Total:</span>
            <span>RWF {calculateTotal().toLocaleString()}</span>
          </div>
          <button className={styles.checkoutButton}>Proceed to Checkout</button>
        </div>
      </div>
    </div>
  );
}