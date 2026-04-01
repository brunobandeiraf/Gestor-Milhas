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
import cardRoutes from "./routes/card.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import bonusPurchaseRoutes from "./routes/bonus-purchase.routes.js";
import transferRoutes from "./routes/transfer.routes.js";
import issuanceRoutes from "./routes/issuance.routes.js";
import clubRoutes from "./routes/club.routes.js";
import scheduleRoutes from "./routes/schedule.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import { startScheduleCron } from "./cron/schedule-processor.js";

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
app.use("/api/cards", cardRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/bonus-purchases", bonusPurchaseRoutes);
app.use("/api/transfers", transferRoutes);
app.use("/api/issuances", issuanceRoutes);
app.use("/api/clubs", clubRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Error handling middleware (must be registered after all routes)
app.use(errorHandler);

// Only start listening when not in test environment
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startScheduleCron();
  });
}

export default app;
