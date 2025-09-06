import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Movies from './pages/Movies';
import Schedules from './pages/Schedules';
import Profile from './pages/Profile';
import Orders from './pages/Orders';

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ 
  children, 
  adminOnly = false 
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
      
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="movies" element={<Movies />} />
        <Route path="schedules" element={<Schedules />} />
        
        <Route path="profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        
        <Route path="orders" element={
          <ProtectedRoute>
            <Orders />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;