import { useState, useMemo, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';

// Helper to format local date YYYY-MM-DD
export const toLocalDateString = (dateObj) => {
  const d = new Date(dateObj);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to escape CSV strings
const escapeCsv = (val) => {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
};

// Stage priority for active floor tickets
const getStagePriority = (status) => {
  if (status === 'Pending' || status === 'Menunggu') return 1;
  if (status === 'Diproses' || status === 'Food Processing') return 2;
  if (status === 'Disajikan') return 3;
  return 4;
};

/**
 * Custom Hook: useOrderFilters
 * Manages search query, operational scopes, status subfilters, date range filters,
 * multi-column sorting, pagination slicing, shift summaries, and CSV/Excel export generation.
 */
export const useOrderFilters = (orders = []) => {
  // Top-Level Operational Scope: 'active' (Floor Cards) | 'history' (Unified Audit Table)
  const [viewScope, setViewScope] = useState('active');

  // Sub-filter tabs
  const [activeSubFilter, setActiveSubFilter] = useState('all'); // 'all', 'pending', 'cooking', 'dining'
  const [historySubFilter, setHistorySubFilter] = useState('all'); // 'all', 'completed', 'cancelled'

  // Date Range Filtering
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Search Query
  const [searchQuery, setSearchQuery] = useState('');

  // Sorting
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Reset page to 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [viewScope, activeSubFilter, historySubFilter, sortConfig, startDate, endDate, searchQuery, itemsPerPage]);

  // Quick 'Hari Ini' Date Range Handler
  const todayStr = useMemo(() => toLocalDateString(new Date()), []);
  const isTodayActive = startDate === todayStr && endDate === todayStr;

  const handleToggleToday = useCallback(() => {
    if (isTodayActive) {
      setStartDate('');
      setEndDate('');
    } else {
      setStartDate(todayStr);
      setEndDate(todayStr);
    }
  }, [isTodayActive, todayStr]);

  const handleStartDateChange = useCallback((val) => {
    setStartDate(val);
    if (endDate && val && val > endDate) {
      setEndDate(val);
    }
  }, [endDate]);

  const handleEndDateChange = useCallback((val) => {
    setEndDate(val);
    if (startDate && val && val < startDate) {
      setStartDate(val);
    }
  }, [startDate]);

  const handleClearDates = useCallback(() => {
    setStartDate('');
    setEndDate('');
  }, []);

  const handleResetFilters = useCallback(() => {
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
    setActiveSubFilter('all');
    setHistorySubFilter('all');
    setCurrentPage(1);
  }, []);

  const handleSort = useCallback((key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'desc' };
    });
  }, []);

  // ── Operational Counts ──
  const counts = useMemo(() => {
    let pending = 0;
    let diproses = 0;
    let disajikan = 0;
    let selesai = 0;
    let dibatalkan = 0;

    orders.forEach((o) => {
      const s = o.status;
      if (s === 'Pending' || s === 'Menunggu') pending++;
      else if (s === 'Diproses' || s === 'Food Processing') diproses++;
      else if (s === 'Disajikan') disajikan++;
      else if (s === 'Selesai' || s === 'Delivered') selesai++;
      else if (s === 'Dibatalkan' || s === 'Cancelled') dibatalkan++;
    });

    return {
      pending,
      diproses,
      disajikan,
      activeCount: pending + diproses + disajikan,
      selesai,
      dibatalkan,
      historyCount: selesai + dibatalkan,
    };
  }, [orders]);

  // Filter and Sort Orders
  const filteredOrders = useMemo(() => {
    const list = orders.filter((order) => {
      const isPending = order.status === 'Pending' || order.status === 'Menunggu';
      const isCooking = order.status === 'Diproses' || order.status === 'Food Processing';
      const isDining = order.status === 'Disajikan';
      const isCompleted = order.status === 'Selesai' || order.status === 'Delivered';
      const isCancelled = order.status === 'Dibatalkan' || order.status === 'Cancelled';

      // 1. Top-Level Scope
      if (viewScope === 'active') {
        if (!isPending && !isCooking && !isDining) return false;
        if (activeSubFilter === 'pending' && !isPending) return false;
        if (activeSubFilter === 'cooking' && !isCooking) return false;
        if (activeSubFilter === 'dining' && !isDining) return false;
      } else if (viewScope === 'history') {
        if (!isCompleted && !isCancelled) return false;
        if (historySubFilter === 'completed' && !isCompleted) return false;
        if (historySubFilter === 'cancelled' && !isCancelled) return false;

        const rawDate = order.date || order.createdAt;
        if (rawDate) {
          const orderDate = new Date(rawDate);
          if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            if (orderDate < start) return false;
          }
          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            if (orderDate > end) return false;
          }
        }
      }

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const invoice = (order.invoiceNumber || `order #${order._id.slice(-6)}`).toLowerCase();
        const customer = (order.userName || '').toLowerCase();
        const table = (order.tableNumber ? `meja ${order.tableNumber}` : 'takeaway').toLowerCase();
        const itemsMatch = order.items?.some((i) => i.name?.toLowerCase().includes(q));
        if (!invoice.includes(q) && !customer.includes(q) && !table.includes(q) && !itemsMatch) {
          return false;
        }
      }

      return true;
    });

    // 3. Sorting
    if (viewScope === 'active') {
      list.sort((a, b) => {
        const priorityA = getStagePriority(a.status);
        const priorityB = getStagePriority(b.status);
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        const timeA = new Date(a.date || a.createdAt).getTime();
        const timeB = new Date(b.date || b.createdAt).getTime();
        return timeA - timeB;
      });
    } else {
      list.sort((a, b) => {
        let aVal, bVal;

        if (sortConfig.key === 'customer') {
          aVal = (a.userName || '').toLowerCase();
          bVal = (b.userName || '').toLowerCase();
        } else if (sortConfig.key === 'date') {
          aVal = new Date(a.date || a.createdAt).getTime();
          bVal = new Date(b.date || b.createdAt).getTime();
        } else if (sortConfig.key === 'total') {
          aVal = Number(a.amount || 0);
          bVal = Number(b.amount || 0);
        } else if (sortConfig.key === 'payment') {
          aVal = (a.payment ? '1' : '0') + (a.paymentMethod || '');
          bVal = (b.payment ? '1' : '0') + (b.paymentMethod || '');
        } else if (sortConfig.key === 'status') {
          aVal = (a.status || '').toLowerCase();
          bVal = (b.status || '').toLowerCase();
        } else {
          aVal = new Date(a.date || a.createdAt).getTime();
          bVal = new Date(b.date || b.createdAt).getTime();
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return list;
  }, [orders, viewScope, activeSubFilter, historySubFilter, sortConfig, startDate, endDate, searchQuery]);

  // Financial & Operational Summary for History Scope
  const historySummary = useMemo(() => {
    if (viewScope !== 'history') return null;

    let totalRevenue = 0;
    let completedCount = 0;
    let cancelledCount = 0;
    let cashRevenue = 0;
    let qrisRevenue = 0;

    for (const order of filteredOrders) {
      const isCompleted = order.status === 'Selesai' || order.status === 'Delivered';
      const isCancelled = order.status === 'Dibatalkan' || order.status === 'Cancelled';
      const amount = Number(order.amount || 0);

      if (isCompleted) {
        completedCount++;
        totalRevenue += amount;
        const method = (order.paymentMethod || '').toUpperCase();
        if (method === 'TUNAI' || method === 'CASH') {
          cashRevenue += amount;
        } else {
          qrisRevenue += amount;
        }
      } else if (isCancelled) {
        cancelledCount++;
      }
    }

    return {
      totalRevenue,
      completedCount,
      cancelledCount,
      cashRevenue,
      qrisRevenue,
      totalOrders: filteredOrders.length,
    };
  }, [filteredOrders, viewScope]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const indexOfLastOrder = validCurrentPage * itemsPerPage;
  const indexOfFirstOrder = indexOfLastOrder - itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);

  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  }, [totalPages]);

  const getPageNumbers = useCallback(() => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (validCurrentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (validCurrentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', validCurrentPage - 1, validCurrentPage, validCurrentPage + 1, '...', totalPages);
      }
    }
    return pages;
  }, [totalPages, validCurrentPage]);

  // Export CSV Handler
  const handleExportCSV = useCallback(() => {
    if (!filteredOrders || filteredOrders.length === 0) {
      toast.warn('Tidak ada data pesanan untuk diexport.');
      return;
    }

    try {
      const headers = [
        'No', 'No. Faktur', 'Tanggal & Waktu', 'Nama Pemesan', 'Meja',
        'Status Pesanan', 'Metode Pembayaran', 'Status Pembayaran', 'Daftar Menu & Qty', 'Total Porsi', 'Total Akhir (Rp)', 'Catatan',
      ];

      const rows = filteredOrders.map((order, idx) => {
        const itemsStr = order.items && order.items.length > 0
          ? order.items.map((i) => `${i.name} (${i.quantity}x)`).join('; ')
          : '-';
        const totalItemsQty = order.items && order.items.length > 0
          ? order.items.reduce((s, i) => s + (i.quantity || 0), 0)
          : 0;

        const rawDate = order.date || order.createdAt;
        const formattedDate = rawDate ? new Date(rawDate).toLocaleString('id-ID') : '-';

        return [
          idx + 1,
          order.invoiceNumber || `#${order._id.slice(-6).toUpperCase()}`,
          formattedDate,
          order.userName || 'Pelanggan',
          order.tableNumber ? `Meja ${order.tableNumber}` : 'Takeaway',
          order.status,
          order.paymentMethod || 'Tunai',
          order.payment ? 'Lunas' : 'Belum Bayar',
          itemsStr,
          totalItemsQty,
          order.amount || 0,
          order.note || '-',
        ].map(escapeCsv).join(',');
      });

      const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const timeStr = now.toTimeString().slice(0, 5).replace(':', '');
      link.href = url;
      link.setAttribute('download', `Laporan_Pesanan_${viewScope.toUpperCase()}_${dateStr}_${timeStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Berhasil mengexport ${filteredOrders.length} data pesanan ke Excel/CSV!`);
    } catch (err) {
      console.error('Export CSV Error:', err);
      toast.error('Gagal mengexport laporan');
    }
  }, [filteredOrders, viewScope]);

  return {
    viewScope,
    setViewScope,
    activeSubFilter,
    setActiveSubFilter,
    historySubFilter,
    setHistorySubFilter,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    searchQuery,
    setSearchQuery,
    isTodayActive,
    handleToggleToday,
    handleStartDateChange,
    handleEndDateChange,
    handleClearDates,
    handleResetFilters,
    sortConfig,
    handleSort,
    counts,
    filteredOrders,
    currentOrders,
    currentPage: validCurrentPage,
    validCurrentPage,
    setCurrentPage,
    totalPages,
    indexOfFirstOrder,
    indexOfLastOrder,
    itemsPerPage,
    setItemsPerPage,
    handlePageChange,
    getPageNumbers,
    historySummary,
    handleExportCSV,
  };
};

export default useOrderFilters;
