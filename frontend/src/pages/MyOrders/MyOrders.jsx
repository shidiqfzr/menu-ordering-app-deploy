import React, { useContext, useEffect, useState } from "react";
import "./MyOrders.css";
import { StoreContext } from "../../context/StoreContext";
import { useSocket } from "../../context/SocketContext";
import axios from "axios";
import { assets } from "../../assets/assets";
import OrderDetailModal from "../../components/OrderDetailModal/OrderDetailModal";
import Swal from "sweetalert2";
import {
  IoCalendarOutline,
  IoChevronDown,
  IoChevronUp,
  IoCloseCircleOutline,
  IoSearchOutline,
} from "react-icons/io5";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatOrderDate = (dateString) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  const now = new Date();
  const isCurrentYear = date.getFullYear() === now.getFullYear();

  const dateFormatted = date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    ...(isCurrentYear ? {} : { year: "numeric" }),
  });
  const timeFormatted = date
    .toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(".", ":");

  return `${dateFormatted}, ${timeFormatted}`;
};

const getItemsSummary = (items = []) => {
  if (!items || items.length === 0) return "Tidak ada menu";
  const names = items.map((it) => `${it.name} (${it.quantity}x)`);
  if (names.length <= 2) {
    return names.join(", ");
  }
  return `${names.slice(0, 2).join(", ")} +${names.length - 2} lainnya`;
};

const getTotalPortions = (items = []) => {
  return items.reduce((sum, it) => sum + (it.quantity || 1), 0);
};

const getFirstItemImage = (items = []) => {
  if (items && items.length > 0 && items[0].image) {
    return items[0].image;
  }
  return assets.order_icon;
};

// Function to determine priority of statuses (unpaid/pending at the top)
const getStatusPriority = (status) => {
  const priority = {
    Pending: 1, // Highest priority: needs payment action at cashier
    Diproses: 2,
    Disajikan: 3,
    Selesai: 4,
  };
  return priority[status] || 99;
};

const BATCH_SIZE = 10;

