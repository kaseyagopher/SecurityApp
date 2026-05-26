const ESP32_API_KEY = process.env.ESP32_API_KEY || 'change-me-esp32-key';

export function esp32Auth(req, res, next) {
  const header = req.headers['x-esp32-key'] || req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!header || header !== ESP32_API_KEY) {
    return res.status(401).json({ error: 'Cle ESP32 invalide' });
  }
  next();
}
