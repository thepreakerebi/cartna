'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import useAuthStore from '@/store/auth';
import api from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    mobileNumber: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/customers/login', formData);
      if (response.data.token && response.data.data.customer) {
        setAuth(response.data.token, response.data.data.customer);
        router.push('/home');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'An error occurred during login';
      setError(errorMessage);

      // Clear error after 5 seconds
      setTimeout(() => {
        setError('');
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.brandSection}>
        <h1 className={styles.brandTitle}>Cartna</h1>
        <p className={styles.brandCopy}>
          Shop smart. Just say or type your grocery list and get the best-priced items instantly.
        </p>
      </div>

      <div className={styles.formSection}>
        <div className={styles.formContainer}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="mobileNumber" className={styles.label}>Mobile Number (without +250)</label>
              <input
                type="tel"
                id="mobileNumber"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleChange}
                className={styles.input}
                required
                disabled={isLoading}
              />
            </div>

            <div className={styles.inputGroup}>
              <div className={styles.labelContainer}>
                <label htmlFor="password" className={styles.label}>Password</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.togglePassword}
                  disabled={isLoading}
                >
                  {showPassword ? 'hide password' : 'show password'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={styles.input}
                required
                disabled={isLoading}
              />
              {error && (
                <p style={{ 
                  marginTop: '0.5rem', 
                  color: '#dc2626', 
                  fontSize: '0.875rem'
                }}>
                  {error}
                </p>
              )}
            </div>

            <button 
              type="submit" 
              className={styles.button}
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <p className={styles.signupLink}>
            Don&apos;t have an account? <Link href="/create-account">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}