let _scrollRaf = null;
let _scrollEl = null;
let _scrollSpeed = 30; // px/s
let _scrollPaused = false;
let _lastTs = null;

function scrollStart(el, speed) {
  scrollStop();
  _scrollEl = el;
  _scrollSpeed = speed || 30;
  _scrollPaused = false;
  _lastTs = null;
  _scrollRaf = requestAnimationFrame(_scrollTick);

  el.addEventListener('touchstart', _scrollPause, { passive: true });
  el.addEventListener('touchend', _scrollResume, { passive: true });
  el.addEventListener('touchcancel', _scrollResume, { passive: true });
}

function scrollStop() {
  if (_scrollRaf) { cancelAnimationFrame(_scrollRaf); _scrollRaf = null; }
  if (_scrollEl) {
    _scrollEl.removeEventListener('touchstart', _scrollPause);
    _scrollEl.removeEventListener('touchend', _scrollResume);
    _scrollEl.removeEventListener('touchcancel', _scrollResume);
    _scrollEl = null;
  }
  _lastTs = null;
}

function scrollIsRunning() { return !!_scrollRaf; }

function _scrollPause() { _scrollPaused = true; _lastTs = null; }
function _scrollResume() { _scrollPaused = false; }

function _scrollTick(ts) {
  if (!_scrollEl) return;
  if (!_scrollPaused) {
    if (_lastTs !== null) {
      const delta = (ts - _lastTs) / 1000;
      _scrollEl.scrollTop += _scrollSpeed * delta;
    }
    _lastTs = ts;
    const atBottom = _scrollEl.scrollHeight > _scrollEl.clientHeight &&
      _scrollEl.scrollTop + _scrollEl.clientHeight >= _scrollEl.scrollHeight - 4;
    if (atBottom) {
      scrollStop();
      document.getElementById('btn-scroll-toggle').classList.remove('active');
      return;
    }
  } else {
    _lastTs = null;
  }
  _scrollRaf = requestAnimationFrame(_scrollTick);
}