const MyOrders = () => {
  const { url, token } = useContext(StoreContext);
  const { socket } = useSocket();
  const [data, setData] = useState([]);
  const [activeTab, setActiveTab] = useState("active"); // 'active' | 'completed'
  const [initialTabSet, setInitialTabSet] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);

  // Fetch and sort user orders by status priority and date
  const fetchOrders = async () => {
    try {
      const response = await axios.post(
        `${url}/api/order/userorders`,
        {},
        { headers: { token } }
      );

      const orders = response.data.data || [];

      // Sort orders first by status priority, then by date (newest first)
      const sortedData = orders.sort((a, b) => {
        const statusDiff = getStatusPriority(a.status) - getStatusPriority(b.status);
        if (statusDiff === 0) {
          return new Date(b.date) - new Date(a.date);
        }
        return statusDiff;
      });

      setData(sortedData);

      // Smart Default: If customer has ongoing active orders, show 'Berlangsung', else 'Selesai'
      if (!initialTabSet) {
        const hasActive = sortedData.some((o) =>
          ["Pending", "Diproses", "Disajikan"].includes(o.status)
        );
        setActiveTab(hasActive ? "active" : "completed");
        setInitialTabSet(true);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  // Cancel pending order (unpaid cash order)
  const handleCancelOrder = async (order) => {
    const result = await Swal.fire({
      title: "Batalkan Pesanan?",
      text: "Pesanan ini belum dibayar. Apakah Anda yakin ingin membatalkan pesanan ini?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Batalkan",
      cancelButtonText: "Kembali",
      customClass: {
        popup: "small-swal-popup",
        title: "small-swal-title",
        content: "small-swal-content",
      },
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${url}/api/order/delete/${order._id}`, {
          headers: { token },
        });
        setData((prev) => prev.filter((o) => o._id !== order._id));
        Swal.fire({
          title: "Pesanan Dibatalkan",
          text: "Pesanan Anda berhasil dibatalkan.",
          icon: "success",
          confirmButtonText: "OK",
          customClass: {
            popup: "small-swal-popup",
            title: "small-swal-title",
            content: "small-swal-content",
          },
        });
      } catch (error) {
        console.error("Error cancelling order:", error);
        Swal.fire({
          title: "Gagal",
          text: "Gagal membatalkan pesanan. Silakan coba lagi.",
          icon: "error",
          customClass: {
            popup: "small-swal-popup",
            title: "small-swal-title",
            content: "small-swal-content",
          },
        });
      }
    }
  };

  const openOrderDetail = (order) => {
    setSelectedOrder(order);
  };

  const closeOrderDetail = () => {
    setSelectedOrder(null);
  };

  const resetDateFilter = () => {
    setStartDate("");
    setEndDate("");
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

  // Real-time synchronization via Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleStatusUpdated = (payload) => {
      if (!payload?.orderId) return;

      setData((prevOrders) => {
        const exists = prevOrders.some((o) => o._id === payload.orderId);
        if (!exists) return prevOrders;
        return prevOrders.map((o) =>
          o._id === payload.orderId
            ? {
                ...o,
                status: payload.status,
                payment:
                  payload.payment !== undefined ? payload.payment : o.payment,
                tableNumber:
                  payload.tableNumber !== undefined
                    ? payload.tableNumber
                    : o.tableNumber,
              }
            : o
        );
      });

      setSelectedOrder((prevSelected) => {
        if (prevSelected && prevSelected._id === payload.orderId) {
          return {
            ...prevSelected,
            status: payload.status,
            payment:
              payload.payment !== undefined
                ? payload.payment
                : prevSelected.payment,
            tableNumber:
              payload.tableNumber !== undefined
                ? payload.tableNumber
                : prevSelected.tableNumber,
          };
        }
        return prevSelected;
      });
    };

    const handlePaymentUpdated = (payload) => {
      if (!payload?.orderId) return;

      setData((prevOrders) =>
        prevOrders.map((o) =>
          o._id === payload.orderId
            ? {
                ...o,
                payment: payload.payment,
                paymentMethod: payload.paymentMethod || o.paymentMethod,
              }
            : o
        )
      );

      setSelectedOrder((prevSelected) => {
        if (prevSelected && prevSelected._id === payload.orderId) {
          return {
            ...prevSelected,
            payment: payload.payment,
            paymentMethod: payload.paymentMethod || prevSelected.paymentMethod,
          };
        }
        return prevSelected;
      });
    };

    socket.on("order:status_updated", handleStatusUpdated);
    socket.on("order:payment_updated", handlePaymentUpdated);

    return () => {
      socket.off("order:status_updated", handleStatusUpdated);
      socket.off("order:payment_updated", handlePaymentUpdated);
    };
  }, [socket]);

  // Reset pagination batch on filter or tab change
  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [activeTab, startDate, endDate, searchQuery]);

  // Compute active order count for live tab badge
  const activeCount = data.filter((o) =>
    ["Pending", "Diproses", "Disajikan"].includes(o.status)
  ).length;

  // Filter orders according to selected tab ('active' or 'completed'), date range, and search query
  const displayedOrders = data.filter((order) => {
    // 1. Tab filter
    if (activeTab === "active") {
      if (!["Pending", "Diproses", "Disajikan"].includes(order.status)) {
        return false;
      }
    } else {
      if (order.status !== "Selesai") {
        return false;
      }
    }

    // 2. Date filter
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      const orderDate = new Date(order.date);
      if (orderDate < start || orderDate > end) {
        return false;
      }
    }

    // 3. Search query filter (menu name, invoice number, or table)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const matchesInvoice = order.invoiceNumber?.toLowerCase().includes(query);
      const matchesTable = `meja ${order.tableNumber}`.toLowerCase().includes(query);
      const matchesItem = (order.items || []).some((item) =>
        item.name?.toLowerCase().includes(query)
      );
      if (!matchesInvoice && !matchesTable && !matchesItem) {
        return false;
      }
    }

    return true;
  });

  // Slice orders for batch pagination (show all in 'active' tab, batch in 'completed')
  const visibleOrders =
    activeTab === "active"
      ? displayedOrders
      : displayedOrders.slice(0, visibleCount);
  const hasMore =
    activeTab !== "active" && displayedOrders.length > visibleCount;

  return (
    <div className="my-orders">
      {/* Clean Header */}
      <div className="my-orders-header">
        <h2 className="my-orders-title">Riwayat Pesanan</h2>
        <p className="my-orders-subtitle">Pantau status dan detail pesanan Anda</p>
      </div>

      {/* 2-Segment Status Tabs (Industry Gold Standard: Berlangsung & Selesai) */}
      <div className="order-tabs">
        <button
          type="button"
          className={`order-tab ${activeTab === "active" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("active");
            fetchOrders();
          }}
        >
          Berlangsung
          {activeCount > 0 && (
            <span className="tab-pill-count has-active">{activeCount}</span>
          )}
        </button>
        <button
          type="button"
          className={`order-tab ${activeTab === "completed" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("completed");
            fetchOrders();
          }}
        >
          Selesai
        </button>
      </div>

      {/* Unified Search & Date Filter Toolbar */}
      <div className="order-toolbar-row">
        <div className="order-search-bar">
          <IoSearchOutline className="search-bar-icon" />
          <input
            type="text"
            className="search-bar-input"
            placeholder="Cari menu, nomor meja, atau faktur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="search-bar-clear"
              onClick={() => setSearchQuery("")}
              title="Hapus pencarian"
            >
              <IoCloseCircleOutline />
            </button>
          )}
        </div>

        <button
          type="button"
          className={`btn-filter-toggle ${showDateFilter || (startDate && endDate) ? "active" : ""}`}
          onClick={() => setShowDateFilter(!showDateFilter)}
          title="Filter Berdasarkan Tanggal"
        >
          <IoCalendarOutline className="filter-toggle-icon" />
          <span className="filter-toggle-text">Filter</span>
          {startDate && endDate && <span className="filter-active-dot"></span>}
          {showDateFilter ? <IoChevronUp /> : <IoChevronDown />}
        </button>
      </div>

      {/* Expandable Date Range Filter */}
      {showDateFilter && (
        <div className="date-filter-panel">
          <div className="date-inputs-row">
            <div className="date-field">
              <label htmlFor="startDate">Dari Tanggal</label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="date-field">
              <label htmlFor="endDate">Sampai Tanggal</label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          {(startDate || endDate) && (
            <button
              type="button"
              className="btn-reset-date"
              onClick={resetDateFilter}
            >
              <IoCloseCircleOutline /> Reset Filter
            </button>
          )}
        </div>
      )}

      {/* Compact Orders List */}
      <div className="orders-container">
        {displayedOrders.length === 0 ? (
          <div className="no-orders-card">
            <img src={assets.empty_cart} alt="Tidak ada pesanan" className="no-orders-img" />
            <h3>Tidak Ada Pesanan</h3>
            <p>
              {searchQuery.trim()
                ? `Tidak ditemukan pesanan yang sesuai dengan "${searchQuery}".`
                : activeTab === "active"
                ? "Tidak ada pesanan yang sedang berlangsung saat ini."
                : "Belum ada riwayat pesanan yang selesai."}
            </p>
          </div>
        ) : (
          visibleOrders.map((order, index) => {
            const isPending = order.status === "Pending";
            const portions = getTotalPortions(order.items);
            const foodSummary = getItemsSummary(order.items);

            return (
              <div
                key={order._id || index}
                className={`compact-order-card ${isPending ? "is-pending" : ""}`}
                onClick={() => openOrderDetail(order)}
              >
                {/* 1. Header: Table + Date + Status */}
                <div className="card-top-row">
                  <div className="card-meta">
                    <span className="card-table-pill">Meja {order.tableNumber}</span>
                    <span className="meta-bullet">•</span>
                    <span className="card-date-text">{formatOrderDate(order.date)}</span>
                  </div>

                  <span className={`status-badge status-${order.status.toLowerCase()}`}>
                    {isPending ? "Menunggu Pembayaran" : order.status}
                  </span>
                </div>

                {/* 2. Middle: Food Preview & Dish Names */}
                <div className="card-body-row">
                  <div className="card-thumb-wrap">
                    <img
                      src={getFirstItemImage(order.items)}
                      alt="Menu"
                      className="card-thumb-img"
                    />
                  </div>
                  <div className="card-dish-info">
                    <p className="card-dish-names" title={foodSummary}>
                      {foodSummary}
                    </p>
                    <span className="card-invoice-code">
                      {order.invoiceNumber}
                    </span>
                  </div>
                </div>

                {/* 3. Footer: Total Price + Action Buttons */}
                <div className="card-bottom-row">
                  <div className="card-price-info">
                    <span className="card-price-label">Total Pembayaran</span>
                    <div className="card-price-value-wrap">
                      <strong className="card-price-amount">{formatCurrency(order.amount)}</strong>
                      <span className="card-portions-count">({portions} porsi)</span>
                    </div>
                  </div>

                  <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                    {isPending && (
                      <button
                        type="button"
                        className="btn-card-cancel"
                        onClick={() => handleCancelOrder(order)}
                      >
                        Batalkan
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-card-detail"
                      onClick={() => openOrderDetail(order)}
                    >
                      Detail
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Incremental Load More Section */}
      {hasMore && (
        <div className="load-more-section">
          <button
            type="button"
            className="btn-load-more"
            onClick={() => setVisibleCount((prev) => prev + BATCH_SIZE)}
          >
            Muat Lebih Banyak
          </button>
          <span className="load-more-counter">
            Menampilkan {visibleOrders.length} dari {displayedOrders.length} pesanan
          </span>
        </div>
      )}

      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={closeOrderDetail} />
      )}
    </div>
  );
};

export default MyOrders;
