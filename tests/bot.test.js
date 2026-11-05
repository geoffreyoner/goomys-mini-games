const test = require('node:test');
const assert = require('node:assert/strict');
const roomService = require('../src/services/roomService');
const { mkIo, mkSocket, sleep, NO_CLOCK } = require('./helpers/fakeSocket');

const count = (board, sym) => board.flat().filter((c) => c === sym).length;

test('bot replies in Tic-Tac-Toe (regression: bot compared w/b against X/O and never moved)', async () => {
  roomService._resetForTests();
  const io = mkIo(); const s = mkSocket(io, 'ttt');
  await s.call('room:create', { name: 'Human', timeControl: NO_CLOCK, gameType: 'tictactoe', vsBot: true });
  assert.equal((await s.call('game:move', { index: 4 })).ok, true);
  await sleep(1200);
  const room = roomService.getContext('ttt').room;
  assert.equal(count(room.game.board, 'O'), 1);
  assert.equal(room.game.turn, 'X');
});

test('bot replies in Connect Four', async () => {
  roomService._resetForTests();
  const io = mkIo(); const s = mkSocket(io, 'c4');
  await s.call('room:create', { name: 'Human', timeControl: NO_CLOCK, gameType: 'connectfour', vsBot: true });
  assert.equal((await s.call('game:move', { column: 3 })).ok, true);
  await sleep(1200);
  const room = roomService.getContext('c4').room;
  assert.equal(count(room.game.board, 'Y'), 1);
  assert.equal(room.game.turn, 'R');
});

test('a bot move scheduled before a rematch does not touch the new game', async () => {
  roomService._resetForTests();
  const io = mkIo(); const s = mkSocket(io, 'stale');
  await s.call('room:create', { name: 'Human', timeControl: NO_CLOCK, gameType: 'tictactoe', vsBot: true });
  await s.call('game:move', { index: 0 });            // schedules bot reply in ~1s
  const room = roomService.getContext('stale').room;
  await s.call('game:resign', {});                    // finish the game...
  await s.call('game:rematch', {});                   // ...and start a fresh one before the timer fires
  await sleep(1200);
  assert.equal(count(room.game.board, 'O'), 0, 'stale timer must not place a piece in the new game');
  assert.equal(room.game.turn, 'X');
});

test('bot rooms only allow rematch after the game has finished', async () => {
  roomService._resetForTests();
  const io = mkIo(); const s = mkSocket(io, 'rm');
  await s.call('room:create', { name: 'Human', timeControl: NO_CLOCK, gameType: 'tictactoe', vsBot: true });
  const r = await s.call('game:rematch', {});
  assert.equal(r.ok, false);
  assert.equal(r.code, 'GAME_NOT_FINISHED');
});
