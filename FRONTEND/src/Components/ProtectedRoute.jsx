import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Check if token is expired
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('token');
      localStorage.removeItem('adminData');
      return <Navigate to="/" replace />;
    }
  } catch {
    localStorage.removeItem('token');
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
