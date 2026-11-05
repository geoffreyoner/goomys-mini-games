const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const pub = path.join(__dirname, '..', 'public');
const html = fs.readFileSync(path.join(pub, 'index.html'), 'utf8');
const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]));

test('every element id used by frontend JS exists in index.html', () => {
  const missing = [];
  for (const f of fs.readdirSync(path.join(pub, 'js'))) {
    if (!f.endsWith('.js')) continue;
    const src = fs.readFileSync(path.join(pub, 'js', f), 'utf8');
    const used = [
      ...src.matchAll(/getElementById\('([^']+)'\)/g),
      ...src.matchAll(/(?<![.\w])on\('([^']+)'/g),
      ...src.matchAll(/\bel\('([^']+)'\)/g)
    ].map(m => m[1]);
    for (const id of used) if (!ids.has(id)) missing.push(`${f}: #${id}`);
  }
  assert.deepEqual(missing, []);
});
