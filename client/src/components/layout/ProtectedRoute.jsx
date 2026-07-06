import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, adminOnly = false, sellerOnly = false }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" />;
  if (sellerOnly && user.role !== 'seller' && user.role !== 'admin') return <Navigate to="/" />;
  return children;
}
