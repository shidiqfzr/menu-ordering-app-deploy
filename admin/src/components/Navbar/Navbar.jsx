import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { assets } from '../../assets/assets';
import { 
  MdLogout, 
  MdAdminPanelSettings, 
  MdEmail, 
  MdKeyboardArrowDown 
} from 'react-icons/md';
import './Navbar.css';

const Navbar = () => {
  const { adminUser, logout, isManager } = useAuth();
  const { isConnected } = useSocket();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLogout = () => {
    setShowDropdown(false);
    logout(true);
    navigate('/login');
  };

  const adminName = (adminUser?.name && adminUser.name !== 'Manager / Owner' && adminUser.name !== 'Kasir / Kitchen')
    ? adminUser.name 
    : (isManager ? 'Manager' : 'Kasir');
  const adminEmail = adminUser?.email || (isManager ? 'manager@bujangcafe.com' : 'kasir@bujangcafe.com');

  return (
    <nav className="navbar" role="navigation" aria-label="Navigasi Utama Admin">
      <Link to={isManager ? "/dashboard" : "/orders"} title="Bujang Cafe">
        <img src={assets.logo} alt="Bujang Cafe" className="logo" />
      </Link>

      <div className="navbar-right">
        <div className="profile-dropdown-container" ref={dropdownRef}>
          <div 
            className={`navbar-profile ${showDropdown ? 'dropdown-active' : ''}`} 
            onClick={() => setShowDropdown(prev => !prev)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowDropdown(prev => !prev); }}
            tabIndex={0}
            role="button"
            aria-expanded={showDropdown}
            aria-haspopup="true"
            title={isManager ? "Menu Akun Manager" : "Menu Akun Kasir"}
          >
            <img src={assets.profile_icon} alt="Profil Admin" className="profile-icon" />
            <div className="profile-details">
              <span className="profile-name">{adminName}</span>
              <span 
                className={`profile-status ${isConnected ? 'online' : 'connecting'}`}
                title={isConnected ? 'Terhubung secara real-time via WebSocket' : 'Mencoba menghubungkan kembali ke server...'}
              >
                <span className={`status-dot ${isConnected ? 'online' : 'connecting'}`}></span>
                {isConnected ? 'Online' : 'Menghubungkan...'}
              </span>
            </div>
            <MdKeyboardArrowDown className={`profile-arrow-icon ${showDropdown ? 'rotate' : ''}`} />
          </div>

          {/* Profile Dropdown Menu */}
          {showDropdown && (
            <div className="profile-dropdown-menu" role="menu">
              <div className="dropdown-user-header">
                <div className="user-avatar-badge">
                  <MdAdminPanelSettings />
                </div>
                <div className="user-text-info">
                  <p className="user-name-title">{adminName}</p>
                  <p className="user-email-text">
                    <MdEmail className="email-icon" />
                    <span>{adminEmail}</span>
                  </p>
                  <div className="dropdown-meta-tags">
                    <span className="role-tag">{isManager ? 'Manager' : 'Kasir'}</span>
                  </div>
                </div>
              </div>

              <div className="dropdown-divider"></div>

              <button 
                type="button" 
                className="dropdown-logout-btn" 
                onClick={handleLogout}
              >
                <MdLogout className="logout-icon" />
                <span>Keluar dari Akun</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
