import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Users from './components/Users';
import AuditLogs from './components/AuditLogs';
import PrivateRoute from './components/PrivateRoute';

// Placeholder components
const Analytics = () => <div className="card">Analytics Page</div>;
const Settings = () => <div className="card">Settings Page</div>;
const Profile = () => <div className="card">Profile Page</div>;

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/users"
            element={
              <PrivateRoute roles={['super-admin', 'admin', 'manager']}>
                <Users />
              </PrivateRoute>
            }
          />
          <Route
            path="/audit-logs"
            element={
              <PrivateRoute roles={['super-admin', 'admin']}>
                <AuditLogs />
              </PrivateRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <PrivateRoute roles={['super-admin', 'admin']}>
                <Analytics />
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute roles={['super-admin', 'admin']}>
                <Settings />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;