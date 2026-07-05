const express = require('express');
const cors = require('cors');
require('dotenv').config();

const seeratRoutes = require('./routes/seerat.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Base Route
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: "Welcome to Yade-Ilahi GitHub-Driven Seerat API",
        version: "1.1.0",
        status: "Active"
    });
});

// Dynamic Routes Splitter
app.use('/api', seeratRoutes);

// 404 Route Handler
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: "Requested endpoint not found."
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("Global Server Error:", err.stack);
    res.status(500).json({
        success: false,
        message: "Internal server error occurred.",
        error: err.message
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running beautifully on port ${PORT}`);
});