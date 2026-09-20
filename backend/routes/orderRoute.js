import express from "express"
import authMiddleware from "../middleware/auth.js"
import { 
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
} from "../controllers/orderController.js"

const orderRouter = express.Router();

// Specific routes MUST come before wildcard routes (/:orderId)
orderRouter.post("/place", authMiddleware, placeOrder);
orderRouter.post("/manual", authMiddleware, placeManualOrder);
orderRouter.post("/verify", verifyOrder);
orderRouter.post("/userorders", authMiddleware, userOrders);
orderRouter.delete("/delete/:id", authMiddleware, deleteOrder);
orderRouter.get("/list", listOrders);
orderRouter.get("/tables", getTableOrders);
orderRouter.get("/active-count", getActiveOrderCount);
orderRouter.post("/status", updateStatus);
orderRouter.post("/payment", updatePayment);

// Wildcard route must be LAST
orderRouter.get("/:orderId", getOrderById);

export default orderRouter;