import React, { useContext, useEffect, useState } from "react";
import "./MyOrders.css";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { assets } from "../../assets/assets";
import OrderDetailModal from "../../components/OrderDetailModal/OrderDetailModal";
import Swal from "sweetalert2";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

// Function to determine the priority of statuses
const getStatusPriority = (status) => {
  const priority = {
    Diproses: 1,
    Selesai: 2,
    // Add more statuses if needed with increasing priority values
  };
  return priority[status] || 99; // Default to lowest priority if status is not defined
};

const MyOrders = () => {
  const { url, token } = useContext(StoreContext);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Fetch and sort user orders by date
  const fetchOrders = async () => {
    try {
      const response = await axios.post(
        `${url}/api/order/userorders`,
        {},
        { headers: { token } }
      );

      // Filter out orders with "Pending" status
      const filteredOrders = response.data.data.filter(
        (order) => order.status !== "Pending"
      );

      // Sort orders first by status priority, then by date (newest first)
      const sortedData = filteredOrders.sort((a, b) => {
        const statusDiff = getStatusPriority(a.status) - getStatusPriority(b.status);
        if (statusDiff === 0) {
          return new Date(b.date) - new Date(a.date);
        }
        return statusDiff;
      });

      setData(sortedData);
      setFilteredData(sortedData);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  // Filter orders by selected date range when filter button is clicked
  const handleFilterButtonClick = () => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      // Adjust end date to cover the entire day by setting the time to the end of the day
      end.setHours(23, 59, 59, 999);

      const filtered = data.filter((order) => {
        const orderDate = new Date(order.date);
        return orderDate >= start && orderDate <= end;
      });

      // Sort the filtered data by status priority and date
      const sortedFilteredData = filtered.sort((a, b) => {
        const statusDiff = getStatusPriority(a.status) - getStatusPriority(b.status);
        if (statusDiff === 0) {
          return new Date(b.date) - new Date(a.date);
        }
        return statusDiff;
      });

      setFilteredData(sortedFilteredData);
    } else {
      setFilteredData(data); // Show all if no date range is selected
    }
  };

  // Delete order
  const handleDelete = async (order) => {
    if (order.status !== "Selesai") {
      Swal.fire({
        title: "Tidak Dapat Menghapus Pesanan",
        text: "Hanya pesanan dengan status 'Selesai' yang dapat dihapus.",
        icon: "info",
        confirmButtonText: "OK",
        customClass: {
          popup: "small-swal-popup",
          title: "small-swal-title",
          content: "small-swal-content",
        },
      });
      return;
    }

    const result = await Swal.fire({
      title: "Hapus Pesanan?",
      text: "Apakah Anda yakin ingin menghapus riwayat pesanan ini?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
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
        setData(data.filter((o) => o._id !== order._id));
        setFilteredData(filteredData.filter((o) => o._id !== order._id));
        Swal.fire({
          title: "Dihapus!",
          text: "Riwayat pesanan berhasil dihapus.",
          icon: "success",
          customClass: {
            popup: "small-swal-popup",
            title: "small-swal-title",
            content: "small-swal-content",
          },
        });
      } catch (error) {
        console.error("Error deleting order:", error);
        Swal.fire("Gagal", "Gagal menghapus pesanan. Silakan coba lagi.", "error");
      }
    }
  };

  // Open order details modal
  const openOrderDetail = (order) => {
    setSelectedOrder(order);
  };

  // Close order details modal
  const closeOrderDetail = () => {
    setSelectedOrder(null);
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

  return (
    <div className="my-orders">
      <h2>Riwayat Pesanan</h2>

      <div className="date-filter">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          placeholder="Start Date"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          placeholder="End Date"
        />
        <button onClick={handleFilterButtonClick}>Filter</button>
      </div>

      <div className="container">
        {filteredData.length === 0 ? (
          <div className="no-orders">
            <img src={assets.empty_cart} alt="No orders" />
            <p>
              Kamu belum memiliki riwayat pemesanan. Yuk, buat pesanan sekarang!
            </p>
          </div>
        ) : (
          filteredData.map((order, index) => (
            <div key={index} className="my-orders-order">
              <img src={assets.order_icon} alt="" />

              <p>{order.invoiceNumber}</p>
              <p>
                <span>&#x25cf;</span> <b>{order.status}</b>
              </p>
              <p className="items-count">Items: {order.items.length}</p>
              <p>{formatCurrency(order.amount)}</p>
              <div className="button-group">
                <button onClick={() => openOrderDetail(order)}>Detail</button>
                <button onClick={() => handleDelete(order)}>Hapus</button>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={closeOrderDetail} />
      )}
    </div>
  );
};

export default MyOrders;
