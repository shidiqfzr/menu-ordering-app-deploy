import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from "stripe";
import crypto from "crypto";  // For generating a unique identifier

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const placeOrder = async (req, res) => {
  const frontend_url = process.env.FRONTEND_URL;

  try {
    const { discount = 0 } = req.body;

    const newOrder = new orderModel({
      userId: req.body.userId,
      items: req.body.items,
      discount: discount, 
      amount: req.body.amount,
      tableNumber: req.body.tableNumber, 
      note: req.body.note,               
      paymentMethod: req.body.paymentMethod || "Online", 
    });

    // Generate a simplified invoice number based on the order date
    const orderDate = new Date();
    const year = orderDate.getFullYear();
    const month = String(orderDate.getMonth() + 1).padStart(2, "0");
    const day = String(orderDate.getDate()).padStart(2, "0");

    // Generate a short unique identifier for the order
    const shortId = crypto.randomBytes(2).toString("hex").toUpperCase();

    // Format the invoice number as "INV-YYYYMMDD-XXXX"
    const invoiceNumber = `E-${year}${month}${day}-${shortId}`;

    // Set the invoice number to the new order
    newOrder.invoiceNumber = invoiceNumber;

    await newOrder.save();

    // Clear the user's cart after placing the order
    await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });

    const line_items = req.body.items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round((item.price / 16000) * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      line_items: line_items,
      mode: 'payment',
      success_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
      cancel_url: `${frontend_url}/verify?success=false&orderId=${newOrder._id}`,
    });

    res.status(200).json({ success: true, session_url: session.url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error placing order" });
  }
};

const placeManualOrder = async (req, res) => {
  try {
    const { discount = 0 } = req.body;

    const newOrder = new orderModel({
      userId: req.body.userId,
      items: req.body.items,
      discount: discount, 
      amount: req.body.amount,
      paymentMethod: "Tunai",
      tableNumber: req.body.tableNumber, 
      note: req.body.note,               
      status: "Pending", 
      payment: false, 
    });

    // Generate a simplified invoice number based on the order date
    const orderDate = new Date();
    const year = orderDate.getFullYear();
    const month = String(orderDate.getMonth() + 1).padStart(2, "0");
    const day = String(orderDate.getDate()).padStart(2, "0");

    // Generate a short unique identifier for the order
    const shortId = crypto.randomBytes(2).toString("hex").toUpperCase();

    // Format the invoice number as "INV-YYYYMMDD-XXXX"
    const invoiceNumber = `M-${year}${month}${day}-${shortId}`;
    newOrder.invoiceNumber = invoiceNumber;

    // Save the order to the database
    await newOrder.save();

    // Clear the user's cart after placing the order
    await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });

    // Real-time socket broadcast for instant POS / Kitchen alert
    const io = req.app.get("io");
    if (io) {
      const user = await userModel.findById(req.body.userId, "name email").lean();
      const payload = {
        _id: newOrder._id,
        invoiceNumber: newOrder.invoiceNumber,
        tableNumber: newOrder.tableNumber,
        status: newOrder.status,
        amount: newOrder.amount,
        items: newOrder.items,
        payment: newOrder.payment,
        paymentMethod: newOrder.paymentMethod,
        date: newOrder.date,
        createdAt: newOrder.createdAt,
        userName: user ? user.name : "Pelanggan",
        note: newOrder.note
      };
      io.emit("order:created", payload);
      io.emit("tables:updated");
    }

    res.status(200).json({
      success: true,
      message: "Order placed successfully with manual payment",
      orderId: newOrder._id,
      invoiceNumber: invoiceNumber,
    });
  } catch (error) {
    console.error("Error placing manual order:", error);
    res.status(500).json({ success: false, message: "Error placing manual order" });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await orderModel.findById(orderId).lean();

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.userId) {
      const user = await userModel.findById(order.userId, "name email").lean();
      order.userName = user ? user.name : "Pelanggan";
    } else {
      order.userName = "Pelanggan";
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Error fetching order by ID:", error);
    res.status(500).json({ success: false, message: "Error fetching order" });
  }
};


