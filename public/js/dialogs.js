import { getSocket } from './socket.js';
import { toast, copyText, confirm } from './utils.js';

function on(id, evt, fn) {
  const el = document.getElementById(id);
  if (el) el.addEventListener(evt, fn);
}

export function initDialogs() {
  on('draw-accept', 'click', () => {
    document.getElementById('modal-draw').hidden = true;
    getSocket().emit('game:respondDraw', { accept: true }, (res) => {
      if (!res || !res.ok) toast((res && res.error) || 'Failed', 'error');
    });
  });
  on('draw-decline', 'click', () => {
    document.getElementById('modal-draw').hidden = true;
    getSocket().emit('game:respondDraw', { accept: false }, () => {});
  });
}

export { toast, copyText, confirm };