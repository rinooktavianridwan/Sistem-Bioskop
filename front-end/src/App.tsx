import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/auth.provider';
import { useAuth } from './contexts/useAuth.hook';
import Layout from './components/layout.component';
import Login from './pages/auth/login.page';
import Register from './pages/auth/register.page';
import Home from './pages/home.page';
import Movies from './pages/movie/movie.page';
import MovieDetail from './pages/movie/movie.detail.page';
import Schedules from './pages/schedule/schedule.page';
import ScheduleDetail from './pages/schedule/schedule.detail.page';
import OrderNewPage from './pages/orders/order.page';
import Profile from './pages/user/profile.page';
import OrderCheckoutPage from './pages/orders/order.checkout.page';
import MyOrdersPage from './pages/orders/myorder.page';
import MyOrderDetailPage from './pages/orders/myorder.detail.page';
import AdminLayout from './pages/admin/admin.layout.page';
import FacilitiesPage from './pages/admin/master/facilities.page';
import GenresPage from './pages/admin/master/genres.page';
import MoviesAdminPage from './pages/admin/movies.page';
import PromosAdminPage from './pages/admin/promos.page';
import SchedulesAdminPage from './pages/admin/schedules.page';

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
        <Route path="movies/:id" element={<MovieDetail />} />
        <Route path="schedules" element={<Schedules />} />
        <Route path="schedule/detail" element={<ScheduleDetail />} />

        <Route path="orders/new" element={<OrderNewPage />} />
        <Route path="orders/checkout" element={<OrderCheckoutPage />} />
        <Route path="orders" element={<MyOrdersPage />} />
        <Route path="orders/:id" element={<MyOrderDetailPage />} />


        <Route path="profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />

        <Route path="admin" element={
        <ProtectedRoute adminOnly>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<FacilitiesPage />} />
        <Route path="master">
          <Route path="facilities" element={<FacilitiesPage />} />
          <Route path="genres" element={<GenresPage />} />
        </Route>
        <Route path="movies" element={<MoviesAdminPage />} />
        <Route path="promos" element={<PromosAdminPage />} />
        <Route path="schedules" element={<SchedulesAdminPage />} />
      </Route>
        
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