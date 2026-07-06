import { createContext, useContext, useState } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));

  const login = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const toggleWishlist = async (productId) => {
    if (!user) return false;
    try {
      const { data } = await api.put(`/auth/wishlist/${productId}`);
      const updated = { ...user, wishlist: data };
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
      return true;
    } catch {
      return false;
    }
  };

  const isWishlisted = (productId) => user?.wishlist?.includes(productId) || false;

  return (
    <AuthContext.Provider value={{ user, login, logout, toggleWishlist, isWishlisted }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
