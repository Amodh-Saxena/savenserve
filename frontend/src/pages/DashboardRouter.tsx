import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DonorDashboard from './DonorDashboard';
import NgoDashboard from './NgoDashboard';
import AdminDashboard from './AdminDashboard';

export default function DashboardRouter() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/auth" />;

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          user.role === 'donor' ? <DonorDashboard /> :
          user.role === 'ngo' ? <NgoDashboard /> :
          <AdminDashboard />
        } 
      />
    </Routes>
  );
}
