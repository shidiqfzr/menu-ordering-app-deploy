import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  MdSearch, 
  MdCalendarToday, 
  MdRestartAlt, 
  MdNavigateBefore, 
  MdNavigateNext, 
  MdFirstPage, 
  MdLastPage, 
  MdVolumeUp, 
  MdVolumeOff, 
  MdPrint, 
  MdFileDownload,
  MdExpandMore,
  MdExpandLess,
  MdUnfoldMore,
  MdUnfoldLess,
  MdArrowUpward,
  MdArrowDownward,
  MdClose,
  MdSwapVert,
  MdOutlineEditNote,
  MdQrCodeScanner,
  MdPayments
} from 'react-icons/md';
import { assets } from '../../assets/assets';
import ReceiptModal from '../../components/ReceiptModal/ReceiptModal';
import PaymentModal from '../../components/PaymentModal/PaymentModal';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import useOrderAudio from '../../hooks/useOrderAudio';
import useSocketOrders from '../../hooks/useSocketOrders';
import useOrderFilters from '../../hooks/useOrderFilters';
import './Orders.css';

// Helper to calculate live relative wait time for restaurant operational urgency
const getElapsedWaitTime = (rawDate, currentTime) => {
  if (!rawDate) return { text: '-', isUrgent: false };
  const orderTime = new Date(rawDate).getTime();
  if (isNaN(orderTime)) return { text: '-', isUrgent: false };
  const diffMs = currentTime - orderTime;
  const diffMins = Math.max(0, Math.floor(diffMs / (1000 * 60)));
  if (diffMins < 1) return { text: 'Baru saja', isUrgent: false };
  if (diffMins < 60) return { text: `${diffMins} mnt lalu`, isUrgent: diffMins >= 20 };
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return { text: `${hours} jam ${mins > 0 ? `${mins} mnt ` : ''}lalu`, isUrgent: true };
};

