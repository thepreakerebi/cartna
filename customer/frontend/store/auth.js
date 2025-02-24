import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      customer: null,
      setAuth: (token, customer) => set({ token, customer }),
      clearAuth: () => set({ token: null, customer: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

export default useAuthStore;