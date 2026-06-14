require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

const authRoutes      = require('./routes/auth');
const donorRoutes     = require('./routes/donor');
const recipientRoutes = require('./routes/recipient');
const adminRoutes     = require('./routes/admin');

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
// In development: allow localhost Vite dev server.
// In production:  allow the deployed Render URL via FRONTEND_URL env var.
// When serving frontend from same origin (single-URL deploy), CORS isn't
// needed for same-origin requests, but the allow-list keeps cross-origin
// tools (Postman, etc.) working cleanly.
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin header (server-to-server, curl, same-origin)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/donor',     donorRoutes);
app.use('/api/recipient', recipientRoutes);
app.use('/api/admin',     adminRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Blood Donation API is running.', data: null });
});

// ─── API 404 Handler (catches unmatched /api/* routes only) ───────────────────
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
    data: null,
  });
});

// ─── Serve React Build (Production single-URL deployment) ─────────────────────
const distPath = path.join(__dirname, '../client/dist');
const indexHtml = path.join(distPath, 'index.html');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  console.log('✅ Serving React build from:', distPath);
} else {
  console.warn('⚠️  client/dist not found — frontend will not be served. Run npm run build.');
}

// SPA catch-all: any non-API route returns index.html so React Router works
// on page refresh (e.g. /login, /donor, /admin all load the React app).
app.get('*', (req, res) => {
  if (fs.existsSync(indexHtml)) {
    res.sendFile(indexHtml);
  } else {
    res.status(503).send('<h2>Frontend not built yet. Run <code>npm run build</code>.</h2>');
  }
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error.', data: null });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Blood Donation API server running on http://localhost:${PORT}`);
});
