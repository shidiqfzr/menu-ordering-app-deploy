import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../../services/api';
import './Sidebar.css';
import { 
  MdOutlineDashboard, 
  MdOutlineFastfood, 
  MdOutlineReceiptLong,
  MdQrCode2
} from 'react-icons/md';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const [activeOrderCount, setActiveOrderCount] = useState(0);
  const { socket } = useSocket();
  const { isManager } = useAuth();

  const fetchOrderBadge = async () => {
    try {
      const response = await api.get('/api/order/active-count');
      if (response.data.success) {
        setActiveOrderCount(response.data.count || 0);
      }
    } catch {
      // Quiet fail in sidebar to avoid disrupting navigation
    }
  };

  useEffect(() => {
    fetchOrderBadge();

    // Real-time Socket.IO badge sync
    if (socket) {
      const handleBadgeUpdate = () => {
        fetchOrderBadge();
      };

      socket.on('order:created', handleBadgeUpdate);
      socket.on('order:status_updated', handleBadgeUpdate);
      socket.on('order:deleted', handleBadgeUpdate);

      return () => {
        socket.off('order:created', handleBadgeUpdate);
        socket.off('order:status_updated', handleBadgeUpdate);
        socket.off('order:deleted', handleBadgeUpdate);
      };
    }
  }, [socket]);

  useEffect(() => {
    const interval = setInterval(fetchOrderBadge, 60000); // 60s fallback

    const handleOrdersUpdated = () => {
      fetchOrderBadge();
    };
    window.addEventListener('orders-changed', handleOrdersUpdated);

    const handleStorageChange = (e) => {
      if (e.key === 'bujang_orders_sync') {
        fetchOrderBadge();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('orders-changed', handleOrdersUpdated);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <aside className="sidebar" aria-label="Menu Samping Navigasi">
      <div className="sidebar-menu-group">
        <p className="sidebar-group-title">Menu Utama</p>
        
        {isManager && (
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => `sidebar-option ${isActive ? 'active' : ''}`}
          >
            <span className="sidebar-icon"><MdOutlineDashboard /></span>
            <span className="sidebar-text">Dashboard</span>
          </NavLink>
        )}

        <NavLink 
          to="/list" 
          className={({ isActive }) => `sidebar-option ${isActive ? 'active' : ''}`}
        >
          <span className="sidebar-icon"><MdOutlineFastfood /></span>
          <span className="sidebar-text">Daftar Menu</span>
        </NavLink>
        
        <NavLink 
          to="/orders" 
          className={({ isActive }) => `sidebar-option ${isActive ? 'active' : ''}`}
        >
          <span className="sidebar-icon"><MdOutlineReceiptLong /></span>
          <span className="sidebar-text">Semua Pesanan</span>
          {activeOrderCount > 0 && (
            <span className="sidebar-badge" title={`${activeOrderCount} pesanan aktif diproses`}>
              {activeOrderCount > 99 ? '99+' : activeOrderCount}
            </span>
          )}
        </NavLink>

        <NavLink 
          to="/tables" 
          className={({ isActive }) => `sidebar-option ${isActive ? 'active' : ''}`}
        >
          <span className="sidebar-icon"><MdQrCode2 /></span>
          <span className="sidebar-text">Meja & QR Code</span>
        </NavLink>
      </div>

      {/* Operational Cafe Status at Bottom */}
      <div className="sidebar-status-card">
        <div className="status-header">
          <span className="status-dot online"></span>
          <span className="status-title">Status Kafe: Buka</span>
        </div>
        <p className="status-desc">
          {isManager ? 'Akses: Manager' : 'Akses: Kasir'}
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
