'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import useAuthStore from '@/store/auth';
import api from '@/lib/api';

export default function CreateAccountPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
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
      const response = await api.post('/customers/create-account', formData);
      if (response.data.token && response.data.data.customer) {
        router.push('/login?message=Account created successfully! Please log in.');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'An error occurred during registration';
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
        <h1 className={styles.brandTitle}>Welcome to Cartna</h1>
        <p className={styles.brandCopy}>
          Shop smart. Just say or type your grocery list and get the best-priced items instantly.
        </p>
      </div>

      <div className={styles.formSection}>
        <div className={styles.formContainer}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="firstName" className={styles.label}>First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={styles.input}
                required
                disabled={isLoading}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="lastName" className={styles.label}>Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={styles.input}
                required
                disabled={isLoading}
              />
            </div>

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
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className={styles.signupLink}>
            Already have an account? <Link href="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}