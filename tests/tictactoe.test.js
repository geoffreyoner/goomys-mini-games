const test = require('node:test');
const assert = require('node:assert/strict');
const tic = require('../src/games/tictactoe');

function mkRoom() {
  return {
    game: tic.create(),
    timeControl: { initial: 0, increment: 0 },
    clocks: { white: 0, black: 0, activeSince: null, activeColor: null },
    rematchVotes: { white: false, black: false }
  };
}

test('legal tictactoe move', () => {
  const r = mkRoom(); tic.start(r);
  tic.applyMove(r, 'white', { index: 0 });
  assert.equal(r.game.board[0], 'X');
  assert.equal(r.game.turn, 'O');
});

test('illegal tictactoe move', () => {
  const r = mkRoom(); tic.start(r);
  tic.applyMove(r, 'white', { index: 0 });
  assert.throws(() => tic.applyMove(r, 'black', { index: 0 }), /ILLEGAL_MOVE/);
});

test('win detection X', () => {
  const r = mkRoom(); tic.start(r);
  tic.applyMove(r, 'white', { index: 0 });
  tic.applyMove(r, 'black', { index: 3 });
  tic.applyMove(r, 'white', { index: 1 });
  tic.applyMove(r, 'black', { index: 4 });
  tic.applyMove(r, 'white', { index: 2 });
  assert.equal(r.game.status, 'finished');
  assert.equal(r.game.result.winner, 'w');
  assert.equal(r.game.result.reason, 'line');
});

test('draw detection', () => {
  const r = mkRoom(); tic.start(r);
  tic.applyMove(r, 'white', { index: 0 });
  tic.applyMove(r, 'black', { index: 1 });
  tic.applyMove(r, 'white', { index: 2 });
  tic.applyMove(r, 'black', { index: 4 });
  tic.applyMove(r, 'white', { index: 3 });
  tic.applyMove(r, 'black', { index: 5 });
  tic.applyMove(r, 'white', { index: 7 });
  tic.applyMove(r, 'black', { index: 6 });
  tic.applyMove(r, 'white', { index: 8 });
  assert.equal(r.game.status, 'finished');
  assert.equal(r.game.result.winner, null);
  assert.equal(r.game.result.reason, 'draw');
});

function mkTimedRoom() {
  return {
    game: tic.create(),
    timeControl: { initial: 180, increment: 2 },
    clocks: { white: 0, black: 0, activeSince: null, activeColor: null },
    rematchVotes: { white: false, black: false }
  };
}

test('clock switches turn and applies increment', () => {
  const r = mkTimedRoom(); tic.start(r);
  assert.equal(r.clocks.activeColor, 'w');
  tic.applyMove(r, 'white', { index: 0 });
  assert.equal(r.clocks.activeColor, 'b');
  assert.equal(r.clocks.white, 182000);
  tic.applyMove(r, 'black', { index: 4 });
  assert.equal(r.clocks.activeColor, 'w');
  assert.equal(r.clocks.black, 182000);
});

test('clock stops when game ends', () => {
  const r = mkTimedRoom(); tic.start(r);
  [[ 'white', 0 ], [ 'black', 3 ], [ 'white', 1 ], [ 'black', 4 ], [ 'white', 2 ]]
    .forEach(([s, i]) => tic.applyMove(r, s, { index: i }));
  assert.equal(r.game.status, 'finished');
  assert.equal(r.clocks.activeColor, null);
  assert.equal(r.clocks.activeSince, null);
});

test('move clears pending draw offer', () => {
  const r = mkRoom(); tic.start(r);
  tic.offerDraw(r, 'white');
  assert.ok(r.game.drawOffer);
  tic.applyMove(r, 'white', { index: 0 });
  assert.equal(r.game.drawOffer, null);
});

test('rejects non-integer index', () => {
  const r = mkRoom(); tic.start(r);
  assert.throws(() => tic.applyMove(r, 'white', { index: 1.5 }), /ILLEGAL_MOVE/);
  assert.throws(() => tic.applyMove(r, 'white', { index: NaN }), /ILLEGAL_MOVE/);
});
