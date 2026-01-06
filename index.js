const express = require('express');
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

// Konfigurasi Winston untuk Output JSON ke Console
// Ini akan ditangkap oleh Docker/Kubernetes logs lalu dikirim ke Loki
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

app.post('/v1/logs', (req, res) => {
  try {
    const { app_name, message, level, env, ...extra } = req.body;

    if (!app_name || !message) {
      return res.status(400).json({ error: 'app_name and message are required' });
    }

    const logPayload = {
      app_name: app_name,
      env: env || 'production',
      requestId: req.body.requestId || uuidv4(),
      message: message,
      attributes: extra || {}
    };

    // Gunakan logger.log agar level-nya dinamis sesuai input user (info/warn/error)
    const logServerity = level || 'info';
    logger.log(logServerity, message, logPayload);

    res.status(202).json({ 
      status: 'sent', 
      requestId: logPayload.requestId 
    });
  } catch (err) {
    // Log error internal jika ada crash
    logger.error('Logging Gateway Error', { error: err.message });
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Gateway Logging Ready di Port ${PORT}`);
});