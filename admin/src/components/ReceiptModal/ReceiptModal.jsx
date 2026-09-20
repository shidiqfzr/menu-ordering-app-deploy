import React, { useState } from 'react';
import { MdPrint, MdClose, MdReceiptLong, MdRestaurant } from 'react-icons/md';
import './ReceiptModal.css';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount || 0);
};

const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Tanggal tidak valid';
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ReceiptModal = ({ order, onClose }) => {
  const [receiptType, setReceiptType] = useState('customer'); // 'customer' | 'kitchen'

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = order.discount || 0;
  const total = order.amount || (subtotal - discount);

  return (
    <div className="receipt-modal-backdrop" onClick={onClose}>
      <div className="receipt-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header Controls (Hidden during print) */}
        <div className="receipt-modal-header no-print">
          <div className="receipt-type-selector">
            <button
              className={`type-tab-btn ${receiptType === 'customer' ? 'active' : ''}`}
              onClick={() => setReceiptType('customer')}
            >
              <MdReceiptLong className="tab-icon" />
              <span>Struk Pelanggan</span>
            </button>
            <button
              className={`type-tab-btn ${receiptType === 'kitchen' ? 'active' : ''}`}
              onClick={() => setReceiptType('kitchen')}
            >
              <MdRestaurant className="tab-icon" />
              <span>Tiket Dapur (KOT)</span>
            </button>
          </div>

          <button className="receipt-close-btn" onClick={onClose} title="Tutup (Esc)">
            <MdClose />
          </button>
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="receipt-paper-wrapper">
          <div className="receipt-paper">
            {receiptType === 'customer' ? (
              /* ── Struk Kasir / Pelanggan ── */
              <div className="receipt-content customer-receipt">
                <div className="receipt-header">
                  <h2 className="cafe-name">BUJANG CAFE</h2>
                  <p className="cafe-sub">Food & Beverage Services</p>
                  <p className="cafe-info">Sistem Pemesanan Menu Digital</p>
                  <div className="dashed-divider"></div>
                </div>

                <div className="receipt-meta">
                  <div className="meta-row">
                    <span>No. Faktur:</span>
                    <b>{order.invoiceNumber || `Order #${order._id.slice(-6).toUpperCase()}`}</b>
                  </div>
                  <div className="meta-row">
                    <span>Pemesan:</span>
                    <b>{order.userName || 'Pelanggan'}</b>
                  </div>
                  <div className="meta-row">
                    <span>Tanggal:</span>
                    <span>{formatDateTime(order.date || order.createdAt)}</span>
                  </div>
                  <div className="meta-row">
                    <span>Meja:</span>
                    <b>Meja {order.tableNumber || '-'}</b>
                  </div>
                  <div className="meta-row">
                    <span>Pembayaran:</span>
                    <span>{order.paymentMethod || 'Online'} ({order.payment ? 'LUNAS' : 'BELUM LUNAS'})</span>
                  </div>
                </div>

                <div className="dashed-divider"></div>

                {/* Items List */}
                <div className="receipt-items-table">
                  <div className="items-header-row">
                    <span className="col-item">Item</span>
                    <span className="col-qty">Qty</span>
                    <span className="col-price">Harga</span>
                    <span className="col-total">Total</span>
                  </div>
                  <div className="solid-divider-thin"></div>

                  {order.items.map((item, idx) => (
                    <div key={idx} className="item-row">
                      <div className="item-info">
                        <span className="item-name">{item.name}</span>
                      </div>
                      <span className="item-qty">{item.quantity}x</span>
                      <span className="item-price">{Number(item.price).toLocaleString('id-ID')}</span>
                      <span className="item-total">{Number(item.price * item.quantity).toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>

                <div className="dashed-divider"></div>

                {/* Totals */}
                <div className="receipt-totals">
                  <div className="total-row">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="total-row discount">
                      <span>Diskon Voucher:</span>
                      <span>- {formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="solid-divider-thin"></div>
                  <div className="total-row grand-total">
                    <span>TOTAL:</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                  {order.payment && (order.cashReceived > 0 || order.paymentMethod?.toLowerCase().includes('tunai') || order.paymentMethod?.toLowerCase().includes('cash')) && (
                    <>
                      <div className="solid-divider-thin"></div>
                      <div className="total-row cash-received-row">
                        <span>Tunai Diterima:</span>
                        <span>{formatCurrency(order.cashReceived || total)}</span>
                      </div>
                      <div className="total-row cash-change-row">
                        <span>Kembalian:</span>
                        <span className="cash-change-val">
                          {formatCurrency(order.change || (order.cashReceived ? Math.max(0, order.cashReceived - total) : 0))}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {order.note && order.note !== '-' && (
                  <div className="receipt-note-box">
                    <span>Catatan:</span>
                    <p>{order.note}</p>
                  </div>
                )}

                <div className="dashed-divider"></div>

                <div className="receipt-footer">
                  <p className="footer-title">Status: {order.payment ? 'SUDAH DIBAYAR (LUNAS)' : 'BELUM DIBAYAR'}</p>
                  <p>Terima kasih atas kunjungan Anda!</p>
                  <p>Selamat menikmati hidangan kami 😊</p>
                </div>
              </div>
            ) : (
              /* ── Tiket Dapur (KOT / Kitchen Ticket) ── */
              <div className="receipt-content kitchen-receipt">
                <div className="kitchen-header">
                  <h2 className="kot-title">*** TIKET DAPUR (KOT) ***</h2>
                  <div className="kitchen-table-banner">
                    MEJA {order.tableNumber || '-'}
                  </div>
                  <p className="kot-meta">Pemesan: <b>{order.userName || 'Pelanggan'}</b></p>
                  <p className="kot-meta">Faktur: <b>{order.invoiceNumber || `Order #${order._id.slice(-6).toUpperCase()}`}</b></p>
                  <p className="kot-meta">Waktu Masuk: {formatDateTime(order.date || order.createdAt)}</p>
                  <div className="dashed-divider"></div>
                </div>

                <div className="kitchen-items-list">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="kitchen-item-row">
                      <span className="kot-qty">{item.quantity}x</span>
                      <div className="kot-name-wrapper">
                        <span className="kot-name">{item.name}</span>
                        {item.category && <span className="kot-category">[{item.category}]</span>}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="dashed-divider"></div>

                {order.note && order.note !== '-' && (
                  <div className="receipt-note-box">
                    <span>Catatan:</span>
                    <p>{order.note}</p>
                  </div>
                )}

                <div className="dashed-divider"></div>

                <div className="kitchen-footer">
                  <p>Total {order.items.reduce((s, i) => s + i.quantity, 0)} porsi pesanan</p>
                  <p>Harap disajikan hangat dan tepat waktu</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Tip (Hidden during print) */}
        <div className="receipt-modal-footer no-print">
          <span>Tips: Gunakan printer thermal 58mm / 80mm atau simpan sebagai file PDF.</span>
          <button className="receipt-print-btn" onClick={handlePrint}>
            <MdPrint />
            <span>Cetak Struk</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
