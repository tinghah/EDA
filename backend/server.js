const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const app = express();
const PORT = process.env.BACKEND_PORT || 4444;

app.use(cors());
app.use(express.json());

// Main API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'EDA Backend is running' });
});

// Mock endpoint for data processing (can be expanded later)
app.post('/api/analyze', (req, res) => {
  const { data } = req.body;
  console.log('Analyzing data...', data?.length, 'rows');
  
  // Example processing: just return a simple summary
  res.json({
    summary: {
      rowCount: data?.length || 0,
      timestamp: new Date().toISOString(),
      analysis: 'Placeholder for AI-driven or pandas-like analysis'
    }
  });
});

app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});
