import React, { useEffect, useState, useContext } from "react";
import { StoreContext } from "../../context/StoreContext";
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
  if (!isNaN(date.getTime())) {
    const dateFormatted = date.toLocaleDateString("id-ID");
    const timeFormatted = date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${dateFormatted} ${timeFormatted}`;
  } else {
    return "Tanggal tidak valid";
  }
};

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { url, token } = useContext(StoreContext);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await axios.get(`${url}/api/order/${orderId}`);
        setOrder(response.data.order);
        if (response.data.order.status === "Diproses") {
          navigate("/myorders");
        }
      } catch (err) {
        console.error("Failed to load order details:", err);
      } finally {
        setLoading(false);
      }
    };

    // Set up polling to fetch the order status every few seconds
    const intervalId = setInterval(fetchOrder, 3000); // Poll every 3 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [orderId, url, navigate]);

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

  return (
    <div className="order-confirmation">
      <h2>Konfirmasi Pembayaran</h2>

      {order && (
        <>
          <p className="payment-instruction">
            Silakan tunjukkan informasi pesanan ini ke kasir untuk melakukan pembayaran tunai.
          </p>

          <div className="order-card">
            <h3>Informasi Pesanan</h3>
            <p>
              <strong>Nomor Faktur:</strong> {order.invoiceNumber}
            </p>
            <p>
              <strong>Tanggal & Waktu:</strong>{" "}
              {formatOrderDateTime(order.date)}
            </p>
            <p>
              <strong>Nomor Meja:</strong> {order.tableNumber}
            </p>
            <p>
              <strong>Catatan Tambahan:</strong> {order.note || "-"}
            </p>
          </div>

          <div className="order-items">
            <h3>Item Pesanan</h3>
            <ul className="item-list-confirmation">
              {order.items.map((item, index) => (
                <li key={index} className="item-confirmation">
                  <span>{item.name}</span>
                  <span>{formatCurrency(item.price)} </span>
                  <span>x {item.quantity}</span>
                  <span>= {formatCurrency(item.quantity * item.price)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="payment-summary">
            <h3>Ringkasan Pembayaran</h3>
            <p>
              <strong>Voucher Diskon:</strong> - {" "}{formatCurrency(order.discount)}
            </p>
            <p>
              <strong>Total Harga:</strong> <strong>{formatCurrency(order.amount)}</strong>
            </p>
          </div>

          <div className="confirmation-actions">
            <button onClick={handleCancelOrder} className="cancel-button">
              Batalkan Pesanan
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default OrderConfirmation;
