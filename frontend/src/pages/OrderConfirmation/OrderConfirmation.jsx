import React, { useEffect, useState, useContext, useCallback } from "react";
import { StoreContext } from "../../context/StoreContext";
import { useSocket } from "../../context/SocketContext";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import "./OrderConfirmation.css";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatOrderDateTime = (dateString) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Tanggal tidak valid";
  const dateFormatted = date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const timeFormatted = date
    .toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    .replace(".", ":");
  return `${dateFormatted}, ${timeFormatted} WIB`;
};

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { url, token } = useContext(StoreContext);
  const { socket } = useSocket();

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      const response = await axios.get(`${url}/api/order/${orderId}`);
      const fetchedOrder = response.data?.order;
      if (fetchedOrder) {
        setOrder(fetchedOrder);
        if (
          fetchedOrder.status === "Diproses" ||
          fetchedOrder.status === "Disajikan" ||
          fetchedOrder.status === "Selesai"
        ) {
          navigate("/myorders");
        }
      }
    } catch (err) {
      console.error("Failed to load order details:", err);
      setError("Gagal memuat informasi pesanan");
    } finally {
      setLoading(false);
    }
  }, [orderId, url, navigate]);

  useEffect(() => {
    // 1. Initial single fetch
    fetchOrder();

    // 2. Real-time push via Socket.IO
    if (socket) {
      const handleStatusUpdated = (payload) => {
        if (payload && String(payload.orderId) === String(orderId)) {
          setOrder((prev) =>
            prev
              ? {
                  ...prev,
                  status: payload.status,
                  payment:
                    payload.payment !== undefined
                      ? payload.payment
                      : prev.payment,
                }
              : prev
          );

          if (
            payload.status === "Diproses" ||
            payload.status === "Disajikan" ||
            payload.status === "Selesai"
          ) {
            navigate("/myorders");
          }
        }
      };

      const handlePaymentUpdated = (payload) => {
        if (payload && String(payload.orderId) === String(orderId)) {
          setOrder((prev) =>
            prev
              ? {
                  ...prev,
                  payment: payload.payment,
                  paymentMethod: payload.paymentMethod || prev.paymentMethod,
                }
              : prev
          );
          // If payment was marked complete, re-fetch to capture newly updated fields
          if (payload.payment) {
            fetchOrder();
          }
        }
      };

      socket.on("order:status_updated", handleStatusUpdated);
      socket.on("order:payment_updated", handlePaymentUpdated);
      socket.on("connect", fetchOrder);

      // 3. Fallback resilience: Re-sync on mobile lock-screen wake / tab focus
      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible") {
          fetchOrder();
        }
      };
      window.addEventListener("focus", fetchOrder);
      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        socket.off("order:status_updated", handleStatusUpdated);
        socket.off("order:payment_updated", handlePaymentUpdated);
        socket.off("connect", fetchOrder);
        window.removeEventListener("focus", fetchOrder);
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
      };
    }
  }, [socket, orderId, fetchOrder, navigate]);

  const handleCancelOrder = async () => {
    // Show confirmation dialog
    const result = await Swal.fire({
      title: "Batalkan Pesanan?",
      text: "Apakah Anda yakin ingin membatalkan pesanan ini?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, batalkan",
      cancelButtonText: "Tidak",
      customClass: {
        popup: "small-swal-popup",
        title: "small-swal-title",
        content: "small-swal-content",
      },
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${url}/api/order/delete/${orderId}`, {
          headers: { token },
        });
        Swal.fire({
          title: "Dibatalkan!",
          text: "Pesanan berhasil dibatalkan.",
          icon: "success",
          confirmButtonColor: "#3085d6",
          customClass: {
            popup: "small-swal-popup",
            title: "small-swal-title",
            content: "small-swal-content",
          },
        });
        navigate("/");
      } catch (error) {
        console.error("Error deleting order:", error);
        Swal.fire("Gagal", "Gagal membatalkan pesanan. Silakan coba lagi.", "error");
      }
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-confirmation"></div>
      </div>
    );
  }
  if (error) return <p>{error}</p>;

  const subtotal = (order?.items || []).reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0
  );

  return (
    <div className="order-confirmation-container">
      {order && (
        <>
          {/* Top Status & Instructions */}
          <div className="confirmation-header-card">
            <h2 className="confirmation-title">Konfirmasi Pembayaran</h2>
            <p className="confirmation-desc">
              Silakan ke kasir untuk menyelesaikan pembayaran.
            </p>
          </div>

          {/* Main E-Receipt Ticket Card */}
          <div className="confirmation-ticket">
            {/* Clean Receipt Meta Grid - Consistent with Detail Pesanan */}
            <div className="receipt-meta-grid">
              <div className="meta-item">
                <span className="meta-label">Nomor Faktur</span>
                <span className="meta-val invoice-val">{order.invoiceNumber}</span>
              </div>

              <div className="meta-item meta-item-right">
                <span className="meta-label">Nomor Meja</span>
                <span className="receipt-table-pill">Meja {order.tableNumber}</span>
              </div>

              <div className="meta-item">
                <span className="meta-label">Waktu Pemesanan</span>
                <span className="meta-val">{formatOrderDateTime(order.date)}</span>
              </div>

              <div className="meta-item meta-item-right">
                <span className="meta-label">Metode Pembayaran</span>
                <span className="meta-val">
                  {order.paymentMethod || "Tunai"}
                </span>
              </div>

              {order.note && (
                <div className="meta-item meta-item-full">
                  <span className="meta-label">Catatan Pesanan</span>
                  <span className="meta-val note-val">"{order.note}"</span>
                </div>
              )}
            </div>

            {/* Tear Line Separator */}
            <div className="ticket-tear-line"></div>

            {/* Line Items Breakdown */}
            <div className="ticket-items-section">
              <div className="ticket-items-header">
                <span>Daftar Menu ({order.items?.length || 0})</span>
                <span>Harga</span>
              </div>
              <div className="ticket-items-list">
                {order.items?.map((item, index) => (
                  <div key={index} className="ticket-item-row">
                    <div className="ticket-item-info">
                      <span className="ticket-item-name">{item.name}</span>
                      <span className="ticket-item-calc">
                        {item.quantity} × {formatCurrency(item.price)}
                      </span>
                    </div>
                    <strong className="ticket-item-total">
                      {formatCurrency((item.quantity || 1) * (item.price || 0))}
                    </strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Tear Line Separator */}
            <div className="ticket-tear-line"></div>

            {/* Financial Summary */}
            <div className="ticket-pricing-breakdown">
              <div className="pricing-row">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>

              {order.discount > 0 && (
                <div className="pricing-row discount">
                  <span>Voucher Diskon</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}

              <div className="pricing-row total-row">
                <span className="total-label">Total Pembayaran</span>
                <strong className="total-val">
                  {formatCurrency(order.amount)}
                </strong>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="confirmation-actions">
            <button
              type="button"
              className="btn-view-history"
              onClick={() => navigate("/myorders")}
            >
              Lihat Riwayat Pesanan
            </button>
            <button
              type="button"
              className="btn-cancel-ghost"
              onClick={handleCancelOrder}
            >
              Batalkan Pesanan
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default OrderConfirmation;
