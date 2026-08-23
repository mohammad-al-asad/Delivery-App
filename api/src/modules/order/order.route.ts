import { Router } from "express";
import { authMiddleware, orderController } from "../../container";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

const orderRoute = Router();

orderRoute.use(authMiddleware.authenticate);

orderRoute.get("/", orderController.getOrders);
orderRoute.get(
  "/summary",
  authMiddleware.authorize(["Admin"]),
  orderController.getOrderSummary
);
orderRoute.post("/", orderController.createOrder);
orderRoute.post("/estimate-price", orderController.estimatePrice);

orderRoute.get("/:id", orderController.getOrderById);
orderRoute.patch("/:id/cancel", orderController.cancelOrder);
orderRoute.patch("/:id/assign-rider", orderController.assignRider);
orderRoute.patch("/:id/status", orderController.updateStatus);
orderRoute.patch("/:id/checkpoints", orderController.addCheckpoint);
orderRoute.patch(
  "/:id/completion-proof",
  upload.single("images"),
  orderController.submitCompletionProof
);
orderRoute.patch("/:id/review", orderController.addReview);

export default orderRoute;
