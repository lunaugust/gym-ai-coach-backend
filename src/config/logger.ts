import winston from "winston";

const isDevelopment = process.env.NODE_ENV === "development";

const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`)
);

const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const logger = winston.createLogger({
  level: isDevelopment ? "debug" : "info",
  format: isDevelopment ? devFormat : prodFormat,
  transports: [new winston.transports.Console()],
  exitOnError: false,
});

export default logger;


