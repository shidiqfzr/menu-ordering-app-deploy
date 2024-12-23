import React, { useContext, useState, useEffect } from "react";
import "./Cart.css";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";
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
    removeFromCart,
    getTotalCartAmount,
    url,
    handlePromoCode,
    discount,
    token,
    tableNumber,
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

  return (
    <div className="cart">
      <div className="cart-items">
        <div className="cart-items-title">
          <p>Item</p>
          <p>Nama</p>
          <p>Harga</p>
          <p>Jumlah</p>
          <p>Total</p>
          <p>Hapus</p>
        </div>
        <br />
        <hr />
        {food_list.map((item) => {
          if (cartItems[item._id] > 0) {
            return (
              <div key={item._id}>
                <div className="cart-items-title cart-items-item">
                  <img src={item.image} alt={item.name} />
                  <p>{item.name}</p>
                  <p>{formatCurrency(item.price)}</p>
                  <p className="item-quantity">{cartItems[item._id]}</p>
                  <p>{formatCurrency(item.price * cartItems[item._id])}</p>
                  <p onClick={() => removeFromCart(item._id)} className="cross">
                    x
                  </p>
                </div>
                <hr />
              </div>
            );
          }
          return null;
        })}
      </div>

      <div className="cart-bottom">
        <div className="cart-bottom-left">
          <div className="customer-info">
            <h2>Informasi Pelanggan</h2>
            <label htmlFor="tableNumber">Nomor Meja:</label>
            <input
              name="tableNumber"
              onChange={onChangeHandler}
              value={customerInfo.tableNumber}
              type="number"
              placeholder="Nomor Meja"
              required
            />
            <label htmlFor="tableNumber">Catatan Tambahan:</label>
            <input
              name="note"
              onChange={onChangeHandler}
              value={customerInfo.note}
              type="text"
              placeholder="Opsional"
            />
            <label htmlFor="tableNumber">Metode Pembayaran:</label>
            <select
              name="paymentMethod"
              value={customerInfo.paymentMethod}
              onChange={onChangeHandler}
            >
              <option value="Elektronik">Pembayaran Elektronik</option>
              <option value="Manual">Pembayaran Tunai</option>
            </select>
          </div>

          <div className="cart-promocode">
            <h2>Voucher</h2>
            <div>
              <p>Jika kamu memiliki kode promo, masukkan di sini</p>
              <div className="cart-promocode-input">
                <input
                  type="text"
                  placeholder="kode promo"
                  value={enteredPromoCode}
                  onChange={(e) => setEnteredPromoCode(e.target.value)}
                />
                <button onClick={() => handlePromoCodeSubmit(enteredPromoCode)}>
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="cart-total">
          <h2>Total Keranjang</h2>
          <div>
            <div className="cart-total-details">
              <p>Subtotal</p>
              <p>{formatCurrency(getTotalCartAmount())}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <p>Voucher Diskon</p>
              <p>- {formatCurrency(discount)}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <b>Total Pembayaran</b>
              <b>{formatCurrency(getTotalCartAmount() - discount)}</b>
            </div>
          </div>
          <button onClick={placeOrder}>PROSES PESANAN</button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
