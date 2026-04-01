import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { errorHandler } from "./middlewares/error-handler.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import airlineRoutes from "./routes/airline.routes.js";
import bankRoutes from "./routes/bank.routes.js";
import programRoutes from "./routes/program.routes.js";
import loyaltyAccountRoutes from "./routes/loyalty-account.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/airlines", airlineRoutes);
app.use("/api/banks", bankRoutes);
app.use("/api/programs", programRoutes);
app.use("/api/loyalty-accounts", loyaltyAccountRoutes);

// Error handling middleware (must be registered after all routes)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
