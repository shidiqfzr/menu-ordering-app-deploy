import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { 
  MdQrCode2, 
  MdTableRestaurant, 
  MdCheckCircleOutline, 
  MdPerson, 
  MdAdd,
  MdRemove,
  MdReceiptLong,
  MdCleaningServices,
  MdDinnerDining,
  MdSoupKitchen,
  MdPendingActions,
  MdSearch,
  MdClose
} from 'react-icons/md';
import TableQRModal from '../../components/TableQRModal/TableQRModal';
import { useSocket } from '../../context/SocketContext';
import './Tables.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173';

// Helper to format dining elapsed duration
const formatDiningTime = (minutes) => {
  if (minutes < 1) return 'Baru saja';
  if (minutes < 60) return `${minutes} mnt lalu`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours} jam ${mins > 0 ? `${mins} mnt ` : ''}lalu`;
};

const Tables = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalTables, setTotalTables] = useState(() => {
    const saved = localStorage.getItem('bujang_total_tables');
    return saved ? Math.max(1, Number(saved)) : 20;
  });
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'available', 'cooking', 'dining'
  const [searchTable, setSearchTable] = useState('');
  const [selectedTableForQR, setSelectedTableForQR] = useState(null);

  // Track timestamps when staff manually clicked "Kosongkan Meja" { [tableNumber]: timestampMs }
  const [clearedTables, setClearedTables] = useState(() => {
    try {
      const saved = localStorage.getItem('bujang_cleared_tables');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Clock state: updates every 30s to keep dining duration counters live
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const clockTimer = setInterval(() => setCurrentTime(Date.now()), 30000);
    return () => clearInterval(clockTimer);
  }, []);

  // Fetch orders from backend
  const fetchOrders = useCallback(async (isSilent = false) => {
    if (!isSilent && orders.length === 0) {
      setLoading(true);
    }
    try {
      // High-performance table-specific endpoint
      const res = await api.get('/api/order/tables').catch(() => {
        return api.get('/api/order/list');
      });
      if (res.data.success) {
        setOrders(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching tables data:', err);
      if (!isSilent) toast.error('Gagal memuat status meja');
    } finally {
      setLoading(false);
    }
  }, [orders.length]);

  useEffect(() => {
    fetchOrders();

    // Real-time Socket.IO listeners for instant floor map updates
    if (socket) {
      const handleRealtimeUpdate = () => {
        console.log('[Tables] Real-time table status update received');
        fetchOrders(true);
      };

      socket.on('order:created', handleRealtimeUpdate);
      socket.on('order:status_updated', handleRealtimeUpdate);
      socket.on('order:payment_updated', handleRealtimeUpdate);
      socket.on('order:deleted', handleRealtimeUpdate);
      socket.on('tables:updated', handleRealtimeUpdate);

      return () => {
        socket.off('order:created', handleRealtimeUpdate);
        socket.off('order:status_updated', handleRealtimeUpdate);
        socket.off('order:payment_updated', handleRealtimeUpdate);
        socket.off('order:deleted', handleRealtimeUpdate);
        socket.off('tables:updated', handleRealtimeUpdate);
      };
    }
  }, [socket, fetchOrders]);

  useEffect(() => {
    // Gentle 60s background safety fallback + cross-tab sync
    const interval = setInterval(() => fetchOrders(true), 60000);

    const handleOrdersUpdated = () => fetchOrders(true);
    window.addEventListener('orders-changed', handleOrdersUpdated);

    // Instant cross-tab sync
    const handleStorageChange = (e) => {
      if (e.key === 'bujang_orders_sync') {
        fetchOrders(true);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('orders-changed', handleOrdersUpdated);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchOrders]);

  // Adjust table capacity (+ / -)
  const handleAdjustTables = (delta) => {
    const next = Math.max(1, Math.min(100, totalTables + delta));
    setTotalTables(next);
    localStorage.setItem('bujang_total_tables', next);
    toast.success(`Kapasitas restoran disesuaikan ke ${next} meja`);
  };

  // Undo manual clear table
  const handleUndoClear = async (tableNumber, orderId) => {
    setClearedTables((prev) => {
      const next = { ...prev };
      delete next[tableNumber];
      localStorage.setItem('bujang_cleared_tables', JSON.stringify(next));
      return next;
    });

    if (orderId) {
      try {
        await axios.post(`${BACKEND_URL}/api/order/status`, {
          orderId,
          status: 'Disajikan'
        });
        localStorage.setItem('bujang_orders_sync', Date.now().toString());
        window.dispatchEvent(new CustomEvent('orders-changed'));
        fetchOrders(true);
      } catch (err) {
        console.error(err);
      }
    }

    toast.dismiss(`clear-table-${tableNumber}`);
    toast.info(`Status Meja ${tableNumber} dikembalikan ↩️`);
  };

  // 1-Click "Kosongkan Meja" with Backend Order Completion & Instant Sync
  const handleClearTable = async (tableNumber, orderId) => {
    try {
      if (orderId) {
        // Complete the order in backend database
        await axios.post(`${BACKEND_URL}/api/order/status`, {
          orderId,
          status: 'Selesai'
        });
      }

      const updated = {
        ...clearedTables,
        [tableNumber]: Date.now()
      };
      setClearedTables(updated);
      localStorage.setItem('bujang_cleared_tables', JSON.stringify(updated));

      try {
        localStorage.setItem('bujang_orders_sync', Date.now().toString());
      } catch {
        // ignore storage error
      }
      window.dispatchEvent(new CustomEvent('orders-changed'));

      toast(
        ({ closeToast }) => (
          <div className="toast-undo-wrapper">
            <span>Meja {tableNumber} dikosongkan & status selesai 🧹</span>
            <button
              type="button"
              className="toast-undo-btn"
              onClick={() => {
                handleUndoClear(tableNumber, orderId);
                closeToast();
              }}
            >
              Urungkan
            </button>
          </div>
        ),
        {
          toastId: `clear-table-${tableNumber}`,
          autoClose: 5000,
          type: 'success'
        }
      );

      fetchOrders(true);
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengosongkan meja');
    }
  };

  // Quick Action: Update order status directly from table card (e.g. Sajikan)
  const handleUpdateOrderStatus = async (orderId, newStatus, tableNumber) => {
    try {
      const response = await api.post('/api/order/status', {
        orderId,
        status: newStatus
      });
      if (response.data.success) {
        toast.success(`Meja ${tableNumber}: Status diubah ke "${newStatus}"`);
        try {
          localStorage.setItem('bujang_orders_sync', Date.now().toString());
        } catch {
          // ignore
        }
        window.dispatchEvent(new CustomEvent('orders-changed'));
        fetchOrders(true);
      } else {
        toast.error(response.data.message || 'Gagal mengubah status');
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengubah status pesanan');
    }
  };

  // ── CORE LOGIC: Compute unified status for all tables (Single Source of Truth) ──
  const allTables = useMemo(() => {
    const list = [];
    const now = currentTime;

    for (let i = 1; i <= totalTables; i++) {
      // 1. Get all orders belonging to table i
      const tableOrders = orders.filter(o => Number(o.tableNumber) === i);

      // 2. Sort newest first safely
      tableOrders.sort((a, b) => {
        const timeA = new Date(a.date || a.createdAt || 0).getTime();
        const timeB = new Date(b.date || b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      // 3. Separate by lifecycle stages
      const activePendingOrders = tableOrders.filter(
        o => o.status === 'Pending' || o.status === 'Menunggu'
      );
      const activeCookingOrders = tableOrders.filter(
        o => o.status === 'Diproses' || o.status === 'Food Processing'
      );
      const activeDiningOrders = tableOrders.filter(
        o => o.status === 'Disajikan'
      );

      // Filter out dining orders that were cleared before a newer order arrived
      const clearTimestamp = clearedTables[i] || 0;
      const unexpiredDiningOrders = activeDiningOrders.filter(o => {
        const orderTime = new Date(o.date || o.createdAt || 0).getTime();
        return orderTime > clearTimestamp;
      });

      let status = 'available'; // 'available' | 'pending' | 'cooking' | 'dining'
      let activeOrder = null;
      let elapsedDiningMinutes = 0;

      if (activePendingOrders.length > 0) {
        // Priority 1: New order awaiting confirmation
        status = 'pending';
        activeOrder = activePendingOrders[0];
        const orderTime = new Date(activeOrder.date || activeOrder.createdAt || 0).getTime();
        elapsedDiningMinutes = Math.max(0, Math.round((now - orderTime) / (1000 * 60)));
      } else if (activeCookingOrders.length > 0) {
        // Priority 2: Order being prepared in kitchen
        status = 'cooking';
        activeOrder = activeCookingOrders[0];
        const orderTime = new Date(activeOrder.date || activeOrder.createdAt || 0).getTime();
        elapsedDiningMinutes = Math.max(0, Math.round((now - orderTime) / (1000 * 60)));
      } else if (unexpiredDiningOrders.length > 0) {
        // Priority 3: Food served to table, guests dining
        status = 'dining';
        activeOrder = unexpiredDiningOrders[0];
        const orderTime = new Date(activeOrder.date || activeOrder.createdAt || 0).getTime();
        elapsedDiningMinutes = Math.max(0, Math.round((now - orderTime) / (1000 * 60)));
      } else {
        status = 'available';
      }

      list.push({
        tableNumber: i,
        status,
        activeOrder,
        activeOrdersCount: activePendingOrders.length + activeCookingOrders.length,
        elapsedDiningMinutes
      });
    }

    return list;
  }, [totalTables, orders, currentTime, clearedTables]);

  // ── Unified Metrics derived directly from allTables (100% Guaranteed Consistency) ──
  const { availableCount, pendingCount, cookingCount, diningCount, totalOccupied, occupancyRate } = useMemo(() => {
    let available = 0;
    let pending = 0;
    let cooking = 0;
    let dining = 0;

    allTables.forEach(t => {
      if (t.status === 'pending') pending += 1;
      else if (t.status === 'cooking') cooking += 1;
      else if (t.status === 'dining') dining += 1;
      else available += 1;
    });

    const occupied = pending + cooking + dining;
    const rate = totalTables > 0 ? Math.round((occupied / totalTables) * 100) : 0;

    return {
      availableCount: available,
      pendingCount: pending,
      cookingCount: cooking,
      diningCount: dining,
      totalOccupied: occupied,
      occupancyRate: rate
    };
  }, [allTables, totalTables]);

  // ── Filtered Tables based on selected Tab and Quick Search ──
  const displayedTables = useMemo(() => {
    let list = allTables;
    if (activeTab === 'available') list = list.filter(t => t.status === 'available');
    else if (activeTab === 'pending') list = list.filter(t => t.status === 'pending');
    else if (activeTab === 'cooking') list = list.filter(t => t.status === 'cooking');
    else if (activeTab === 'dining') list = list.filter(t => t.status === 'dining');

    if (searchTable.trim()) {
      const q = searchTable.trim().toLowerCase().replace(/^meja\s*/i, '');
      list = list.filter(t => String(t.tableNumber).includes(q));
    }
    return list;
  }, [allTables, activeTab, searchTable]);

  return (
    <div className="tables-page">
      {/* ── Page Header ── */}
      {/* ── Page Header ── */}
      <div className="tables-header">
        <div>
          <h2 className="tables-title">Manajemen Meja & QR Code</h2>
          <p className="tables-subtitle">
            Pantau okupansi meja secara real-time & cetak QR Code meja
            <span className="occupancy-inline-stat">• <b>{occupancyRate}% Okupansi</b> ({totalOccupied} Terisi, {availableCount} Kosong)</span>
          </p>
        </div>

        <div className="tables-header-actions">
          {/* Table Capacity Controls */}
          <div className="table-stepper">
            <span className="stepper-label">Kapasitas:</span>
            <button 
              type="button" 
              className="stepper-btn"
              onClick={() => handleAdjustTables(-1)}
              title="Kurangi 1 Meja"
              disabled={totalTables <= 1}
            >
              <MdRemove />
            </button>
            <span className="stepper-val">{totalTables} Meja</span>
            <button 
              type="button" 
              className="stepper-btn"
              onClick={() => handleAdjustTables(1)}
              title="Tambah 1 Meja"
              disabled={totalTables >= 100}
            >
              <MdAdd />
            </button>
          </div>
        </div>
      </div>

      {/* ── Integrated Control Toolbar (Consistent with Semua Pesanan) ── */}
      <div className="tables-toolbar-bar">
        <div className="tables-toolbar-filters">
          <button
            type="button"
            className={`sub-filter-pill ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Semua ({totalTables})
          </button>
          <button
            type="button"
            className={`sub-filter-pill available ${activeTab === 'available' ? 'active' : ''}`}
            onClick={() => setActiveTab('available')}
          >
            <span className="pill-dot available"></span>
            <span>Kosong ({availableCount})</span>
          </button>
          <button
            type="button"
            className={`sub-filter-pill pending ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            <span className="pill-dot pending"></span>
            <span>Menunggu ({pendingCount})</span>
          </button>
          <button
            type="button"
            className={`sub-filter-pill cooking ${activeTab === 'cooking' ? 'active' : ''}`}
            onClick={() => setActiveTab('cooking')}
          >
            <span className="pill-dot cooking"></span>
            <span>Diproses ({cookingCount})</span>
          </button>
          <button
            type="button"
            className={`sub-filter-pill dining ${activeTab === 'dining' ? 'active' : ''}`}
            onClick={() => setActiveTab('dining')}
          >
            <span className="pill-dot dining"></span>
            <span>Sedang Santap ({diningCount})</span>
          </button>
        </div>

        {/* Quick Search Input */}
        <div className="table-search-box">
          <MdSearch className="table-search-icon" />
          <input 
            type="text" 
            placeholder="Cari No. Meja (misal: 5)..."
            value={searchTable}
            onChange={(e) => setSearchTable(e.target.value)}
            className="table-search-input"
          />
          {searchTable && (
            <button 
              type="button" 
              className="table-search-clear"
              onClick={() => setSearchTable('')}
              title="Hapus pencarian"
            >
              <MdClose />
            </button>
          )}
        </div>
      </div>

      {/* ── Table Grid & Loading States ── */}
      {loading ? (
        <div className="tables-loading-box">
          <div className="loading-spinner"></div>
          <p>Memuat status meja kafe secara real-time...</p>
        </div>
      ) : displayedTables.length === 0 ? (
        <div className="tables-empty-box">
          {searchTable ? (
            <p>Tidak ditemukan meja dengan nomor <b>"{searchTable}"</b>. <button type="button" className="btn-inline-link" onClick={() => setSearchTable('')}>Reset pencarian</button></p>
          ) : (
            <p>Tidak ada meja dengan filter <b>{
              activeTab === 'available' ? 'Kosong' :
              activeTab === 'pending' ? 'Menunggu Konfirmasi' :
              activeTab === 'cooking' ? 'Diproses (Dapur)' :
              activeTab === 'dining' ? 'Sedang Santap' : 'Semua'
            }</b> saat ini.</p>
          )}
        </div>
      ) : (
        <div className="tables-grid">
          {displayedTables.map(({ tableNumber, status, activeOrder, activeOrdersCount, elapsedDiningMinutes }) => {
            return (
              <div 
                key={tableNumber} 
                className={`table-card status-${status}`}
              >
                {/* Card Header */}
                <div className="table-card-header">
                  <div className="table-badge-group">
                    <span className="table-pill-number">Meja {String(tableNumber).padStart(2, '0')}</span>
                  </div>

                  <span className={`status-tag ${status}`}>
                    <span className="status-indicator-dot"></span>
                    {status === 'available' && 'Kosong'}
                    {status === 'pending' && 'Menunggu Konfirmasi'}
                    {status === 'cooking' && 'Diproses'}
                    {status === 'dining' && 'Sedang Santap'}
                  </span>
                </div>

                {/* Card Body */}
                <div className="table-card-body">
                  {/* Case 1: Pending Confirmation */}
                  {status === 'pending' && activeOrder && (
                    <div className="occupied-info-box pending">
                      <div className="occupied-customer">
                        <div className="customer-info-group">
                          <MdPerson className="info-icon pending" />
                          <span className="customer-name">{activeOrder.userName || 'Pelanggan'}</span>
                        </div>
                      </div>

                      <div className="occupied-bill pending">
                        <span className="bill-label">Tagihan:</span>
                        <b className="bill-amount orange">Rp {(activeOrder.amount || 0).toLocaleString('id-ID')}</b>
                      </div>

                      <div className="occupied-order-meta">
                        <span className="order-time">
                          {new Date(activeOrder.date || activeOrder.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </span>
                      </div>

                      {activeOrdersCount > 1 && (
                        <div className="multi-order-caption">
                          +{activeOrdersCount - 1} pesanan lainnya di meja ini
                        </div>
                      )}
                    </div>
                  )}

                  {/* Case 2: In Kitchen / Cooking */}
                  {status === 'cooking' && activeOrder && (
                    <div className="occupied-info-box cooking">
                      <div className="occupied-customer">
                        <div className="customer-info-group">
                          <MdPerson className="info-icon cooking" />
                          <span className="customer-name">{activeOrder.userName || 'Pelanggan'}</span>
                        </div>
                      </div>

                      <div className="occupied-bill cooking">
                        <span className="bill-label">Tagihan:</span>
                        <b className="bill-amount blue">Rp {(activeOrder.amount || 0).toLocaleString('id-ID')}</b>
                      </div>

                      <div className="occupied-order-meta">
                        <span className="order-time">
                          {new Date(activeOrder.date || activeOrder.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </span>
                      </div>

                      {activeOrdersCount > 1 && (
                        <div className="multi-order-caption">
                          +{activeOrdersCount - 1} pesanan lainnya di meja ini
                        </div>
                      )}
                    </div>
                  )}

                  {/* Case 3: Dining / Served */}
                  {status === 'dining' && activeOrder && (
                    <div className="occupied-info-box dining">
                      <div className="occupied-customer">
                        <div className="customer-info-group">
                          <MdPerson className="info-icon dining" />
                          <span className="customer-name">{activeOrder.userName || 'Pelanggan'}</span>
                        </div>
                      </div>

                      <div className="occupied-bill dining">
                        <span className="bill-label">Tagihan:</span>
                        <b className="bill-amount amber">Rp {(activeOrder.amount || 0).toLocaleString('id-ID')}</b>
                      </div>

                      <div className="occupied-order-meta">
                        <span className="order-time">
                          {new Date(activeOrder.date || activeOrder.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </span>
                      </div>

                      {activeOrdersCount > 1 && (
                        <div className="multi-order-caption">
                          +{activeOrdersCount - 1} pesanan lainnya di meja ini
                        </div>
                      )}
                    </div>
                  )}

                  {/* Case 4: Available */}
                  {status === 'available' && (
                    <div className="available-info-box">
                      <div className="available-table-graphic">
                        <MdTableRestaurant className="table-graphic-icon" />
                      </div>
                      <p className="available-text">Meja bersih & siap untuk tamu baru</p>
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="table-card-footer">
                  {status === 'available' ? (
                    <button 
                      type="button" 
                      className="card-btn-secondary" 
                      onClick={() => setSelectedTableForQR(tableNumber)}
                      title={`Lihat & Cetak QR Code Meja ${tableNumber}`}
                    >
                      <MdQrCode2 />
                      <span>QR Meja</span>
                    </button>
                  ) : status === 'dining' ? (
                    <>
                      <button 
                        type="button" 
                        className="card-btn-secondary" 
                        onClick={() => setSelectedTableForQR(tableNumber)}
                        title={`Lihat & Cetak QR Code Meja ${tableNumber}`}
                      >
                        <MdQrCode2 />
                        <span>QR Meja</span>
                      </button>

                      <button 
                        type="button" 
                        className="card-btn-primary-action clear"
                        onClick={() => handleClearTable(tableNumber, activeOrder?._id)}
                        title="Tandai meja telah bersih & selesaikan pesanan"
                      >
                        <MdCleaningServices />
                        <span>Kosongkan Meja</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        type="button" 
                        className="card-btn-secondary" 
                        onClick={() => setSelectedTableForQR(tableNumber)}
                        title={`Lihat & Cetak QR Code Meja ${tableNumber}`}
                      >
                        <MdQrCode2 />
                        <span>QR Meja</span>
                      </button>

                      <button 
                        type="button" 
                        className="card-btn-secondary"
                        onClick={() => navigate(`/orders?search=Meja+${tableNumber}`)}
                        title="Buka rincian pesanan di Semua Pesanan"
                      >
                        <MdReceiptLong />
                        <span>Pesanan</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── QR Code Preview & Printable Table Tent Modal ── */}
      {selectedTableForQR && (
        <TableQRModal 
          tableNumber={selectedTableForQR}
          frontendUrl={FRONTEND_URL}
          isOpen={Boolean(selectedTableForQR)}
          onClose={() => setSelectedTableForQR(null)}
        />
      )}
    </div>
  );
};

export default Tables;