const Orders = () => {
  const { isManager } = useAuth();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const previousOrdersRef = useRef([]);
  const isInitialLoadRef = useRef(true);

  // 1. Audio Notification Hook (Synthesizer + Persistence)
  const { soundEnabled, playOrderChime, handleToggleSound } = useOrderAudio();

  // 2. Filter, Search, Sort, Pagination & Export Hook
  const {
    viewScope,
    setViewScope,
    activeSubFilter,
    setActiveSubFilter,
    historySubFilter,
    setHistorySubFilter,
    startDate,
    endDate,
    searchQuery,
    setSearchQuery,
    isTodayActive,
    handleToggleToday,
    handleStartDateChange,
    handleEndDateChange,
    handleClearDates,
    handleResetFilters: resetFiltersState,
    sortConfig,
    handleSort,
    counts,
    filteredOrders,
    currentOrders,
    currentPage,
    validCurrentPage,
    totalPages,
    indexOfFirstOrder,
    indexOfLastOrder,
    itemsPerPage,
    setItemsPerPage,
    handlePageChange,
    getPageNumbers,
    historySummary,
    handleExportCSV,
  } = useOrderFilters(orders);

  const { pending, diproses, disajikan, activeCount, selesai, dibatalkan, historyCount } = counts;

  // Progressive Disclosure: Collapsible Menu Items (Default: Hidden / Collapsed)
  const [expandedCards, setExpandedCards] = useState({});

  const toggleCardExpand = (orderId) => {
    setExpandedCards(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  // Sync searchQuery with URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search');
    if (searchParam !== null) {
      setSearchQuery(searchParam);
    }
  }, [location.search, setSearchQuery]);

  // Receipt & Payment Modals State
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);
  const [selectedPaymentOrder, setSelectedPaymentOrder] = useState(null);

  const handlePaymentSuccess = (updatedOrder, autoPrintReceipt) => {
    setOrders(prev => prev.map(o => o._id === updatedOrder._id ? { ...o, ...updatedOrder } : o));
    broadcastOrderSync({ type: 'payment', orderId: updatedOrder._id, payment: true });

    if (autoPrintReceipt) {
      setSelectedReceiptOrder(updatedOrder);
    }
  };

  // Live clock tick for relative elapsed wait time calculation (updates every 30s)
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Orders from API
  const fetchOrders = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      let url = `/api/order/list?includeActive=true`;

      if (startDate || endDate) {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        url += `&${params.toString()}`;
      } else {
        url += '&limit=300';
      }

      const response = await api.get(url);
      if (response.data.success) {
        const sorted = response.data.data.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
        
        // Alert on newly arrived incoming orders (ONLY during background live sync for fresh Pending orders)
        if (isBackground && !isInitialLoadRef.current && previousOrdersRef.current.length > 0) {
          const prevIds = new Set(previousOrdersRef.current.map(o => o._id));
          const newPendingOrders = sorted.filter(o => {
            const isPending = o.status === 'Pending' || o.status === 'Menunggu';
            if (!isPending) return false;
            if (prevIds.has(o._id)) return false;
            const orderAgeMs = Date.now() - new Date(o.date || o.createdAt).getTime();
            return orderAgeMs < 10 * 60 * 1000;
          });
          
          if (newPendingOrders.length > 0) {
            playOrderChime();
            const latest = newPendingOrders[0];
            toast.info(`Pesanan baru masuk! (${latest.invoiceNumber || (latest.tableNumber ? 'Meja ' + latest.tableNumber : 'Pesanan Baru')})`, {
              autoClose: 5000,
            });
          }
        }

        previousOrdersRef.current = sorted;
        isInitialLoadRef.current = false;
        setOrders(sorted);
      } else if (!isBackground) {
        toast.error('Gagal memuat data pesanan');
      }
    } catch (error) {
      console.error(error);
      if (!isBackground) {
        toast.error('Terjadi kesalahan saat terhubung ke server');
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  // 3. Socket.IO & Multi-Tab Hook
  const { broadcastOrderSync } = useSocketOrders({
    onRefresh: fetchOrders,
    playOrderChime,
    soundEnabled,
    viewScope,
  });

  // Initial Load & Date change refetch
  useEffect(() => {
    fetchOrders(false);
  }, [startDate, endDate]);

  // Handle Order Status Mutation
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const response = await api.post(`/api/order/status`, {
        orderId,
        status: newStatus,
      });
      if (response.data.success) {
        toast.success(`Status pesanan berhasil diubah ke "${newStatus}"`);
        fetchOrders(true);
        broadcastOrderSync();
      } else {
        toast.error('Gagal mengubah status pesanan');
      }
    } catch (error) {
      console.error(error);
      toast.error('Gagal mengubah status pesanan');
    }
  };

  // Cancel order handler
  const handleCancelOrder = (orderId, invoiceNumber) => {
    const inv = invoiceNumber || 'pesanan ini';
    if (window.confirm(`Batalkan ${inv}? Status pesanan akan diubah ke "Dibatalkan" dan meja akan dibebaskan.`)) {
      handleStatusChange(orderId, 'Dibatalkan');
    }
  };

  const handleResetFilters = () => {
    resetFiltersState();
    fetchOrders(false);
  };

  // Global Expand / Collapse All state (Active Cards)
  const isAllExpanded = useMemo(() => {
    if (currentOrders.length === 0) return false;
    return currentOrders.every(o => expandedCards[o._id]);
  }, [currentOrders, expandedCards]);

  const toggleExpandAll = () => {
    if (isAllExpanded) {
      setExpandedCards({});
    } else {
      const allOpen = {};
      currentOrders.forEach(o => { allOpen[o._id] = true; });
      setExpandedCards(allOpen);
    }
  };

  return (
    <div className="orders-page clean-pos">
      {/* ── 1. Clean Executive Page Header ── */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Semua Pesanan</h2>
          <p className="page-subtitle">Pantau dan kelola pesanan pelanggan secara real-time</p>
        </div>

        <div className="header-action-group">
          <button 
            type="button"
            className={`header-toggle-btn ${soundEnabled ? 'active' : ''}`}
            onClick={handleToggleSound}
            title={soundEnabled ? 'Suara aktif (Klik untuk membisukan)' : 'Suara mati'}
          >
            {soundEnabled ? <MdVolumeUp className="header-icon" /> : <MdVolumeOff className="header-icon" />}
            <span>{soundEnabled ? 'Suara: Aktif' : 'Suara: Mati'}</span>
          </button>

          {isManager && (
            <button 
              type="button"
              className="export-report-btn" 
              onClick={handleExportCSV} 
              title="Export data ke file Excel (.csv)"
            >
              <MdFileDownload className="header-icon" />
              <span>Export Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 2. Top-Level Operational Scope Switcher ── */}
      <div className="orders-scope-bar">
        <button
          type="button"
          className={`scope-tab ${viewScope === 'active' ? 'active' : ''}`}
          onClick={() => { setViewScope('active'); setActiveSubFilter('all'); setCurrentPage(1); }}
        >
          <span className="scope-name">Pesanan Aktif</span>
          <span className={`scope-count ${activeCount > 0 ? 'highlight-active' : ''}`}>
            {activeCount}
          </span>
        </button>

        <button
          type="button"
          className={`scope-tab ${viewScope === 'history' ? 'active' : ''}`}
          onClick={() => { setViewScope('history'); setHistorySubFilter('all'); setCurrentPage(1); }}
        >
          <span className="scope-name">Riwayat Pesanan</span>
        </button>
      </div>

      {/* ── 3. Integrated Control Toolbar ── */}
      <div className="orders-toolbar-bar">
        {viewScope === 'active' ? (
          <>
            <div className="toolbar-filters">
              <div className="active-sub-pills">
                <button
                  type="button"
                  className={`sub-filter-pill ${activeSubFilter === 'all' ? 'active' : ''}`}
                  onClick={() => { setActiveSubFilter('all'); setCurrentPage(1); }}
                >
                  Semua Aktif ({activeCount})
                </button>
                <button
                  type="button"
                  className={`sub-filter-pill pending ${activeSubFilter === 'pending' ? 'active' : ''}`}
                  onClick={() => { setActiveSubFilter('pending'); setCurrentPage(1); }}
                >
                  <span className="pill-dot pending"></span>
                  <span>Menunggu ({pending})</span>
                </button>
                <button
                  type="button"
                  className={`sub-filter-pill cooking ${activeSubFilter === 'cooking' ? 'active' : ''}`}
                  onClick={() => { setActiveSubFilter('cooking'); setCurrentPage(1); }}
                >
                  <span className="pill-dot cooking"></span>
                  <span>Diproses ({diproses})</span>
                </button>
                <button
                  type="button"
                  className={`sub-filter-pill dining ${activeSubFilter === 'dining' ? 'active' : ''}`}
                  onClick={() => { setActiveSubFilter('dining'); setCurrentPage(1); }}
                >
                  <span className="pill-dot dining"></span>
                  <span>Sedang Santap ({disajikan})</span>
                </button>
              </div>
            </div>

            <div className="toolbar-utilities">
              {currentOrders.length > 0 && (
                <button
                  type="button"
                  className="toggle-all-expand-btn"
                  onClick={toggleExpandAll}
                  title={isAllExpanded ? 'Tutup semua rincian menu pada halaman ini' : 'Buka semua rincian menu pada halaman ini'}
                >
                  {isAllExpanded ? (
                    <>
                      <MdUnfoldLess className="toggle-all-icon" />
                      <span>Tutup Semua</span>
                    </>
                  ) : (
                    <>
                      <MdUnfoldMore className="toggle-all-icon" />
                      <span>Buka Semua</span>
                    </>
                  )}
                </button>
              )}

              <div className="search-input-wrapper">
                <MdSearch className="search-icon-svg" />
                <input
                  type="text"
                  placeholder="Cari meja, pemesan, faktur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button type="button" className="search-clear-btn" onClick={() => setSearchQuery('')}>×</button>
                )}
              </div>
            </div>
          </>
        ) : (
          /* ── Riwayat Pesanan: Balanced, User-Friendly Best Practice Layout ── */
          <div className="history-toolbar-layout">
            <div className="history-toolbar-left">
              <div className="history-date-toolbar-group">
                <button
                  type="button"
                  className={`quick-today-btn ${isTodayActive ? 'active' : ''}`}
                  onClick={handleToggleToday}
                  title={isTodayActive ? 'Reset filter (tampilkan semua riwayat)' : 'Filter cepat pesanan hari ini'}
                >
                  Hari Ini
                </button>

                <div className={`date-range-filter-box ${(startDate || endDate) ? 'active' : ''}`} title="Filter rentang tanggal">
                  <MdCalendarToday className="date-range-icon" />
                  <input
                    type="date"
                    className="date-range-native-input"
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    max={endDate || undefined}
                    title="Tanggal Mulai"
                  />
                  <span className="date-range-sep">–</span>
                  <input
                    type="date"
                    className="date-range-native-input"
                    value={endDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    min={startDate || undefined}
                    title="Tanggal Akhir"
                  />
                  {(startDate || endDate) && (
                    <button
                      type="button"
                      className="date-range-clear-btn"
                      onClick={handleClearDates}
                      title="Hapus filter tanggal"
                    >
                      <MdClose className="date-clear-icon" />
                    </button>
                  )}
                </div>
              </div>

              {(startDate || endDate || isTodayActive) && (
                <button
                  type="button"
                  className="history-reset-filter-btn"
                  onClick={handleClearDates}
                  title="Reset filter tanggal (tampilkan semua riwayat)"
                >
                  <MdRestartAlt className="btn-icon" />
                  <span>Reset Filter</span>
                </button>
              )}
            </div>

            <div className="history-toolbar-right">
              <div className="search-input-wrapper history-search">
                <MdSearch className="search-icon-svg" />
                <input
                  type="text"
                  placeholder="Cari meja, pemesan, faktur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button type="button" className="search-clear-btn" onClick={() => setSearchQuery('')}>×</button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 3.5. History Financial & Shift Recap Banner ── */}
      {viewScope === 'history' && !loading && historySummary && (
        <div className="history-recap-banner">
          <div className="recap-card-item revenue-card">
            <span className="recap-card-label">Total Pendapatan</span>
            <div className="recap-card-value">
              Rp {historySummary.totalRevenue.toLocaleString('id-ID')}
            </div>
          </div>

          <div className="recap-card-item">
            <span className="recap-card-label">Pesanan Berhasil</span>
            <div className="recap-card-value text-emerald">
              {historySummary.completedCount} <span className="recap-unit">transaksi</span>
            </div>
          </div>

          <div className="recap-card-item">
            <span className="recap-card-label">Dibatalkan / Void</span>
            <div className="recap-card-value text-rose">
              {historySummary.cancelledCount} <span className="recap-unit">pesanan</span>
            </div>
          </div>

          <div className="recap-card-item payment-card">
            <span className="recap-card-label">Rincian Pembayaran</span>
            <div className="recap-payment-pills">
              <span className="recap-pay-tag cash" title="Total Pembayaran Tunai">
                Tunai: <b>Rp {historySummary.cashRevenue.toLocaleString('id-ID')}</b>
              </span>
              <span className="recap-pay-tag qris" title="Total Pembayaran QRIS">
                QRIS: <b>Rp {historySummary.qrisRevenue.toLocaleString('id-ID')}</b>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. Main Orders Workspace ── */}
      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Memuat data pesanan...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <img src={assets.parcel_icon} alt="Belum ada pesanan" className="empty-icon" />
          <h3>Belum Ada Pesanan</h3>
          <p>Pesanan pelanggan akan muncul di sini secara otomatis saat dibuat.</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="empty-state">
          <img src={assets.parcel_icon} alt="Filter kosong" className="empty-icon" />
          <h3>Tidak Ada Pesanan yang Sesuai</h3>
          <p>Tidak ditemukan pesanan untuk filter yang dipilih.</p>
          <button type="button" className="reset-filter-btn in-empty" onClick={handleResetFilters}>
            Reset Filter
          </button>
        </div>
      ) : viewScope === 'history' ? (
        /* ── High-Density Spreadsheet Table View for History & Auditing ── */
        <div className="orders-table-wrapper">
          <table className="orders-data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('customer')} className="sortable-th" title="Klik untuk mengurutkan berdasarkan Pemesan">
                  <div className="th-sort-wrapper">
                    <span>Pemesan & Meja</span>
                    {sortConfig.key === 'customer' ? (
                      sortConfig.direction === 'asc' ? <MdArrowUpward className="sort-icon" /> : <MdArrowDownward className="sort-icon" />
                    ) : (
                      <MdSwapVert className="sort-icon-neutral" />
                    )}
                  </div>
                </th>
                <th onClick={() => handleSort('date')} className="sortable-th" title="Klik untuk mengurutkan berdasarkan Waktu">
                  <div className="th-sort-wrapper">
                    <span>Waktu</span>
                    {sortConfig.key === 'date' ? (
                      sortConfig.direction === 'asc' ? <MdArrowUpward className="sort-icon" /> : <MdArrowDownward className="sort-icon" />
                    ) : (
                      <MdSwapVert className="sort-icon-neutral" />
                    )}
                  </div>
                </th>
                <th style={{ width: '40%' }}>Menu Pesanan</th>
                <th onClick={() => handleSort('total')} className="sortable-th text-right" title="Klik untuk mengurutkan berdasarkan Total">
                  <div className="th-sort-wrapper justify-end">
                    <span>Total & Pembayaran</span>
                    {sortConfig.key === 'total' ? (
                      sortConfig.direction === 'asc' ? <MdArrowUpward className="sort-icon" /> : <MdArrowDownward className="sort-icon" />
                    ) : (
                      <MdSwapVert className="sort-icon-neutral" />
                    )}
                  </div>
                </th>
                <th onClick={() => handleSort('status')} className="sortable-th" title="Klik untuk mengurutkan berdasarkan Status Pesanan">
                  <div className="th-sort-wrapper">
                    <span>Status</span>
                    {sortConfig.key === 'status' ? (
                      sortConfig.direction === 'asc' ? <MdArrowUpward className="sort-icon" /> : <MdArrowDownward className="sort-icon" />
                    ) : (
                      <MdSwapVert className="sort-icon-neutral" />
                    )}
                  </div>
                </th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {currentOrders.map((order) => {
                const isCompleted = order.status === 'Selesai' || order.status === 'Delivered';
                const rawDate = order.date || order.createdAt;

                // Tooltip text detailing all items and note
                const itemsTooltip = [
                  order.items?.map(i => `${i.name} (${i.quantity}x)`).join(', ') || 'Tidak ada menu',
                  order.note && order.note !== '-' ? `Catatan: ${order.note}` : ''
                ].filter(Boolean).join('\n');

                return (
                  <tr key={order._id} className="history-order-row">
                    {/* 1. Pemesan & Meja */}
                    <td>
                      <div className="table-customer-col">
                        <div className="customer-header-row">
                          <span className="customer-name">{order.userName || 'Pelanggan'}</span>
                          <span className="table-badge-neutral">
                            {order.tableNumber ? `Meja ${order.tableNumber}` : 'Takeaway'}
                          </span>
                        </div>
                        <span className="invoice-code">{order.invoiceNumber || `#${order._id.slice(-6).toUpperCase()}`}</span>
                      </div>
                    </td>

                    {/* 2. Waktu */}
                    <td>
                      <span className="table-time-text">
                        {rawDate ? new Date(rawDate).toLocaleString('id-ID', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                        }) : '-'}
                      </span>
                    </td>

                    {/* 3. Menu Pesanan (Full Clean Inline List + Subtle Note) */}
                    <td>
                      <div className="table-items-cell" title={itemsTooltip}>
                        <div className="table-items-list-text">
                          {order.items && order.items.length > 0 ? (
                            order.items.map((it, idx) => (
                              <span key={idx} className="item-text-inline">
                                {it.name} <span className="item-qty-tag">({it.quantity}×)</span>
                                {idx < order.items.length - 1 ? <span className="item-separator">, </span> : null}
                              </span>
                            ))
                          ) : (
                            <span className="item-empty-text">-</span>
                          )}
                        </div>
                        {order.note && order.note !== '-' && (
                          <div className="table-order-note-sub" title={`Catatan: ${order.note}`}>
                            <MdOutlineEditNote className="table-note-icon" />
                            <span className="table-note-text">{order.note}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 4. Total & Pembayaran */}
                    <td style={{ textAlign: 'right' }}>
                      <div className="table-financial-col">
                        <span className="table-price">Rp {Number(order.amount || 0).toLocaleString('id-ID')}</span>
                        <div className="table-pay-method-sub">
                          {isCompleted ? (
                            order.payment ? (
                              <span className="pay-method-text paid">
                                {order.paymentMethod?.toLowerCase().includes('tunai') ? (
                                  <><MdPayments className="pay-sub-icon" /> Tunai • Lunas</>
                                ) : (
                                  <><MdQrCodeScanner className="pay-sub-icon" /> QRIS • Lunas</>
                                )}
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="table-unpaid-pay-btn"
                                onClick={() => setSelectedPaymentOrder(order)}
                                title="Klik untuk proses pembayaran kasir (Kalkulator Uang & Kembalian)"
                              >
                                <MdPayments className="pay-sub-icon" />
                                <span>Bayar (Tunai)</span>
                              </button>
                            )
                          ) : (
                            order.payment ? (
                              <span className="pay-method-text refund" title="Pesanan dibatalkan setelah pembayaran. Perlu refund ke pelanggan.">
                                ⚠️ Perlu Refund ({order.paymentMethod || 'QRIS'})
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="table-unpaid-pay-btn"
                                onClick={() => setSelectedPaymentOrder(order)}
                                title="Klik untuk proses pembayaran kasir (Kalkulator Uang & Kembalian)"
                              >
                                <MdPayments className="pay-sub-icon" />
                                <span>Bayar (Tunai)</span>
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 5. Status */}
                    <td>
                      <span className={`status-chip ${isCompleted ? 'completed' : 'cancelled'}`}>
                        <span className={`status-dot ${isCompleted ? 'completed' : 'cancelled'}`}></span>
                        <span>{isCompleted ? 'Selesai' : 'Dibatalkan'}</span>
                      </span>
                    </td>

                    {/* 6. Aksi */}
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="table-print-btn"
                        onClick={() => setSelectedReceiptOrder(order)}
                        title="Cetak Struk Transaksi"
                      >
                        <MdPrint className="action-icon-sm" />
                        <span>Struk</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* ── Modern 2-Column POS Cards (Active Floor Orders) ── */
        <div className="orders-grid">
          {currentOrders.map((order) => {
            const elapsed = getElapsedWaitTime(order.date || order.createdAt, currentTime);
            const isPending = order.status === 'Pending' || order.status === 'Menunggu';
            const isProcessing = order.status === 'Diproses' || order.status === 'Food Processing';
            const isDining = order.status === 'Disajikan';
            const statusKey = isPending ? 'pending' : isProcessing ? 'processing' : 'dining';
            const totalPortions = order.items ? order.items.reduce((s, i) => s + (i.quantity || 1), 0) : 0;
            const isExpanded = !!expandedCards[order._id];

            // Summary string for collapsed state
            const itemsSummaryPreview = order.items && order.items.length > 0
              ? order.items.map(it => `${it.quantity}× ${it.name}`).join(', ')
              : 'Rincian menu';

            return (
              <div key={order._id} className={`order-ticket-card status-${statusKey}`}>
                {/* 1. Header: Clean Modern POS Header */}
                <div className="ticket-header">
                  <div className="ticket-header-top">
                    <div className="ticket-table-group">
                      <span className="ticket-table-number">
                        {order.tableNumber ? `Meja ${order.tableNumber}` : 'Takeaway'}
                      </span>
                      <span className="ticket-customer-label" title={order.userName || 'Pelanggan'}>
                        {order.userName || 'Pelanggan'}
                      </span>
                    </div>

                    <div className="ticket-meta-right">
                      <span 
                        className="ticket-order-time" 
                        title={`${new Date(order.date || order.createdAt).toLocaleString('id-ID')}${elapsed.text ? ` (${elapsed.text})` : ''}`}
                      >
                        {new Date(order.date || order.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                      </span>
                      <span className={`ticket-status-pill ${statusKey}`}>
                        <span className={`status-indicator-dot ${statusKey}`}></span>
                        {isPending ? 'Menunggu Konfirmasi' :
                         isProcessing ? 'Diproses (Dapur)' : 'Sedang Santap'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Progressive Disclosure Accordion Toggle (Hidden by Default!) */}
                <div className="ticket-accordion-wrapper">
                  <button
                    type="button"
                    className={`ticket-accordion-toggle-btn ${isExpanded ? 'is-open' : ''}`}
                    onClick={() => toggleCardExpand(order._id)}
                    title={isExpanded ? 'Sembunyikan rincian menu' : 'Buka rincian menu'}
                  >
                    <div className="accordion-btn-left">
                      <span className="accordion-items-count-badge">
                        {order.items?.length || 0} Menu ({totalPortions} porsi)
                      </span>
                      {!isExpanded && (
                        <span className="accordion-dish-preview-inline" title={itemsSummaryPreview}>
                          : {itemsSummaryPreview}
                        </span>
                      )}
                    </div>

                    <div className="accordion-btn-right">
                      <span className="accordion-toggle-text">
                        {isExpanded ? 'Tutup Menu' : 'Lihat Menu'}
                      </span>
                      {isExpanded ? (
                        <MdExpandLess className="accordion-arrow-icon" />
                      ) : (
                        <MdExpandMore className="accordion-arrow-icon" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Content Area */}
                  {isExpanded && (
                    <div className="ticket-accordion-content-area">
                      <div className="ticket-items-list">
                        {order.items && order.items.map((item, idx) => (
                          <div key={idx} className="ticket-item-row">
                            <div className="ticket-item-qty-name">
                              <span className="ticket-item-qty">{item.quantity}×</span>
                              <span className="ticket-item-name">{item.name}</span>
                            </div>
                            <span className="ticket-item-price">
                              Rp {(item.price * (item.quantity || 1)).toLocaleString('id-ID')}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Customer Special Note Callout */}
                      {order.note && order.note !== '-' && (
                        <div className="ticket-note-box">
                          <span className="note-title-tag">Catatan:</span>
                          <span className="note-content-tag">"{order.note}"</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Ticket Footer: Total Price + Payment Status + Action Buttons */}
                <div className="ticket-footer">
                  <div className="ticket-footer-meta">
                    <div className="ticket-payment-block">
                      <span className={`ticket-payment-badge ${order.payment ? 'paid' : 'unpaid'}`}>
                        {order.payment
                          ? `Lunas (${order.paymentMethod || 'QRIS'})`
                          : 'Belum Bayar (Tunai)'}
                      </span>
                    </div>

                    <div className="ticket-price-block">
                      <span className="ticket-total-label">Total ({totalPortions} item)</span>
                      <span className="ticket-price-amount">
                        Rp {Number(order.amount || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Action Progression Controls */}
                  <div className="ticket-footer-actions">
                    {!order.payment && !isPending && (
                      <button
                        type="button"
                        className="ticket-pay-btn"
                        onClick={() => setSelectedPaymentOrder(order)}
                        title="Proses Pembayaran Kasir (Kalkulator Uang & Kembalian)"
                      >
                        <MdPayments className="action-icon-sm" />
                        <span>Bayar</span>
                      </button>
                    )}

                    <button
                      type="button"
                      className="ticket-receipt-btn"
                      onClick={() => setSelectedReceiptOrder(order)}
                      title="Cetak Struk"
                    >
                      <MdPrint className="action-icon-sm" />
                      <span>Struk</span>
                    </button>

                    <button
                      type="button"
                      className="ticket-cancel-action-btn"
                      onClick={() => handleCancelOrder(order._id, order.invoiceNumber)}
                      title="Batalkan pesanan ini"
                    >
                      <span>Batalkan</span>
                    </button>

                    {isPending && (
                      <button
                        type="button"
                        className="ticket-progression-btn btn-confirm-pay"
                        onClick={() => setSelectedPaymentOrder(order)}
                        title="Konfirmasi pembayaran tunai & langsung kirim ke dapur untuk dimasak"
                      >
                        <MdPayments className="btn-icon-pay" />
                        <span>Konfirmasi Pembayaran</span>
                        <span className="btn-arrow-sym">→</span>
                      </button>
                    )}

                    {isProcessing && (
                      <button
                        type="button"
                        className="ticket-progression-btn btn-serve-dish"
                        onClick={() => handleStatusChange(order._id, 'Disajikan')}
                      >
                        <span>Sajikan ke Meja</span>
                        <span className="btn-arrow-sym">→</span>
                      </button>
                    )}

                    {isDining && (
                      <button
                        type="button"
                        className="ticket-progression-btn btn-free-table"
                        onClick={() => handleStatusChange(order._id, 'Selesai')}
                      >
                        <span>Selesaikan & Kosongkan Meja</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 5. Bottom Pagination Bar ── */}
      {filteredOrders.length > 0 && (
        <div className="orders-pagination-bar">
          <div className="orders-pagination-info">
            <span>
              Menampilkan <b>{indexOfFirstOrder + 1}–{Math.min(indexOfLastOrder, filteredOrders.length)}</b> dari <b>{filteredOrders.length}</b> pesanan
            </span>
            
            <div className="orders-page-size-selector">
              <span>Tampilkan:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="orders-page-size-select"
              >
                <option value={8}>8 / hal</option>
                <option value={10}>10 / hal</option>
                <option value={16}>16 / hal</option>
                <option value={24}>24 / hal</option>
                <option value={50}>50 / hal</option>
              </select>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="orders-pagination-controls">
              <button
                type="button"
                className="orders-page-btn nav-btn"
                onClick={() => handlePageChange(1)}
                disabled={validCurrentPage === 1}
                title="Halaman Pertama"
              >
                <MdFirstPage />
              </button>
              <button
                type="button"
                className="orders-page-btn nav-btn"
                onClick={() => handlePageChange(validCurrentPage - 1)}
                disabled={validCurrentPage === 1}
                title="Halaman Sebelumnya"
              >
                <MdNavigateBefore />
              </button>

              <div className="orders-page-numbers">
                {getPageNumbers().map((num, idx) => (
                  num === '...' ? (
                    <span key={`ellipsis-${idx}`} className="orders-page-ellipsis">…</span>
                  ) : (
                    <button
                      key={`page-${num}`}
                      type="button"
                      className={`orders-page-btn num-btn ${validCurrentPage === num ? 'active' : ''}`}
                      onClick={() => handlePageChange(num)}
                    >
                      {num}
                    </button>
                  )
                ))}
              </div>

              <button
                type="button"
                className="orders-page-btn nav-btn"
                onClick={() => handlePageChange(validCurrentPage + 1)}
                disabled={validCurrentPage === totalPages}
                title="Halaman Selanjutnya"
              >
                <MdNavigateNext />
              </button>
              <button
                type="button"
                className="orders-page-btn nav-btn"
                onClick={() => handlePageChange(totalPages)}
                disabled={validCurrentPage === totalPages}
                title="Halaman Terakhir"
              >
                <MdLastPage />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Printable Receipt Modal */}
      {selectedReceiptOrder && (
        <ReceiptModal
          order={selectedReceiptOrder}
          onClose={() => setSelectedReceiptOrder(null)}
        />
      )}

      {/* Kasir Quick Cash & Change Return Calculator Modal */}
      {selectedPaymentOrder && (
        <PaymentModal
          order={selectedPaymentOrder}
          onClose={() => setSelectedPaymentOrder(null)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default Orders;
