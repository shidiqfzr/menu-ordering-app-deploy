import React, { useContext, useEffect, useState } from "react";
import "./MyOrders.css";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { assets } from "../../assets/assets";
import OrderDetailModal from "../../components/OrderDetailModal/OrderDetailModal";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
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
      const filteredOrders = response.data.data.filter(order => order.status !== "Pending");

      // Sort orders by date in descending order (newest first)
      const sortedData = filteredOrders.sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );

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
      setFilteredData(filtered);
    } else {
      setFilteredData(data); // Show all if no date range is selected
    }
  };

  // Delete order
  const handleDelete = async (orderId) => {
    const isConfirmed = window.confirm("Apakah Anda yakin ingin menghapus pesanan ini?");
    if (!isConfirmed) return;
    
    try {
      await axios.delete(`${url}/api/order/delete/${orderId}`, {
        headers: { token },
      });
      setData(data.filter((order) => order._id !== orderId));
      setFilteredData(filteredData.filter((order) => order._id !== orderId));
    } catch (error) {
      console.error("Error deleting order:", error);
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
                <button onClick={() => handleDelete(order._id)}>Hapus</button>
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