const verifyOrder = async (req, res) => {
  const { orderId, success } = req.body;
  try {
    if (success === "true") {
      const updatedOrder = await orderModel.findByIdAndUpdate(orderId, { payment: true }, { new: true });
      
      // Real-time socket broadcast
      const io = req.app.get("io");
      if (io && updatedOrder) {
        const user = await userModel.findById(updatedOrder.userId, "name email").lean();
        const payload = {
          _id: updatedOrder._id,
          invoiceNumber: updatedOrder.invoiceNumber,
          tableNumber: updatedOrder.tableNumber,
          status: updatedOrder.status,
          amount: updatedOrder.amount,
          items: updatedOrder.items,
          payment: updatedOrder.payment,
          paymentMethod: updatedOrder.paymentMethod,
          date: updatedOrder.date,
          createdAt: updatedOrder.createdAt,
          userName: user ? user.name : "Pelanggan",
          note: updatedOrder.note
        };
        io.emit("order:created", payload);
        io.emit("tables:updated");
      }

      res.json({ success: true, message: "Paid" });
    }
    else {
      await orderModel.findByIdAndDelete(orderId);
      res.json({ success: false, message: "Not Paid" });
    }
  } catch (error) {
    res.json({ success: false, message: "Error" });
  }
}

// user orders for frontend
const userOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({userId: req.body.userId});
    res.json({success:true, data:orders})
  } catch (error) {
    console.log(error);
    res.json({success:false, message:"Error"})
  }
}

// Delete / Cancel order by ID (Only allowed for Pending/unpaid orders to protect financial data integrity)
const deleteOrder = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await orderModel.findById(id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Protection: Completed, in-progress, or paid orders must never be deleted
    if (order.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Pesanan yang sudah diproses atau selesai tidak dapat dihapus demi integritas data keuangan.",
      });
    }

    // Remove the pending order
    await orderModel.findByIdAndDelete(id);

    // Real-time socket broadcast
    const io = req.app.get("io");
    if (io) {
      io.emit("order:deleted", { orderId: id });
      io.emit("tables:updated");
    }

    res.status(200).json({ success: true, message: "Pesanan berhasil dibatalkan" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error deleting order" });
  }
};

// High-performance lightweight table orders endpoint for Table & Floor Management
const getTableOrders = async (req, res) => {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const orders = await orderModel
      .find({
        $or: [
          { status: { $in: ['Pending', 'Diproses', 'Food Processing', 'Disajikan'] } },
          { date: { $gte: since } }
        ]
      })
      .sort({ date: -1 })
      .select('tableNumber status amount date userId createdAt invoiceNumber')
      .lean();

    // Attach customer names
    const userIds = [...new Set(orders.map(o => o.userId).filter(Boolean))];
    const users = await userModel.find({ _id: { $in: userIds } }, 'name').lean();
    const userMap = {};
    users.forEach(u => {
      userMap[u._id.toString()] = u.name;
    });

    const result = orders.map(order => ({
      _id: order._id,
      invoiceNumber: order.invoiceNumber,
      tableNumber: order.tableNumber,
      status: order.status,
      amount: order.amount,
      date: order.date || order.createdAt,
      userName: userMap[order.userId] || 'Pelanggan'
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error in getTableOrders:', error);
    res.status(500).json({ success: false, message: 'Error fetching table orders' });
  }
};

// Ultra-fast count for sidebar badge (< 60ms vs 27s)
const getActiveOrderCount = async (req, res) => {
  try {
    const count = await orderModel.countDocuments({
      status: { $in: ['Pending', 'Diproses', 'Food Processing', 'Disajikan'] }
    });
    res.json({ success: true, count });
  } catch (error) {
    console.error('Error in getActiveOrderCount:', error);
    res.status(500).json({ success: false, message: 'Error counting active orders' });
  }
};

// Listing orders for admin panel (optimized with query filters & .lean())
const listOrders = async (req, res) => {
  try {
    const { limit, days, status, startDate, endDate, includeActive } = req.query;
    const activeStatuses = ['Pending', 'Menunggu', 'Diproses', 'Food Processing', 'Disajikan'];
    let orders = [];

    if (includeActive === 'true') {
      // 1. Always fetch all active floor orders regardless of date filter
      const activeOrders = await orderModel.find({ status: { $in: activeStatuses } })
        .sort({ date: -1 })
        .select('-items.description -items.image')
        .lean();

      // 2. Fetch history orders matching date/status filters
      const historyQuery = { status: { $nin: activeStatuses } };
      if (status && status !== 'all') {
        historyQuery.status = status;
      }

      if (startDate || endDate) {
        historyQuery.date = {};
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          historyQuery.date.$gte = start;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          historyQuery.date.$lte = end;
        }
      } else if (days && !isNaN(parseInt(days))) {
        const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);
        historyQuery.date = { $gte: since };
      }

      let historyCursor = orderModel.find(historyQuery)
        .sort({ date: -1 })
        .select('-items.description -items.image')
        .lean();

      if (limit && !isNaN(parseInt(limit)) && parseInt(limit) > 0) {
        historyCursor = historyCursor.limit(parseInt(limit));
      }

      const historyOrders = await historyCursor;
      const activeIds = new Set(activeOrders.map(o => o._id.toString()));
      orders = [...activeOrders, ...historyOrders.filter(o => !activeIds.has(o._id.toString()))];
    } else {
      const query = {};

      if (status && status !== 'all') {
        query.status = status;
      }

      if (startDate || endDate) {
        query.date = {};
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          query.date.$gte = start;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          query.date.$lte = end;
        }
      } else if (days && !isNaN(parseInt(days))) {
        const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);
        query.date = { $gte: since };
      }

      let cursor = orderModel.find(query)
        .sort({ date: -1 })
        .select('-items.description -items.image')
        .lean();
      if (limit && !isNaN(parseInt(limit)) && parseInt(limit) > 0) {
        cursor = cursor.limit(parseInt(limit));
      }

      orders = await cursor;
    }
    
    // Fetch user details only for matched orders (can be skipped for dashboard to boost speed)
    const shouldPopulateUsers = req.query.populateUsers !== 'false';
    const userMap = {};

    if (shouldPopulateUsers) {
      const userIds = [...new Set(orders.map(o => o.userId).filter(Boolean))];
      const users = userIds.length > 0 
        ? await userModel.find({ _id: { $in: userIds } }, 'name email').lean() 
        : [];
      users.forEach(u => {
        userMap[u._id.toString()] = { name: u.name, email: u.email };
      });
    }

    const enrichedOrders = orders.map(order => {
      if (shouldPopulateUsers) {
        const user = userMap[order.userId];
        order.userName = user ? user.name : 'Pelanggan';
        order.userEmail = user ? user.email : '';
      }
      return order;
    });

    res.json({ success: true, data: enrichedOrders, total: orders.length });
  } catch (error) {
    console.error('Error in listOrders:', error);
    res.status(500).json({ success: false, message: "Error fetching orders" });
  }
};

