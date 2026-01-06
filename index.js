const express = require('express');
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

// Endpoint yang diminta rekan kerja kamu
app.post('/v1/logs', (req, res) => {
  try {
    const { app_name, message, level, env, ...extra } = req.body;

    // Validasi minimal supaya log tidak berantakan
    if (!app_name || !message) {
      return res.status(400).json({ error: 'app_name and message are required' });
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      app_name: app_name,
      env: env || 'production',
      level: level || 'info',
      requestId: req.body.requestId || uuidv4(),
      message: message,
      // Masukkan semua data tambahan lain ke dalam attributes
      attributes: extra || {}
    };

    // Cetak ke Stdout supaya ditangkap Loki
    logger.info(logEntry);

    res.status(202).json({ status: 'sent', requestId: logEntry.requestId });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(3000, () => console.log("Gateway Logging Ready di Port 3000"));