import express, { Application } from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import userRoutes from "./routes/user.route";
import businessRoutes from "./routes/business.routes";
import productRoutes from "./routes/product.routes";
import categoryRoutes from "./routes/category.routes";
import connectDB from "./database/db";
import path from "path";
import cors from "cors";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT;

const corsOptions = {
  origin: true,
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));

connectDB();

app.use(bodyParser.json());

app.use("/uploads", express.static(path.join(process.cwd(), "src/uploads")));

app.use("/api/user", userRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/product", productRoutes);
app.use("/api/categories", categoryRoutes);

app.listen(PORT, () => {
  console.log(`Server running at: http://localhost:${PORT}`);
});
