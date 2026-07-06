import { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('cart') || '[]'));

  const saveCart = (items) => {
    setCart(items);
    localStorage.setItem('cart', JSON.stringify(items));
  };

  const addToCart = (product, quantity = 1, size = '', color = '') => {
    const pid = product.id || product._id;
    const existing = cart.find(i => (i.id || i._id) === pid && i.size === size && i.color === color);
    const updated = existing
      ? cart.map(i => (i.id || i._id) === pid && i.size === size && i.color === color ? { ...i, quantity: i.quantity + quantity } : i)
      : [...cart, { ...product, id: pid, quantity, size, color }];
    saveCart(updated);
  };

  const removeFromCart = (id, size, color) => saveCart(cart.filter(i => !((i.id || i._id) === id && i.size === size && i.color === color)));

  const updateQuantity = (id, size, color, quantity) => {
    if (quantity < 1) return removeFromCart(id, size, color);
    saveCart(cart.map(i => (i.id || i._id) === id && i.size === size && i.color === color ? { ...i, quantity } : i));
  };

  const clearCart = () => saveCart([]);

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, total, itemCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
