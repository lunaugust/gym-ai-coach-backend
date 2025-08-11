import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import logger from "./config/logger";
import authRoutes from "./routes/authRoutes";
import errorHandler from "./middleware/error";
import userRoutes from "./routes/userRoutes";
import fitnessProfileRoutes from "./routes/fitnessProfileRoutes";
import preferencesRoutes from "./routes/preferencesRoutes";
import measurementsRoutes from "./routes/measurementsRoutes";
import ApiError from "./utils/ApiError";

const app = express();

// In test/development, trust proxy so rate limit can use X-Forwarded-For for IPs in tests
if (process.env.NODE_ENV !== "production") {
  app.set("trust proxy", true);
}

// --- Morgan (HTTP Request Logger) ---
const stream: morgan.StreamOptions = {
  write: (message: string) => logger.http(message.trim()),
};
app.use(morgan("combined", { stream }));

// --- Global Middleware ---
app.use(helmet());
// Add legacy IE download option header expected by tests if available
const ieNoOpenMiddleware = (helmet as any).ieNoOpen as undefined | (() => any);
if (typeof ieNoOpenMiddleware === "function") {
  app.use(ieNoOpenMiddleware());
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- API Routes ---
app.get("/health", (_req: Request, res: Response) => res.status(200).send("OK"));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/users/fitness-profile", fitnessProfileRoutes);
app.use("/api/users/preferences", preferencesRoutes);
app.use("/api/users/measurements", measurementsRoutes);

// --- Error Handling ---
app.use((_req: Request, _res: Response, next: NextFunction) =>
  next(new ApiError(404, "The requested resource was not found.", "NOT_FOUND"))
);
app.use(errorHandler);

export default app;


