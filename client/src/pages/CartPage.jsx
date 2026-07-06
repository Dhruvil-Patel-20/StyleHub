import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, total } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (cart.length === 0) return (
    <div className="text-center py-24">
      <p className="text-5xl mb-4">🛒</p>
      <p className="text-xl text-gray-500 mb-6">Your cart is empty</p>
      <Link to="/products" className="bg-indigo-600 text-white px-6 py-2 rounded-full hover:bg-indigo-700">Shop Now</Link>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Shopping Cart</h1>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          {cart.map((item, i) => (
            <div key={i} className="flex gap-4 bg-white rounded-xl shadow p-4">
              <img src={item.images?.[0] || 'https://via.placeholder.com/100'} alt={item.name} className="w-24 h-24 object-cover rounded-lg" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{item.name}</h3>
                {item.size && <p className="text-sm text-gray-500">Size: {item.size}</p>}
                {item.color && <p className="text-sm text-gray-500">Color: {item.color}</p>}
                <p className="text-indigo-600 font-bold mt-1">${item.price?.toFixed(2)}</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center border rounded-full">
                    <button onClick={() => updateQuantity(item.id || item._id, item.size, item.color, item.quantity - 1)} className="px-3 py-0.5">-</button>
                    <span className="px-3">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id || item._id, item.size, item.color, item.quantity + 1)} className="px-3 py-0.5">+</button>
                  </div>
                  <button onClick={() => removeFromCart(item.id || item._id, item.size, item.color)} className="text-red-400 hover:text-red-600 text-sm">Remove</button>
                </div>
              </div>
              <p className="font-bold text-gray-800">${(item.price * item.quantity).toFixed(2)}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow p-6 h-fit">
          <h2 className="font-bold text-lg mb-4">Order Summary</h2>
          <div className="flex justify-between text-sm mb-2"><span>Subtotal</span><span>${total.toFixed(2)}</span></div>
          <div className="flex justify-between text-sm mb-2"><span>Shipping</span><span>{total >= 50 ? 'Free' : '$5.99'}</span></div>
          <div className="border-t pt-3 flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>${(total >= 50 ? total : total + 5.99).toFixed(2)}</span>
          </div>
          <button
            onClick={() => user ? navigate('/checkout') : navigate('/login')}
            className="w-full bg-indigo-600 text-white py-3 rounded-full mt-4 hover:bg-indigo-700 font-medium">
            {user ? 'Proceed to Checkout' : 'Login to Checkout'}
          </button>
          <Link to="/products" className="block text-center text-sm text-indigo-600 mt-3 hover:underline">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
}
