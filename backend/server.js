/**
 * SpaceSense Backend Entry Point
 * Phase 1 Foundation: Basic health endpoint and server bootstrap.
 */
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check endpoint to verify the backend is running
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'spacesense-backend',
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`SpaceSense backend listening on port ${PORT}`);
});
