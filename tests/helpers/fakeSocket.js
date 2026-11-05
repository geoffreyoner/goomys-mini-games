// Minimal in-process stand-ins for socket.io so handlers can be tested without a network.
const roomHandlers = require('../../src/socket/roomHandlers');
const gameHandlers = require('../../src/socket/gameHandlers');

function mkIo() {
  return { to() { return { emit() {} }; }, emit() {}, sockets: { sockets: new Map() }, engine: { clientsCount: 1 } };
}

function mkSocket(io, id, address = '10.0.0.1') {
  const h = {};
  const s = {
    id, data: { rl: {} }, handshake: { address, headers: {} }, h,
    on: (evt, fn) => { h[evt] = fn; }, join() {}, leave() {}, emit() {}
  };
  roomHandlers(io, s);
  gameHandlers(io, s);
  io.sockets.sockets.set(id, s);
  s.call = (evt, payload) => new Promise((res) => h[evt](payload, res));
  return s;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
module.exports = { mkIo, mkSocket, sleep, NO_CLOCK: { initial: 0, increment: 0 } };
