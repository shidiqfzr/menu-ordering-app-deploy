import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from "stripe";
import crypto from "crypto";  // For generating a unique identifier

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const placeOrder = async (req, res) => {
  const frontend_url = `${import.meta.env.FRONTEND_URL}`;

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
    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
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
      await orderModel.findByIdAndUpdate(orderId, {payment:true});
      res.json({success:true, message:"Paid"})
    }
    else {
      await orderModel.findByIdAndDelete(orderId);
      res.json({success:false, message:"Not Paid"})
    }
  } catch (error) {
    res.json({success:false, message:"Error"})
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

// Delete order by ID
const deleteOrder = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await orderModel.findById(id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Remove the order using findByIdAndDelete
    await orderModel.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error deleting order" });
  }
};

export { placeOrder, placeManualOrder, getOrderById, verifyOrder, userOrders, deleteOrder };