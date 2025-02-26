'use client';

import Image from 'next/image';
import styles from './QuerySection.module.css';
import { useSearch } from '@/store/searchContext';
import { useCart } from '@/store/cartContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function QuerySection() {
  const router = useRouter();
  const { searchResults, error: searchError, setError } = useSearch();
  const { addToCart, loading: cartLoading, cartItems } = useCart();
  const [queryHistory, setQueryHistory] = useState([]);
  const [addingToCart, setAddingToCart] = useState(null);
  const [toast, setToast] = useState({ message: '', visible: false });

  // Clear query history when component mounts
  useEffect(() => {
    setQueryHistory([]);
  }, []);

  useEffect(() => {
    if (searchResults) {
      setQueryHistory(prev => [...prev, searchResults]);
      // Scroll to the bottom when new results are added
      setTimeout(() => {
        const resultsContainer = document.querySelector(`.${styles.queryHistory}`);
        if (resultsContainer) {
          resultsContainer.scrollTop = resultsContainer.scrollHeight;
        }
      }, 100);
    }
  }, [searchResults]);

  const handleAddToCart = async (productId) => {
    // Check if product is already in cart
    const existingItem = cartItems.find(item => item.product._id === productId);
    if (existingItem) {
      setToast({ message: 'This product is already in your cart', visible: true });
      setTimeout(() => setToast({ message: '', visible: false }), 5000);
      return;
    }

    try {
      setAddingToCart(productId);
      await addToCart(productId, 1);
    } catch (err) {
      setError('Failed to add item to cart');
      setTimeout(() => setError(''), 3000);
    } finally {
      setAddingToCart(null);
    }
  };

  return (
    <section className={styles.querySection}>
      {queryHistory.length === 0 ? (
        <>
          <div className={styles.queryPrompt}>
            <h2>What do you want to buy today?</h2>
          </div>
          <div className={styles.exampleQueries}>
            <h3>Try these examples:</h3>
            <ul>
              <li>{"I need rice, cooking oil, and sugar"}</li>
              <li>{"Looking for fresh vegetables for soup"}</li>
              <li>{"Baby food and diapers"}</li>
              <li>{"Breakfast cereals and milk"}</li>
              <li>{"Snacks and soft drinks for a party"}</li>
            </ul>
          </div>
        </>
      ) : (
        <div className={styles.queryHistory}>
          {queryHistory.map((result, index) => (
            <div key={index} className={styles.resultsContainer}>
              <div className={styles.userQuery}>
                {result.query}
              </div>
              <div className={styles.productResults}>
                {result.products.length > 0 ? (
                  result.products.map((product) => (
                    <div key={product._id} className={styles.productCard}>
                      <div className={styles.productImage}>
                        {product.images && product.images.length > 0 && (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            width={200}
                            height={200}
                            style={{ objectFit: "cover" }}
                            priority
                          />
                        )}
                      </div>
                      <div className={styles.productDetailsContainer}>
                        <div className={styles.productInfo}>
                          <h3 
                            onClick={() => {
                              router.push(`/product/${product._id}`);
                            }} 
                            style={{ 
                              cursor: 'pointer', 
                              textDecoration: 'none', 
                              transition: 'text-decoration 0.2s' 
                            }} 
                            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'} 
                            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                          >
                            {product.name}
                          </h3>
                          <p className={styles.price}>RWF {product.unitPrice.toLocaleString()}</p>
                          <p className={styles.supermarket}>
                            {product.supermarket}
                          </p>
                        </div>
                        <div className={styles.productAction}>
                          <button
                            onClick={() => handleAddToCart(product._id)}
                            className={styles.addToCartButton}
                            disabled={addingToCart === product._id || cartLoading}
                          >
                            {addingToCart === product._id ? 'Adding...' : 'Add to Cart'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.noResults}>
                    This product is not available
                  </div>
                )}
              </div>
              {searchError && <div className={styles.error}>{searchError}</div>}
            </div>
          ))}
        </div>
      )}
      {toast.visible && (
        <div className={styles.toast}>
          {toast.message}
        </div>
      )}
    </section>
  );
}