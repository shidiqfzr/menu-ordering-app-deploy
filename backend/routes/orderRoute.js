import express from "express"
import authMiddleware from "../middleware/auth.js"
import { placeOrder, placeManualOrder, getOrderById, verifyOrder, userOrders, deleteOrder } from "../controllers/orderController.js"

const orderRouter = express.Router();

orderRouter.post("/place", authMiddleware, placeOrder);
orderRouter.post("/manual", authMiddleware, placeManualOrder);
orderRouter.get("/:orderId", getOrderById);
orderRouter.post("/verify", verifyOrder);
orderRouter.post("/userorders", authMiddleware, userOrders);
orderRouter.delete("/delete/:id", authMiddleware, deleteOrder); 

export default orderRouter;