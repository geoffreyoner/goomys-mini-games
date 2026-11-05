const test = require('node:test');
const assert = require('node:assert/strict');
const c4 = require('../src/games/connectfour');

function mkRoom(initial = 0) {
  return {
    game: c4.create(),
    timeControl: { initial, increment: 0 },
    clocks: { white: 0, black: 0, activeSince: null, activeColor: null },
    rematchVotes: { white: false, black: false }
  };
}

test('piece drops to the bottom', () => {
  const r = mkRoom(); c4.start(r);
  c4.applyMove(r, 'white', { column: 3 });
  assert.equal(r.game.board[5][3], 'R');
  c4.applyMove(r, 'black', { column: 3 });
  assert.equal(r.game.board[4][3], 'Y');
});

test('turn order is enforced', () => {
  const r = mkRoom(); c4.start(r);
  assert.throws(() => c4.applyMove(r, 'black', { column: 0 }), /NOT_YOUR_TURN/);
});

test('rejects invalid and full columns', () => {
  const r = mkRoom(); c4.start(r);
  assert.throws(() => c4.applyMove(r, 'white', { column: 7 }), /ILLEGAL_MOVE/);
  assert.throws(() => c4.applyMove(r, 'white', { column: 1.5 }), /ILLEGAL_MOVE/);
  for (let i = 0; i < 6; i++) {
    c4.applyMove(r, i % 2 === 0 ? 'white' : 'black', { column: 0 });
  }
  assert.equal(r.game.status, 'active');
  assert.throws(() => c4.applyMove(r, 'white', { column: 0 }), /ILLEGAL_MOVE/);
});

test('vertical win', () => {
  const r = mkRoom(); c4.start(r);
  for (let i = 0; i < 3; i++) {
    c4.applyMove(r, 'white', { column: 0 });
    c4.applyMove(r, 'black', { column: 1 });
  }
  c4.applyMove(r, 'white', { column: 0 });
  assert.equal(r.game.status, 'finished');
  assert.equal(r.game.result.winner, 'w');
});

test('clock switches turn', () => {
  const r = mkRoom(300); c4.start(r);
  c4.applyMove(r, 'white', { column: 0 });
  assert.equal(r.clocks.activeColor, 'b');
});
