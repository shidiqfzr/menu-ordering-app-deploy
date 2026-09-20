import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import Navbar from './components/Navbar/Navbar';
import Sidebar from './components/Sidebar/Sidebar';
import './App.css';

// ── Route-based Code Splitting (Dynamic Lazy Imports) ──
const Login = lazy(() => import('./pages/Login/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
const Orders = lazy(() => import('./pages/Orders/Orders'));
const List = lazy(() => import('./pages/List/List'));
const Tables = lazy(() => import('./pages/Tables/Tables'));

// ── Reusable Route Fallback Spinner ──
const RouteFallback = ({ message = 'Memuat modul...' }) => (
  <div className="route-loading-container" role="status" aria-live="polite">
    <div className="route-loading-spinner" />
    <span className="route-loading-text">{message}</span>
  </div>
);

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('UI Runtime Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', background: '#fff', borderRadius: '16px', margin: '20px', border: '1px solid #fee2e2' }}>
          <h2 style={{ color: '#dc2626', marginBottom: '8px' }}>⚠️ Terjadi Kesalahan Tampilan</h2>
          <p style={{ color: '#4b5563', marginBottom: '16px', fontSize: '14px' }}>
            {this.state.error?.message || 'Gagal memuat halaman secara normal.'}
          </p>
          <button 
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            style={{ padding: '10px 20px', background: 'tomato', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
          >
            Muat Ulang Halaman
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const AdminLayout = () => {
  return (
    <div className="app">
      <Navbar />
      <div className="app-content">
        <Sidebar />
        <main className="page-content">
          <ErrorBoundary>
            <Suspense fallback={<RouteFallback message="Memuat halaman..." />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

// ── Smart Root Redirect based on Role ──
const RootRedirect = () => {
  const { isKasir } = useAuth();
  return <Navigate to={isKasir ? "/orders" : "/dashboard"} replace />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Login Route */}
          <Route 
            path="/login" 
            element={
              <Suspense fallback={<RouteFallback message="Memuat login..." />}>
                <Login />
              </Suspense>
            } 
          />

          {/* Protected Admin Area */}
          <Route
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<RootRedirect />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['manager', 'admin']}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="/add" element={<Navigate to="/list?action=add" replace />} />
            <Route path="/list" element={<List />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/tables" element={<Tables />} />
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          theme="light"
        />
      </AuthProvider>
    </Router>
  );
}

export default App;
