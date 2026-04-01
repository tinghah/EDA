const path = require('path');

function getNextFileId(counter) {
  return String(counter + 1).padStart(3, '0');
}

function getClientIp(req) {
  if (req.headers['cf-connecting-ip']) {
    return req.headers['cf-connecting-ip'].split(',')[0].trim();
  }
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || req.connection?.remoteAddress || req.ip || '127.0.0.1';
}

module.exports = {
  getNextFileId,
  getClientIp
};
