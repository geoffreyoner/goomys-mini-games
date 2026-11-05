import { connect, getSocket } from './socket.js';
import { initTheme } from './utils.js';
import { initLobby, showLobby } from './lobby.js';
import { initBoard } from './board.js';
import { initGame } from './game.js';
import { initDialogs } from './dialogs.js';
import { initHistory } from './history.js';
import { initTabs } from './ui.js';
import { toggleMute, getIsMuted } from './audio.js';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      reg.update();
    }).catch(err => {
      console.log('SW registration failed: ', err);
    });
  });
}

initTheme();

const muteBtn = document.getElementById('mute-toggle');
const iconOn = document.getElementById('icon-sound-on');
const iconOff = document.getElementById('icon-sound-off');

function updateMuteIcon() {
  if (getIsMuted()) {
    iconOn.style.display = 'none';
    iconOff.style.display = 'block';
  } else {
    iconOn.style.display = 'block';
    iconOff.style.display = 'none';
  }
}

updateMuteIcon();

muteBtn.addEventListener('click', () => {
  toggleMute();
  updateMuteIcon();
});

connect();
const socket = getSocket();

const countEl = document.getElementById('online-count');
let prevCount = -1;

socket.on('online:count', (count) => {
  if (!countEl) return;
  
  countEl.textContent = count;
  
  if (prevCount !== -1 && count !== prevCount) {
    countEl.classList.remove('pop');
    void countEl.offsetWidth;
    countEl.classList.add('pop');
    
    setTimeout(() => {
      countEl.classList.remove('pop');
    }, 300);
  }
  
  prevCount = count;
});

function safeInit(name, fn) {
  try { fn(); } catch (err) { console.error(`[init] ${name} failed:`, err); }
}

safeInit('lobby', initLobby);
safeInit('board', initBoard);
safeInit('dialogs', initDialogs);
safeInit('history', initHistory);
safeInit('tabs', initTabs);
safeInit('game', initGame);

const params = new URLSearchParams(location.search);
const urlRoom = params.has('room')
  ? (params.get('room') || '').trim().toUpperCase().slice(0, 5)
  : '';

let saved = null;
try { saved = JSON.parse(sessionStorage.getItem('reconnect') || 'null'); } catch (_) {}

if (saved && urlRoom && saved.roomCode !== urlRoom) {
  try { sessionStorage.removeItem('reconnect'); } catch (_) {}
  saved = null;
}

if (urlRoom) {
  const input = document.getElementById('join-code');
  if (input) input.value = urlRoom;
}

if (!saved) {
  showLobby();
  if (urlRoom) {
    const nameInput = document.getElementById('join-name');
    if (nameInput) {
      if (!nameInput.value) nameInput.focus();
      nameInput.scrollIntoView({ block: 'center' });
    }
  }
}