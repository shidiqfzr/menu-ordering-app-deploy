import React, { useContext, useState, useEffect } from "react";
import "./Cart.css";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";
import { assets } from "../../assets/assets";
import { IoAdd, IoRemove } from "react-icons/io5";
import axios from "axios";
import Swal from "sweetalert2";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const Cart = () => {
  const {
    cartItems,
    food_list,
    addToCart,
    removeFromCart,
    getTotalCartAmount,
    url,
    handlePromoCode,
    discount,
    token,
    tableNumber,
    setTableNumber,
    setInvoiceNumber,
  } = useContext(StoreContext);
  const [enteredPromoCode, setEnteredPromoCode] = useState("");
  const [customerInfo, setCustomerInfo] = useState({
    tableNumber: tableNumber,
    note: "",
    paymentMethod: "Elektronik", // Default to electronic
  });
  const navigate = useNavigate();

  useEffect(() => {
    setCustomerInfo((prevInfo) => ({
      ...prevInfo,
      tableNumber: tableNumber, // Update the tableNumber if it changes in the context
    }));
  }, [tableNumber]);

  // Handle form input changes
  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    setCustomerInfo((info) => ({ ...info, [name]: value }));
    if (name === "tableNumber") {
      setTableNumber(value);
    }
  };

  // Place order function
  const placeOrder = async (event) => {
    event.preventDefault();

    // Check if the cart is empty
    if (getTotalCartAmount() === 0) {
      Swal.fire({
        title: "Keranjang Kosong",
        text: "Silahkan tambahkan menu ke keranjang sebelum melanjutkan pemesanan.",
        icon: "warning",
        confirmButtonText: "OK",
        customClass: {
          popup: "small-swal-popup",
          title: "small-swal-title",
          content: "small-swal-content",
        },
      });
      return; // Exit the function early if the cart is empty
    }

    // Check if the table number is provided
    if (!customerInfo.tableNumber || customerInfo.tableNumber.trim() === "") {
      Swal.fire({
        title: "Nomor Meja Diperlukan",
        text: "Silakan masukkan nomor meja sebelum melanjutkan pemesanan.",
        icon: "warning",
        confirmButtonText: "OK",
        customClass: {
          popup: "small-swal-popup",
          title: "small-swal-title",
          content: "small-swal-content",
        },
      });
      return; // Exit the function early if the table number is missing
    }

    // Create order items array
    let orderItems = [];
    food_list.forEach((item) => {
      if (cartItems[item._id] > 0) {
        let itemInfo = { ...item, quantity: cartItems[item._id] };
        orderItems.push(itemInfo);
      }
    });

    let orderData = {
      items: orderItems,
      discount: discount,
      amount: getTotalCartAmount() - discount,
      tableNumber: customerInfo.tableNumber,
      note: customerInfo.note,
      paymentMethod: customerInfo.paymentMethod,
    };

    try {
      if (customerInfo.paymentMethod === "Elektronik") {
        // Electronic payment
        const response = await axios.post(url + "/api/order/place", orderData, {
          headers: { token },
        });

        if (response.data.success) {
          const { session_url } = response.data;
          window.location.replace(session_url);
        } else {
          alert("Error: " + response.data.message);
        }
      } else if (customerInfo.paymentMethod === "Manual") {
        // Manual payment
        const response = await axios.post(
          url + "/api/order/manual",
          orderData,
          {
            headers: { token },
          }
        );

        if (response.data.success) {
          navigate(`/order-confirmation/${response.data.orderId}`);
        } else {
          alert("Error: " + response.data.message);
        }
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        Swal.fire({
          title: "Login Diperlukan",
          text: "Silahkan login terlebih dahulu jika ingin melakukan pemesanan.",
          icon: "warning",
          customClass: {
            popup: "small-swal-popup",
            title: "small-swal-title",
            content: "small-swal-content",
          },
        });
      } else {
        alert("Terjadi kesalahan saat melakukan pemesanan. Silakan coba lagi.");
      }
    }
  };

  const handlePromoCodeSubmit = () => {
    if (enteredPromoCode.trim() === "") {
      Swal.fire({
        title: "Kode Promo Kosong",
        text: "Silakan masukkan kode promo sebelum mengirim.",
        icon: "warning",
        confirmButtonText: "OK",
        customClass: {
          popup: "small-swal-popup",
          title: "small-swal-title",
          content: "small-swal-content",
        },
      });
      return;
    }
  
    // Check if the promo code is valid
    if (enteredPromoCode === "MERDEKA" || enteredPromoCode === "SPECIAL20") {
      handlePromoCode(enteredPromoCode); // Apply the promo code
      Swal.fire({
        title: "Kode Promo Valid",
        text: "Diskon berhasil diterapkan ke keranjang Anda.",
        icon: "success",
        confirmButtonText: "OK",
        customClass: {
          popup: "small-swal-popup",
          title: "small-swal-title",
          content: "small-swal-content",
        },
      });
    } else {
      Swal.fire({
        title: "Kode Promo Tidak Valid",
        text: "Kode promo yang Anda masukkan tidak ditemukan atau sudah tidak berlaku.",
        icon: "error",
        confirmButtonText: "OK",
        customClass: {
          popup: "small-swal-popup",
          title: "small-swal-title",
          content: "small-swal-content",
        },
      });
    }
  };
  
  // Redirect to cart if no items in cart or no token
  useEffect(() => {
    if (!token || getTotalCartAmount() === 0) {
      navigate("/cart");
    }
  }, [getTotalCartAmount, navigate, token]);

  // Calculate total item count in cart
  const totalItemCount = Object.values(cartItems || {}).reduce(
    (sum, qty) => (qty > 0 ? sum + qty : sum),
    0
  );

  return (
    <div className="cart">
      <div className="cart-card cart-items-card">
        <h2 className="cart-section-title">Detail Pesanan</h2>

        {totalItemCount === 0 ? (
          <div className="cart-empty-state">
            <img src={assets.empty_cart} alt="Keranjang Kosong" className="cart-empty-img" />
            <h3>Keranjang Anda Masih Kosong</h3>
            <p>Pilih hidangan favorit Anda dari menu dan pesan sekarang.</p>
            <button type="button" className="cart-empty-btn" onClick={() => navigate("/")}>
              Jelajahi Menu
            </button>
          </div>
        ) : (
          <>
            <div className="cart-items-header">
              <p className="col-img">Item</p>
              <p className="col-name">Nama Menu</p>
              <p className="col-unit-price">Harga Satuan</p>
              <p className="col-qty">Jumlah</p>
              <p className="col-total">Total</p>
            </div>

            <div className="cart-items-list">
              {food_list.map((item) => {
                if (cartItems[item._id] > 0) {
                  const qty = cartItems[item._id];
                  const subtotal = item.price * qty;

                  return (
                    <div key={item._id} className="cart-item-row">
                      {/* 1. Item Image Thumbnail */}
                      <div className="cart-item-thumb">
                        <img src={item.image} alt={item.name} />
                      </div>

                      {/* 2. Item Content Area (Mobile & Desktop Title) */}
                      <div className="cart-item-content">
                        <div className="cart-item-top-row">
                          <h3 className="cart-item-title">{item.name}</h3>
                          <span className="cart-item-mobile-subtotal">
                            {formatCurrency(subtotal)}
                          </span>
                        </div>

                        <div className="cart-item-bottom-row">
                          <p className="cart-item-unit-price">
                            {formatCurrency(item.price)}
                            <span className="unit-label"> / porsi</span>
                          </p>

                          <div className="cart-stepper">
                            <button
                              type="button"
                              className="cart-stepper-btn"
                              onClick={() => removeFromCart(item._id)}
                              aria-label={`Kurangi ${item.name}`}
                            >
                              <IoRemove />
                            </button>
                            <span className="cart-stepper-value">{qty}</span>
                            <button
                              type="button"
                              className="cart-stepper-btn"
                              onClick={() => addToCart(item._id)}
                              aria-label={`Tambah ${item.name}`}
                            >
                              <IoAdd />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 3. Desktop Only Separate Columns */}
                      <div className="cart-item-desktop-unit-price">
                        {formatCurrency(item.price)}
                      </div>

                      <div className="cart-item-desktop-stepper">
                        <div className="cart-stepper">
                          <button
                            type="button"
                            className="cart-stepper-btn"
                            onClick={() => removeFromCart(item._id)}
                            aria-label={`Kurangi ${item.name}`}
                          >
                            <IoRemove />
                          </button>
                          <span className="cart-stepper-value">{qty}</span>
                          <button
                            type="button"
                            className="cart-stepper-btn"
                            onClick={() => addToCart(item._id)}
                            aria-label={`Tambah ${item.name}`}
                          >
                            <IoAdd />
                          </button>
                        </div>
                      </div>

                      <div className="cart-item-desktop-total">
                        {formatCurrency(subtotal)}
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </>
        )}
      </div>

      <div className="cart-bottom">
        <div className="cart-bottom-left">
          {/* Customer Info Card */}
          <div className="cart-card customer-info-card">
            <h2 className="cart-section-title">Informasi Pelanggan</h2>

            {/* Table Number Display or Input */}
            {tableNumber ? (
              <div className="cart-table-card verified">
                <div className="cart-table-info">
                  <div className="cart-table-pill">
                    <span>Meja <strong>{customerInfo.tableNumber}</strong></span>
                  </div>
                  <span className="cart-table-source-tag">Terdeteksi dari QR</span>
                </div>
              </div>
            ) : (
              <div className="cart-field-group">
                <label htmlFor="tableNumber" className="cart-field-label">
                  Nomor Meja <span className="cart-required-badge">*Wajib Diisi</span>
                </label>
                <input
                  id="tableNumber"
                  name="tableNumber"
                  onChange={onChangeHandler}
                  value={customerInfo.tableNumber || ""}
                  type="number"
                  min="1"
                  placeholder="Masukkan nomor meja Anda (cth: 5)"
                  className="cart-input"
                  required
                />
              </div>
            )}

            {/* Note Input */}
            <div className="cart-field-group">
              <label htmlFor="note" className="cart-field-label">
                Catatan Tambahan <span className="cart-optional-text">(Opsional)</span>
              </label>
              <input
                id="note"
                name="note"
                onChange={onChangeHandler}
                value={customerInfo.note}
                type="text"
                placeholder="Contoh: Jangan terlalu pedas, es dipisah"
                className="cart-input"
              />
            </div>

            {/* Payment Method Segmented Cards */}
            <div className="cart-field-group">
              <label className="cart-field-label">Metode Pembayaran</label>
              <div className="payment-method-selector">
                <button
                  type="button"
                  className={`payment-method-btn ${customerInfo.paymentMethod === "Elektronik" ? "active" : ""}`}
                  onClick={() => setCustomerInfo((prev) => ({ ...prev, paymentMethod: "Elektronik" }))}
                >
                  <span className="payment-radio-dot"></span>
                  <div className="payment-btn-text">
                    <span className="payment-method-name">Pembayaran Elektronik</span>
                    <span className="payment-method-sub">QRIS, E-Wallet, Debit/Kredit</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={`payment-method-btn ${customerInfo.paymentMethod === "Manual" ? "active" : ""}`}
                  onClick={() => setCustomerInfo((prev) => ({ ...prev, paymentMethod: "Manual" }))}
                >
                  <span className="payment-radio-dot"></span>
                  <div className="payment-btn-text">
                    <span className="payment-method-name">Pembayaran Tunai</span>
                    <span className="payment-method-sub">Bayar langsung di kasir</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Voucher Promo Card */}
          <div className="cart-card cart-promocode-card">
            <h2 className="cart-section-title">Voucher Promo</h2>
            <p className="cart-section-subtitle">Punya kode promo? Masukkan untuk mendapatkan potongan harga</p>
            <div className="cart-promocode-box">
              <input
                type="text"
                placeholder="Kode promo (cth: MERDEKA)"
                value={enteredPromoCode}
                onChange={(e) => setEnteredPromoCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handlePromoCodeSubmit(enteredPromoCode);
                  }
                }}
                className="cart-promocode-input"
              />
              <button
                type="button"
                className="cart-promocode-btn"
                onClick={() => handlePromoCodeSubmit(enteredPromoCode)}
              >
                Terapkan
              </button>
            </div>
            {discount > 0 && (
              <div className="promo-applied-tag">
                <span>Voucher aktif: Hemat <strong>{formatCurrency(discount)}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Total Summary Card */}
        <div className="cart-card cart-total">
          <h2 className="cart-section-title">Ringkasan Pembayaran</h2>
          <div className="cart-total-body">
            <div className="cart-total-details">
              <span>Subtotal</span>
              <span className="amount-val">{formatCurrency(getTotalCartAmount())}</span>
            </div>
            {discount > 0 && (
              <div className="cart-total-details discount-row">
                <span>Voucher Diskon</span>
                <span className="amount-val discount-val">- {formatCurrency(discount)}</span>
              </div>
            )}
            <hr className="cart-total-divider" />
            <div className="cart-total-details total-highlight">
              <span>Total Pembayaran</span>
              <span className="total-amount-val">{formatCurrency(getTotalCartAmount() - discount)}</span>
            </div>
          </div>
          <button type="button" className="cart-checkout-btn" onClick={placeOrder}>
            Proses Pesanan
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
