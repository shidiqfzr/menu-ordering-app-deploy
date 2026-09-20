import React, { useState, useEffect, useMemo, useRef } from 'react';
import { toast } from 'react-toastify';
import { 
  MdClose, 
  MdPayments, 
  MdCheckCircle, 
  MdReceiptLong, 
  MdWarningAmber,
  MdCalculate
} from 'react-icons/md';
import api from '../../services/api';
import './PaymentModal.css';

const formatCurrency = (val) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(val || 0);
};

const PaymentModal = ({ order, onClose, onPaymentSuccess }) => {
  if (!order) return null;

  const total = Number(order.amount || 0);
  const [cashInput, setCashInput] = useState('');
  const [autoPrintReceipt, setAutoPrintReceipt] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  // Focus cash input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Generate smart denomination suggestions based on total
  const smartSuggestions = useMemo(() => {
    const suggestions = [];
    
    // 1. Exact amount
    suggestions.push({ label: 'Uang Pas', amount: total });

    // 2. Standard Indonesian Banknotes: always include Rp 20.000, Rp 50.000, Rp 100.000
    const standardNotes = [20000, 50000, 100000];
    if (total < 10000) {
      standardNotes.unshift(10000);
    }

    standardNotes.forEach((note) => {
      if (!suggestions.some(s => s.amount === note)) {
        suggestions.push({ label: formatCurrency(note), amount: note });
      }
    });

    // 3. If total is higher than 100k, suggest next round 50k / 100k steps
    if (total > 100000) {
      const nextRound = Math.ceil(total / 50000) * 50000;
      if (!suggestions.some(s => s.amount === nextRound)) {
        suggestions.push({ label: formatCurrency(nextRound), amount: nextRound });
      }
    }

    return suggestions.slice(0, 5); // Up to 5 clean suggestions
  }, [total]);

  // Numerical cash received from user input
  const cashReceived = useMemo(() => {
    const num = parseInt(cashInput.replace(/\D/g, ''), 10);
    return isNaN(num) ? 0 : num;
  }, [cashInput]);

  const change = Math.max(0, cashReceived - total);
  const shortage = Math.max(0, total - cashReceived);
  const isSufficient = cashReceived >= total;

  const handleSelectSuggestion = (amount) => {
    setCashInput(amount.toLocaleString('id-ID'));
  };

  const handleInputChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setCashInput('');
      return;
    }
    const num = parseInt(raw, 10);
    setCashInput(num.toLocaleString('id-ID'));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isSufficient) {
      toast.warn(`Uang tunai kurang ${formatCurrency(shortage)}`);
      return;
    }

    setSubmitting(true);
    const isPendingOrder = order?.status === 'Pending' || order?.status === 'Menunggu';
    const targetStatus = isPendingOrder ? 'Diproses' : (order?.status || 'Diproses');

    try {
      const response = await api.post('/api/order/payment', {
        orderId: order._id,
        payment: true,
        cashReceived: cashReceived,
        change: change,
        paymentMethod: 'Tunai',
        nextStatus: targetStatus
      });

      if (response.data.success) {
        toast.success(
          isPendingOrder
            ? `Pembayaran Tunai Lunas! Pesanan Meja ${order.tableNumber || '-'} diteruskan ke Dapur untuk dimasak.`
            : `Pembayaran Lunas! Meja ${order.tableNumber || '-'}.`
        );
        const updatedOrder = {
          ...order,
          payment: true,
          status: targetStatus,
          cashReceived: cashReceived,
          change: change,
          paymentMethod: 'Tunai'
        };
        onPaymentSuccess(updatedOrder, autoPrintReceipt);
        onClose();
      } else {
        toast.error(response.data.message || 'Gagal memperbarui pembayaran');
      }
    } catch (error) {
      console.error(error);
      toast.error('Terjadi kesalahan saat memproses pembayaran');
    } finally {
      setSubmitting(false);
    }
  };

  const isPendingOrder = order?.status === 'Pending' || order?.status === 'Menunggu';

  return (
    <div className="payment-modal-backdrop" onClick={onClose}>
      <div className="payment-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="payment-modal-header">
          <div className="header-meta-info">
            <div className="header-title-row">
              <MdPayments className="header-modal-icon" />
              <h3>
                {isPendingOrder 
                  ? 'Kasir: Konfirmasi Pembayaran' 
                  : 'Kasir: Pembayaran Tunai & Kembalian'}
              </h3>
            </div>
            <p className="header-order-ref">
              <span>{order.invoiceNumber || `Order #${order._id.slice(-6).toUpperCase()}`}</span>
              <span className="bullet-divider">•</span>
              <span className="table-badge">Meja {order.tableNumber || '-'}</span>
              <span className="bullet-divider">•</span>
              <span className="customer-name">{order.userName || 'Pelanggan'}</span>
            </p>
          </div>
          <button 
            type="button" 
            className="payment-modal-close-btn" 
            onClick={onClose}
            title="Tutup (Esc)"
          >
            <MdClose />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="payment-modal-body">
          {/* Total Bill Box */}
          <div className="bill-summary-banner">
            <span className="bill-label">TOTAL TAGIHAN (TUNAI)</span>
            <span className="bill-amount">{formatCurrency(total)}</span>
          </div>

          <div className="cash-payment-section">
            {/* Quick Preset Buttons */}
            <div className="denomination-pills-row">
              {smartSuggestions.map((sug, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`denom-pill-btn ${cashReceived === sug.amount ? 'selected' : ''}`}
                  onClick={() => handleSelectSuggestion(sug.amount)}
                >
                  {sug.label}
                </button>
              ))}
            </div>

            {/* Cash Input Field */}
            <div className="cash-input-wrapper">
              <label htmlFor="cash-input" className="cash-input-label">
                Uang Tunai Diterima (Rp)
              </label>
              <div className="input-currency-group">
                <span className="currency-prefix">Rp</span>
                <input
                  id="cash-input"
                  ref={inputRef}
                  type="text"
                  inputMode="numeric"
                  className="cash-input-field"
                  placeholder="0"
                  value={cashInput}
                  onChange={handleInputChange}
                  autoComplete="off"
                />
                {cashInput && (
                  <button
                    type="button"
                    className="clear-input-btn"
                    onClick={() => setCashInput('')}
                    title="Hapus"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Dynamic Change / Shortage Calculation Box */}
            {cashReceived > 0 ? (
              isSufficient ? (
                <div className="change-result-box change-positive">
                  <div className="change-meta">
                    <MdCheckCircle className="result-icon success" />
                    <div>
                      <span className="result-title">KEMBALIAN KASIR</span>
                      <p className="result-subtitle">
                        {change === 0 ? 'Uang pas diterima (tanpa kembalian)' : 'Berikan uang kembalian ke pelanggan'}
                      </p>
                    </div>
                  </div>
                  <span className="change-amount-display">{formatCurrency(change)}</span>
                </div>
              ) : (
                <div className="change-result-box change-warning">
                  <div className="change-meta">
                    <MdWarningAmber className="result-icon warning" />
                    <div>
                      <span className="result-title">UANG MASIH KURANG</span>
                      <p className="result-subtitle">Nominal uang tunai belum mencukupi total tagihan</p>
                    </div>
                  </div>
                  <span className="shortage-amount-display">- {formatCurrency(shortage)}</span>
                </div>
              )
            ) : (
              <div className="change-result-box change-neutral">
                <p>Masukkan nominal uang tunai dari pelanggan atau klik pilihan cepat di atas.</p>
              </div>
            )}
          </div>

          {/* Print Struk Option Checkbox */}
          <div className="print-option-row">
            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={autoPrintReceipt}
                onChange={(e) => setAutoPrintReceipt(e.target.checked)}
              />
              <span className="custom-checkbox"></span>
              <span className="checkbox-text">
                <MdReceiptLong className="checkbox-icon" />
                Buka & Cetak Struk setelah pembayaran berhasil
              </span>
            </label>
          </div>

          {/* Modal Footer Actions */}
          <div className="payment-modal-footer">
            <button
              type="button"
              className="btn-cancel-payment"
              onClick={onClose}
              disabled={submitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-confirm-payment"
              disabled={submitting || !isSufficient}
            >
              {submitting ? (
                <>
                  <span className="btn-spinner"></span>
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <MdCheckCircle className="btn-action-icon" />
                  <span>
                    {isPendingOrder 
                      ? 'Konfirmasi Pembayaran' 
                      : 'Selesaikan & Tandai Lunas'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
