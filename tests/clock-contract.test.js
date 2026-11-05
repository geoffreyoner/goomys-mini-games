const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const timer = require('../src/services/timerService');

// The server's snapshot ALREADY has elapsed time subtracted. If the client subtracts
// (Date.now() - activeSince) again it double-counts and also trusts the wrong clock.
test('server snapshot clock is pre-decremented (client must only add time since receipt)', () => {
  const room = {
    timeControl: { initial: 600, increment: 0 },
    clocks: { white: 600000, black: 600000, activeSince: Date.now() - 30_000, activeColor: 'w' }
  };
  const snap = timer.getCurrentClocks(room);
  assert.ok(Math.abs(snap.white - 570_000) < 100);
  assert.equal(snap.black, 600_000);
});

test('client timer measures elapsed from receipt time, never from the server activeSince', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'timer.js'), 'utf8');
  assert.match(src, /_receivedAt/);
  assert.doesNotMatch(src, /Date\.now\(\)\s*-\s*clocks\.activeSince/);
  const game = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'game.js'), 'utf8');
  assert.match(game, /snapshot\._receivedAt\s*=\s*Date\.now\(\)/);
});