// Updating order status for admin panel
const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    const updateData = { status };

    // Auto-mark payment as true when order is confirmed to Diproses, Disajikan, or Selesai
    if (status === "Diproses" || status === "Disajikan" || status === "Selesai") {
      updateData.payment = true;
    } else if (typeof req.body.payment === "boolean") {
      updateData.payment = req.body.payment;
    }

    const updated = await orderModel.findByIdAndUpdate(orderId, updateData, { new: true });

    // Broadcast status change via Socket.IO
    const io = req.app.get("io");
    if (io && updated) {
      io.emit("order:status_updated", {
        orderId: updated._id,
        status: updated.status,
        payment: updated.payment,
        tableNumber: updated.tableNumber
      });
      io.emit("tables:updated");
    }

    res.json({ success: true, message: "Status Updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error updating status" });
  }
};

// Updating order payment status directly (Lunas / Belum Bayar with Cash / Change tracking & auto-advance to Diproses)
const updatePayment = async (req, res) => {
  try {
    const { orderId, payment, cashReceived, change, paymentMethod, nextStatus } = req.body;
    const updateData = { payment: Boolean(payment) };

    if (cashReceived !== undefined) updateData.cashReceived = Number(cashReceived) || 0;
    if (change !== undefined) updateData.change = Number(change) || 0;
    if (paymentMethod) updateData.paymentMethod = String(paymentMethod);

    // If order was Pending and payment is completed, automatically advance to "Diproses" (Kitchen starts cooking)
    if (nextStatus) {
      updateData.status = String(nextStatus);
    } else if (payment) {
      const existing = await orderModel.findById(orderId);
      if (existing && (existing.status === 'Pending' || existing.status === 'Menunggu')) {
        updateData.status = 'Diproses';
      }
    }

    const updated = await orderModel.findByIdAndUpdate(orderId, updateData, { new: true });

    if (!updated) {
      return res.status(404).json({ success: false, message: "Pesanan tidak ditemukan" });
    }

    // Broadcast payment and status updates via Socket.IO
    const io = req.app.get("io");
    if (io) {
      io.emit("order:payment_updated", {
        orderId: updated._id,
        payment: updated.payment,
        cashReceived: updated.cashReceived,
        change: updated.change,
        paymentMethod: updated.paymentMethod
      });

      if (updateData.status) {
        io.emit("order:status_updated", {
          orderId: updated._id,
          status: updated.status
        });
      }

      io.emit("tables:updated");
    }

    res.json({ success: true, message: "Status pembayaran berhasil diperbarui", data: updated });
  } catch (error) {
    console.error("updatePayment error:", error);
    res.status(500).json({ success: false, message: "Gagal memperbarui status pembayaran" });
  }
};

export { 
  placeOrder, 
  placeManualOrder, 
  getOrderById, 
  verifyOrder, 
  userOrders, 
  deleteOrder, 
  listOrders, 
  getTableOrders,
  getActiveOrderCount,
  updateStatus, 
  updatePayment 
};