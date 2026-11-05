require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  origin: process.env.ALLOWED_ORIGINS === '*' || !process.env.ALLOWED_ORIGINS
    ? true
    : process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean),
  nodeEnv: process.env.NODE_ENV || 'development',
  trustProxy: process.env.TRUST_PROXY === 'true',
  maxRooms: parseInt(process.env.MAX_ROOMS || '2000', 10),
  maxRoomsPerIp: parseInt(process.env.MAX_ROOMS_PER_IP || '20', 10),
  roomGraceMs: 60 * 1000,
  emptyRoomTtlMs: 5 * 60 * 1000,
  allowedTimeControls: [180, 300, 600, 0],
  allowedIncrements: [0, 2, 5],
  defaultTimeControl: { initial: 600, increment: 0 }
};