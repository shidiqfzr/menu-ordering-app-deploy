import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  MdOutlineMail, 
  MdLockOutline, 
  MdVisibility, 
  MdVisibilityOff, 
  MdLogin,
  MdShield,
  MdRestaurantMenu
} from 'react-icons/md';
import { assets } from '../../assets/assets';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, role } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // If already authenticated, redirect based on role or referrer
  React.useEffect(() => {
    if (isAuthenticated) {
      if (location.state?.from?.pathname) {
        navigate(location.state.from.pathname, { replace: true });
      } else if (role === 'kasir' || role === 'kitchen') {
        navigate('/orders', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, role, navigate, location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setSubmitting(true);
    const result = await login(email, password, rememberMe);
    setSubmitting(false);

    if (result.success) {
      const userRole = result.data?.user?.role;
      if (location.state?.from?.pathname) {
        navigate(location.state.from.pathname, { replace: true });
      } else if (userRole === 'kasir' || userRole === 'kitchen') {
        navigate('/orders', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  };

  return (
    <div className="admin-login-page">
      {/* Background Decorative Blobs */}
      <div className="login-bg-blob blob-1"></div>
      <div className="login-bg-blob blob-2"></div>

      <div className="login-card">
        {/* Card Header */}
        <div className="login-header">
          <div className="login-logo-wrapper">
            <img src={assets.logo} alt="Bujang Cafe Logo" className="login-logo" />
          </div>
          <div className="login-badge">
            <MdShield className="badge-shield-icon" />
            <span>Portal Administrator</span>
          </div>
          <p className="login-subtitle">
            Silakan masuk dengan akun pengelola restoran Anda
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {/* Email Field */}
          <div className="login-input-group">
            <label className="login-label">Email Administrator</label>
            <div className="input-box-wrapper">
              <MdOutlineMail className="input-leading-icon" />
              <input
                type="email"
                placeholder="Masukkan email admin..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="login-input"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="login-input-group">
            <label className="login-label">Kata Sandi</label>
            <div className="input-box-wrapper">
              <MdLockOutline className="input-leading-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan kata sandi..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="login-input"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                tabIndex={-1}
              >
                {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="login-options-row">
            <label className="remember-me-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="remember-checkbox"
              />
              <span>Ingat sesi saya</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="login-submit-btn"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="login-btn-spinner"></span>
                <span>Memverifikasi...</span>
              </>
            ) : (
              <>
                <MdLogin className="btn-icon" />
                <span>Masuk ke Panel Admin</span>
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="login-footer-info">
          <p>© {new Date().getFullYear()} Bujang Cafe & Resto. Sistem Manajemen Pesanan Digital.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
