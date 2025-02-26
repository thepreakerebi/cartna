'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { useCart } from '@/store/cartContext';
import useAuthStore from '@/store/auth';
import api from '@/lib/api';
import styles from './page.module.css';

export default function ProductPage({ params }) {
  const router = useRouter();
  const { token } = useAuthStore();
  const { addToCart, loading: cartLoading, cartItems } = useCart();
  const [product, setProduct] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);
  const [toast, setToast] = useState({ message: '', visible: false });
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchProduct = async () => {
      try {
        const response = await api.get(`/search/products/${params.id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        console.log('Product data:', response.data.data);
        setProduct(response.data.data);
      } catch (err) {
        setError('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params.id, token, router]);

  const handleBackClick = () => {
    router.back();
  };

  const handleImageNavigation = (direction) => {
    if (!product?.images?.length) return;
    
    if (direction === 'next') {
      setCurrentImageIndex((prev) => 
        prev === product.images.length - 1 ? 0 : prev + 1
      );
    } else {
      setCurrentImageIndex((prev) => 
        prev === 0 ? product.images.length - 1 : prev - 1
      );
    }
  };

  const handleAddToCart = async () => {
    const existingItem = cartItems.find(item => item.product._id === product._id);
    if (existingItem) {
      setToast({ message: 'This product is already in your cart', visible: true });
      setTimeout(() => setToast({ message: '', visible: false }), 5000);
      return;
    }

    try {
      setAddingToCart(true);
      await addToCart(product._id, 1);
      setToast({ message: 'Product added to cart successfully', visible: true });
      setTimeout(() => setToast({ message: '', visible: false }), 5000);
      setAddedToCart(true);
    } catch (err) {
      setError('Failed to add item to cart');
      setTimeout(() => setError(''), 3000);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleSeeCart = () => {
    router.push('/cart');
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading product details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Product not found</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={handleBackClick} className={styles.backButton}>
          <ArrowLeft size={24} />
        </button>
        <h1 className={styles.headerText}>Product Details</h1>
      </header>

      <main className={styles.main}>
        <div className={styles.productContainer}>
          <div className={styles.imageContainer}>
            {product.images && product.images.length > 0 && (
              <>
                <Image
                  src={product.images[currentImageIndex]}
                  alt={`${product.name} - Image ${currentImageIndex + 1}`}
                  width={400}
                  height={400}
                  style={{ objectFit: "cover" }}
                  priority
                />
                {product.images.length > 1 && (
                  <div className={styles.imageNavigation}>
                    <button
                      onClick={() => handleImageNavigation('prev')}
                      className={styles.navButton}
                    >
                      ←
                    </button>
                    <span className={styles.imageCounter}>
                      {currentImageIndex + 1} / {product.images.length}
                    </span>
                    <button
                      onClick={() => handleImageNavigation('next')}
                      className={styles.navButton}
                    >
                      →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className={styles.productInfo}>
            <div className={styles.productHeader}>
              <div className={styles.namePrice}>
                <h2 className={styles.productName}>{product.name}</h2>
                <p className={styles.price}>RWF {product.unitPrice.toLocaleString()}</p>
              </div>
              <button
                onClick={addedToCart ? handleSeeCart : handleAddToCart}
                className={`${styles.addToCartButton} ${addedToCart ? styles.seeCartButton : ''}`}
                disabled={addingToCart || cartLoading}
              >
                {addingToCart ? 'Adding...' : addedToCart ? 'See Cart' : 'Add to Cart'}
              </button>
            </div>

            <div className={styles.supermarket}>
              <h3>Sold by</h3>
              <p>{product.supermarket}</p>
            </div>

            <div className={styles.description}>
              <h3>Description</h3>
              <p>{product.description || 'No description available'}</p>
            </div>
          </div>
        </div>
      </main>

      {toast.visible && (
        <div className={styles.toast}>
          {toast.message}
        </div>
      )}
    </div>
  );
}