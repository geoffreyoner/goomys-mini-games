const roomHandlers = require('./roomHandlers');
const gameHandlers = require('./gameHandlers');

const roomService = require('../services/roomService');

module.exports = function setupSocket(io) {
  roomService.setIo(io);
  io.on('connection', (socket) => {
    socket.data.rl = {};
    roomHandlers(io, socket);
    gameHandlers(io, socket);

    io.emit('online:count', io.engine.clientsCount);

    socket.on('disconnect', () => {
      setTimeout(() => {
        io.emit('online:count', io.engine.clientsCount);
      }, 100);
    });
  });
};