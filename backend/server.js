const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Environment 
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Services
const { loadFileStore } = require('./services/storage');

// Load store
loadFileStore();

const app = express();
const PORT = process.env.BACKEND_PORT || 4444;

// Directories
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// API Routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend running on port ${PORT}`);
});
