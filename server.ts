import dotenv from "dotenv";
dotenv.config();

import path from "path";
import express from "express";
import app from "./src/app";

// Serve uploaded static files
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

const PORT = Number(process.env.PORT) || 3000;

const server = app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 Server running on port ${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`Mode: ${process.env.NODE_ENV}`);
});

export default server;


