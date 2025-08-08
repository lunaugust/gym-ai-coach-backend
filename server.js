require('dotenv').config();
const path = require('path');
const express = require('express');
const app = require('./src/app');

// Serve uploaded static files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`Mode: ${process.env.NODE_ENV}`);
});

module.exports = server;