const test = require('node:test');
const assert = require('node:assert/strict');
const roomService = require('../src/services/roomService');
const config = require('../src/config');
const validation = require('../src/middleware/validation');
const { mkIo, mkSocket, NO_CLOCK } = require('./helpers/fakeSocket');

async function twoPlayerRoom(gameType = 'tictactoe') {
  roomService._resetForTests();
  const io = mkIo();
  const w = mkSocket(io, 'w'), b = mkSocket(io, 'b'), sp = mkSocket(io, 'sp');
  const c = await w.call('room:create', { name: 'W', timeControl: NO_CLOCK, gameType });
  await b.call('room:join', { name: 'B', roomCode: c.roomCode });
  return { io, w, b, sp, code: c.roomCode, room: roomService._getRoom(c.roomCode) };
}

test('a socket that is already in a room cannot create another (no orphaned rooms)', async () => {
  roomService._resetForTests();
  const io = mkIo(); const s = mkSocket(io, 'dup');
  assert.equal((await s.call('room:create', { name: 'E', timeControl: NO_CLOCK })).ok, true);
  const second = await s.call('room:create', { name: 'E', timeControl: NO_CLOCK });
  assert.equal(second.ok, false);
  assert.equal(second.code, 'ALREADY_IN_ROOM');
});

test('abandoned room is cleaned up after its player disconnects', async () => {
  roomService._resetForTests();
  const io = mkIo(); const s = mkSocket(io, 'gone');
  const c = await s.call('room:create', { name: 'E', timeControl: NO_CLOCK });
  s.h.disconnect();
  const room = roomService._getRoom(c.roomCode);
  assert.equal(room.players.white.connected, false);
  room.lastActivity = Date.now() - 3600_000;
  roomService.cleanup();
  assert.equal(roomService._getRoom(c.roomCode), undefined);
});

test('rooms per IP are capped even when the attacker opens many sockets', async () => {
  roomService._resetForTests();
  const io = mkIo();
  let ok = 0, blocked = 0;
  for (let i = 0; i < config.maxRoomsPerIp + 5; i++) {
    const r = await mkSocket(io, 'f' + i, '203.0.113.9').call('room:create', { name: 'x', timeControl: NO_CLOCK });
    r.ok ? ok++ : (r.code === 'TOO_MANY_ROOMS' && blocked++);
  }
  assert.equal(ok, config.maxRoomsPerIp);
  assert.equal(blocked, 5);
  // a different IP is unaffected
  assert.equal((await mkSocket(io, 'other', '198.51.100.7').call('room:create', { name: 'y', timeControl: NO_CLOCK })).ok, true);
});

test('global room cap is enforced', async () => {
  roomService._resetForTests();
  const io = mkIo(); const prev = config.maxRooms; config.maxRooms = 2;
  try {
    assert.equal((await mkSocket(io, 'a', '1.1.1.1').call('room:create', { name: 'a', timeControl: NO_CLOCK })).ok, true);
    assert.equal((await mkSocket(io, 'b', '2.2.2.2').call('room:create', { name: 'b', timeControl: NO_CLOCK })).ok, true);
    const r = await mkSocket(io, 'c', '3.3.3.3').call('room:create', { name: 'c', timeControl: NO_CLOCK });
    assert.equal(r.code, 'SERVER_FULL');
  } finally { config.maxRooms = prev; }
});

test('spectators cannot cancel players\' rematch votes', async () => {
  const { w, sp, room } = await twoPlayerRoom();
  assert.equal((await sp.call('room:join', { name: 'Watcher', roomCode: room.code })).seat, 'spectator');
  await w.call('game:resign', {});
  await w.call('game:rematch', {});
  const r = await sp.call('game:declineRematch', {});
  assert.equal(r.ok, false);
  assert.equal(r.code, 'FORBIDDEN');
  assert.equal(room.rematchVotes.white, true);
});

test('state snapshot tells the client whether this is a bot game (no name sniffing)', async () => {
  roomService._resetForTests();
  const io = mkIo(); const s = mkSocket(io, 'bot');
  const c = await s.call('room:create', { name: 'H', timeControl: NO_CLOCK, gameType: 'tictactoe', vsBot: true });
  assert.equal(roomService.buildSnapshot(roomService._getRoom(c.roomCode), 'white').vsBot, true);
  const { room } = await twoPlayerRoom();
  assert.equal(roomService.buildSnapshot(room, 'white').vsBot, false);
});

test('the reserved bot name cannot be used by a human', () => {
  assert.throws(() => validation.validateName('Computer'), (e) => e.code === 'INVALID_NAME');
  assert.throws(() => validation.validateName('  cOmPuTeR '), (e) => e.code === 'INVALID_NAME');
  assert.equal(validation.validateName('Computers'), 'Computers');
});

test('a rejected chess move does not burn its requestId', async () => {
  const { w, b, room } = await twoPlayerRoom('chess');
  const bad = await w.call('game:move', { from: 'e2', to: 'a1', requestId: 'same-id-1' }); // illegal
  assert.equal(bad.ok, false);
  const retry = await w.call('game:move', { from: 'e2', to: 'e4', requestId: 'same-id-1' });
  assert.equal(retry.ok, true);
  assert.notEqual(retry.duplicate, true);
  assert.equal(room.game.history.length, 1);
  // ...but a genuinely repeated, accepted request is still deduplicated
  assert.equal((await b.call('game:move', { from: 'e7', to: 'e5', requestId: 'dup-2222' })).ok, true);
  assert.equal((await b.call('game:move', { from: 'e7', to: 'e5', requestId: 'dup-2222' })).duplicate, true);
});

test('validateMove rejects non-string promotion with INVALID_MOVE, not a TypeError', () => {
  assert.throws(
    () => validation.validateMove({ from: 'e7', to: 'e8', promotion: ['q'], requestId: 'abcd' }),
    (e) => e.code === 'INVALID_MOVE'
  );
});

test('missing ack callbacks never throw (join / reconnect / legalMoves)', async () => {
  const { w, room } = await twoPlayerRoom('chess');
  assert.doesNotThrow(() => w.h['game:legalMoves']({ from: 'e2' }));
  const s = mkSocket(mkIo(), 'noack');
  assert.doesNotThrow(() => s.h['room:join']({ name: 'N', roomCode: room.code }));
});
