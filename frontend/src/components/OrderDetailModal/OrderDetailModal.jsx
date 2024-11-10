import React from 'react';
import './OrderDetailModal.css';

const OrderDetailModal = ({ order, onClose }) => {
  const formatOrderDateTime = (dateString) => {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const dateFormatted = date.toLocaleDateString('id-ID');
      const timeFormatted = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      return `${dateFormatted} ${timeFormatted}`;
    } else {
      return 'Tanggal tidak valid';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-icon" onClick={onClose}>&times;</button>
        <h3>Detail Pesanan</h3>
        <p><strong>Nomor Faktur:</strong> {order.invoiceNumber}</p>
        <p><strong>Tanggal & Waktu:</strong> {formatOrderDateTime(order.date)}</p>
        <p><strong>Metode Pembayaran:</strong> {order.paymentMethod}</p>
        <p><strong>Nomor Meja:</strong> {order.tableNumber}</p>
        <p><strong>Catatan Tambahan:</strong> {order.note || "-"}</p>
        <p><strong>Status:</strong> <span className={`status ${order.status.toLowerCase()}`}>{order.status}</span></p>
        
        <h4>Item Pesanan</h4>
        <ul className="item-list">
          {order.items.map((item, index) => (
            <li key={index} className="item">
              <span className="item-name">{item.name}</span>
              <span className="item-price">{formatCurrency(item.price)}</span>
              <span className="item-quantity"> x {item.quantity}</span>
              <span className="item-total"> = {formatCurrency(item.quantity * item.price)}</span>
            </li>
          ))}
          <hr />
        </ul>
        <p className="voucher-discount"><strong>Voucher Diskon:</strong> - {formatCurrency(order.discount)}</p>
        <p className="total-price"><strong>Total Harga:</strong>{formatCurrency(order.amount)}</p>
      </div>
    </div>
  );
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

export default OrderDetailModal;