import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Users from './components/Users';
import AuditLogs from './components/AuditLogs';
import ProductsList from './components/pages/Products/ProductsList';
import ProductForm from './components/pages/Products/ProductForm';
import ProductDetail from './components/pages/Products/ProductDetail';
import CategoriesList from './components/Categories/CategoriesList';
import CategoryForm from './components/Categories/CategoryForm';
import CategoryDetail from './components/Categories/CategoryDetail';
import PrivateRoute from './components/PrivateRoute';

// Customer Management Components
import CustomersList from './components/page';
import CustomerEdit from './components/pages/Customers/CustomerEdit';
import CustomerDetail from './components/pages/Customers/CustomerDetail';

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
          
          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          
          {/* User Management */}
          <Route
            path="/users"
            element={
              <PrivateRoute roles={['super-admin', 'admin', 'manager']}>
                <Users />
              </PrivateRoute>
            }
          />
          
          {/* Customer Management */}
          <Route
            path="/customers"
            element={
              <PrivateRoute roles={['super-admin', 'admin', 'manager']}>
                <CustomersList />
              </PrivateRoute>
            }
          />
          <Route
            path="/customers/:id"
            element={
              <PrivateRoute roles={['super-admin', 'admin', 'manager']}>
                <CustomerDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/customers/edit/:id"
            element={
              <PrivateRoute roles={['super-admin', 'admin', 'manager']}>
                <CustomerEdit />
              </PrivateRoute>
            }
          />
          
          {/* Audit Logs */}
          <Route
            path="/audit-logs"
            element={
              <PrivateRoute roles={['super-admin', 'admin']}>
                <AuditLogs />
              </PrivateRoute>
            }
          />
          
          {/* Product Management */}
          <Route
            path="/products"
            element={
              <PrivateRoute roles={['super-admin', 'admin', 'manager']}>
                <ProductsList />
              </PrivateRoute>
            }
          />
          <Route
            path="/products/create"
            element={
              <PrivateRoute roles={['super-admin', 'admin', 'manager']}>
                <ProductForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/products/:id"
            element={
              <PrivateRoute roles={['super-admin', 'admin', 'manager']}>
                <ProductDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/products/edit/:id"
            element={
              <PrivateRoute roles={['super-admin', 'admin', 'manager']}>
                <ProductForm />
              </PrivateRoute>
            }
          />
          
          {/* Category Management */}
          <Route
            path="/categories"
            element={
              <PrivateRoute roles={['super-admin', 'admin', 'manager']}>
                <CategoriesList />
              </PrivateRoute>
            }
          />
          <Route
            path="/categories/create"
            element={
              <PrivateRoute roles={['super-admin', 'admin', 'manager']}>
                <CategoryForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/categories/:id"
            element={
              <PrivateRoute roles={['super-admin', 'admin', 'manager']}>
                <CategoryDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/categories/edit/:id"
            element={
              <PrivateRoute roles={['super-admin', 'admin', 'manager']}>
                <CategoryForm />
              </PrivateRoute>
            }
          />
          
          {/* Analytics & Settings */}
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
  );1
}

export default App;