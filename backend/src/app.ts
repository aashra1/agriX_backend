import express, { Application } from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import userRoutes from "./routes/user.route";
import businessRoutes from "./routes/business.routes";
import productRoutes from "./routes/product.routes";
import categoryRoutes from "./routes/category.routes";
import path from "path";
import cors from "cors";
import cartRoutes from "./routes/cart.routes";
import orderRoutes from "./routes/order.routes";
import paymentRoutes from "./routes/payment.routes";
import walletRoutes from "./routes/wallet.routes";

dotenv.config();

const app: Application = express();

let corsOptions = {
  origin: ["http://localhost:3000"],
  credentials: true,
};

// Middlewares
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use("/uploads", express.static(path.join(process.cwd(), "src/uploads")));

// Routes
app.use("/api/user", userRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/product", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/wallets", walletRoutes);

export default app;
