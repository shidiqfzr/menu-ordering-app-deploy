import React from "react";
import "./OrderDetailModal.css";
import { IoCloseOutline, IoTimeOutline } from "react-icons/io5";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount || 0);
};

const OrderDetailModal = ({ order, onClose }) => {
  if (!order) return null;

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

  const isPending = order.status === "Pending";
  const subtotal = (order.items || []).reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* 1. Modal Fixed Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <h3 className="modal-title">Detail Pesanan</h3>
            <span className="invoice-code-badge">{order.invoiceNumber}</span>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Tutup"
          >
            <IoCloseOutline />
          </button>
        </div>

        {/* 2. Modal Scrollable Body */}
        <div className="modal-body">
          {/* Pending Cash Payment Notice */}
          {isPending && (
            <div className="modal-pending-alert">
              <IoTimeOutline className="pending-alert-icon" />
              <div className="pending-alert-text">
                <strong>Menunggu Pembayaran di Kasir</strong>
                <p>
                  Silakan ke kasir untuk menyelesaikan pembayaran.
                </p>
              </div>
            </div>
          )}

          {/* Clean Receipt Meta Grid */}
          <div className="receipt-meta-grid">
            <div className="meta-item">
              <span className="meta-label">Status</span>
              <span className={`status-badge status-${order.status.toLowerCase()}`}>
                {isPending ? "Menunggu Pembayaran" : order.status}
              </span>
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
              <span className="meta-val payment-badge">
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

          {/* Hairline Divider */}
          <div className="receipt-divider"></div>

          {/* Line Items Breakdown (E-Receipt Architecture) */}
          <div className="receipt-items-section">
            <div className="receipt-items-header">
              <span>Daftar Menu ({order.items?.length || 0})</span>
              <span>Harga</span>
            </div>
            <div className="receipt-items-list">
              {order.items?.map((item, index) => (
                <div key={index} className="receipt-item-row">
                  <div className="receipt-item-info">
                    <span className="receipt-item-name">{item.name}</span>
                    <span className="receipt-item-calc">
                      {item.quantity} × {formatCurrency(item.price)}
                    </span>
                  </div>
                  <strong className="receipt-item-total">
                    {formatCurrency(item.quantity * item.price)}
                  </strong>
                </div>
              ))}
            </div>
          </div>

          {/* Hairline Divider */}
          <div className="receipt-divider"></div>

          {/* Payment Breakdown */}
          <div className="receipt-pricing-breakdown">
            <div className="pricing-row">
              <span className="pricing-label">Subtotal</span>
              <span className="pricing-val">{formatCurrency(subtotal)}</span>
            </div>

            {order.discount > 0 && (
              <div className="pricing-row discount">
                <span className="pricing-label">Voucher Diskon</span>
                <span className="pricing-val">
                  -{formatCurrency(order.discount)}
                </span>
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

        {/* 3. Modal Fixed Footer Actions */}
        <div className="modal-footer">
          <button type="button" className="btn-modal-close" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;