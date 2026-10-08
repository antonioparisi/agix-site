// The Agix site: the bus in the hero, clips that play when seen, the enlarged view, copy.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  document.documentElement.classList.add('js');

  // ---------------------------------------------------------------- the bus
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.getElementById('bus-svg');
  const C = { x: 280, y: 230 };
  const AGENTS = [
    { id: 'you', ini: 'You', name: 'You', role: 'approver', c: 'var(--acc)', a: -90 },
    { id: 'pm', ini: 'PM', name: 'pm', role: 'Claude Code', c: 'var(--k-pm)', a: -30 },
    { id: 'atlas', ini: 'AT', name: 'atlas', role: 'Claude Code', c: 'var(--k-handoff)', a: 30 },
    { id: 'echo', ini: 'EC', name: 'echo', role: 'Pi', c: 'var(--k-question)', a: 90 },
    { id: 'sage', ini: 'SA', name: 'sage', role: 'Claude Code', c: 'var(--k-review)', a: 150 },
    { id: 'nova', ini: 'NO', name: 'nova', role: 'Codex', c: 'var(--k-task)', a: 210 },
  ];
  const KIND = { task: 'var(--k-task)', question: 'var(--k-question)', answer: 'var(--k-handoff)', handoff: 'var(--k-handoff)', review: 'var(--k-review)', approval: 'var(--acc)', note: 'var(--mu)' };
  const SCRIPT = [
    ['you', 'pm', 'approval', 'Plan v1 approved. Start the crew.'],
    ['pm', 'atlas', 'task', 'T1 and T2 are yours: stream /orders/export.'],
    ['pm', 'nova', 'task', 'T3: an Export button that keeps the filters.'],
    ['atlas', 'pm', 'question', 'Totals in cents or decimals?'],
    ['pm', 'atlas', 'answer', 'Decimals, two places, as the page shows.'],
    ['nova', 'you', 'question', 'Date range in the file name?'],
    ['you', 'nova', 'answer', 'Yes: orders-<from>_<to>.csv'],
    ['atlas', 'echo', 'handoff', 'T2 is done: toCsv() streams rows.'],
    ['echo', 'pm', 'note', '14 tests pass, empty range included.'],
    ['sage', 'pm', 'review', 'Approve. field() is small and tested.'],
    ['pm', 'you', 'approval', 'Ready to merge: 3 worktrees, in order.'],
  ];
  if (svg) {
    const R = 190;
    const pos = Object.fromEntries(AGENTS.map((g) => [g.id, { x: C.x + R * Math.cos(g.a * Math.PI / 180), y: C.y + R * Math.sin(g.a * Math.PI / 180) }]));
    const el = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); parent?.append(e); return e; };
    const links = document.getElementById('bus-links');
    const nodes = document.getElementById('bus-nodes');
    const packets = document.getElementById('bus-packets');
    const lines = {};
    const groups = {};
    for (const g of AGENTS) {
      const p = pos[g.id];
      lines[g.id] = el('line', { x1: C.x, y1: C.y, x2: p.x, y2: p.y, class: 'link', style: `--c:${g.c}` }, links);
      const n = el('g', { class: 'node', style: `--c:${g.c}` }, nodes);
      el('circle', { cx: p.x, cy: p.y, r: 38, class: 'halo' }, n);
      el('circle', { cx: p.x, cy: p.y, r: 26, class: 'ring' }, n);
      el('text', { x: p.x, y: p.y, class: 'ini' }, n).textContent = g.ini;
      // Names under the lower agents, over the upper ones; never over the ring.
      const below = g.a > 0 && g.a < 180;
      const nameY = below ? p.y + 46 : p.y - 56;
      const roleY = below ? p.y + 61 : p.y - 40;
      if (g.id !== 'you') el('text', { x: p.x, y: nameY, class: 'nm' }, n).textContent = g.name;
      el('text', { x: p.x, y: g.id === 'you' ? p.y - 40 : roleY, class: 'rl' }, n).textContent = g.role;
      groups[g.id] = n;
    }
    const feed = document.getElementById('bus-feed');
    const count = document.getElementById('bus-count');
    let sent = 0;
    const name = (id) => (id === 'you' ? 'you' : id);
    const ROWS = 4;
    // Newest on top: the others glide down a row, and the oldest fades out below the last one.
    const place = () => [...feed.children].forEach((li, n) => li.style.setProperty('--i', String(n)));
    const addFeed = ([from, to, kind, body], still = false) => {
      const li = document.createElement('li');
      li.style.setProperty('--c', KIND[kind]);
      li.innerHTML = `<span class="who">${name(from)} → ${name(to)} · <span class="kind">${kind}</span></span><span class="body"></span>`;
      li.querySelector('.body').textContent = body;
      if (!still) li.classList.add('entering');
      feed.prepend(li);
      place();
      if (!still) requestAnimationFrame(() => requestAnimationFrame(() => li.classList.remove('entering')));
      for (const old of [...feed.children].slice(ROWS)) {
        if (still) { old.remove(); continue; }
        old.classList.add('leaving');
        setTimeout(() => old.remove(), 500);
      }
      sent++;
      count.textContent = `${sent} message${sent === 1 ? '' : 's'}`;
    };
    const fly = (msg) => new Promise((done) => {
      const [from, to, kind] = msg;
      const a = pos[from]; const b = pos[to];
      const dot = el('circle', { r: 6, class: 'packet', style: `--c:${KIND[kind]}`, cx: a.x, cy: a.y }, packets);
      lines[from].classList.add('hot'); lines[to].classList.add('hot');
      groups[from].classList.add('on');
      const t0 = performance.now(); const dur = 1300;
      const step = (now) => {
        const t = Math.min(1, (now - t0) / dur);
        // From the sender to the bus, then from the bus to the receiver.
        const half = t < 0.5; const u = half ? t * 2 : (t - 0.5) * 2;
        const e = u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2;
        const p = half ? { x: a.x + (C.x - a.x) * e, y: a.y + (C.y - a.y) * e } : { x: C.x + (b.x - C.x) * e, y: C.y + (b.y - C.y) * e };
        dot.setAttribute('cx', p.x); dot.setAttribute('cy', p.y);
        if (!half) { groups[from].classList.remove('on'); groups[to].classList.add('on'); }
        if (t < 1) requestAnimationFrame(step);
        else {
          dot.remove(); lines[from].classList.remove('hot'); lines[to].classList.remove('hot');
          setTimeout(() => groups[to].classList.remove('on'), 400);
          done();
        }
      };
      requestAnimationFrame(step);
    });
    let i = 0; let running = false;
    const loop = async () => {
      if (running) return;
      running = true;
      while (!reduce.matches && !document.hidden) {
        const msg = SCRIPT[i % SCRIPT.length];
        await fly(msg);
        addFeed(msg);
        i++;
        await new Promise((r) => setTimeout(r, 650));
      }
      running = false;
    };
    // Still: the latest few messages, nothing moving.
    // The page opens with the feed already full, as it would be mid-run: the last messages of the script.
    for (const m of SCRIPT.slice(-ROWS)) addFeed(m, true);
    if (!reduce.matches) loop();
    document.addEventListener('visibilitychange', () => { if (!document.hidden && !reduce.matches) loop(); });
    reduce.addEventListener('change', () => { if (!reduce.matches) loop(); });
  }

  // ---------------------------------------------------------------- clips
  const clips = [...document.querySelectorAll('.clip video')];
  const manual = new Set();
  const stopAll = () => {
    for (const v of clips) {
      v.pause();
      v.removeAttribute('autoplay');
      v.closest('.clip').classList.add('paused');
      // Back to the poster.
      if (v.currentTime > 0) v.load();
    }
  };
  const visible = new Set();
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    for (const e of entries) {
      const v = e.target;
      if (e.isIntersecting) visible.add(v); else visible.delete(v);
      if (reduce.matches && !manual.has(v)) continue;
      if (e.isIntersecting) v.play().catch(() => {}); else v.pause();
    }
  }, { rootMargin: '120px 0px' }) : null;
  for (const v of clips) {
    io?.observe(v);
    v.addEventListener('play', () => v.closest('.clip').classList.remove('paused'));
    v.addEventListener('click', () => open(v));
    v.closest('.clip').querySelector('.expand')?.addEventListener('click', () => open(v));
  }
  if (reduce.matches) stopAll();
  reduce.addEventListener('change', () => { if (reduce.matches) stopAll(); else for (const v of visible) v.play().catch(() => {}); });

  // ---------------------------------------------------------------- enlarged view
  const box = document.getElementById('lightbox');
  const big = document.getElementById('lb-video');
  const title = document.getElementById('lb-title');
  function open(v) {
    if (!box?.showModal) return;
    big.innerHTML = v.innerHTML;
    big.poster = v.poster;
    big.setAttribute('aria-label', v.getAttribute('aria-label') ?? '');
    title.textContent = v.closest('.clip').querySelector('.chrome-t')?.textContent ?? '';
    big.load();
    box.showModal();
    big.play().catch(() => {});
    if (reduce.matches) big.controls = true;
  }
  document.getElementById('lb-close')?.addEventListener('click', () => box.close());
  box?.addEventListener('click', (e) => { if (e.target === box) box.close(); });
  box?.addEventListener('close', () => { big.pause(); big.removeAttribute('src'); big.innerHTML = ''; });

  // ---------------------------------------------------------------- back to top
  // The header is sticky, so a link to it scrolls nowhere: these go to the start of the page.
  for (const a of document.querySelectorAll('a[href="#top"]')) {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduce.matches ? 'auto' : 'smooth' });
      document.querySelector('.top .brand')?.focus({ preventScroll: true });
    });
  }

  // ---------------------------------------------------------------- copy
  for (const b of document.querySelectorAll('[data-copy]')) {
    b.addEventListener('click', async () => {
      const text = [...document.getElementById(b.dataset.copy).textContent.split('\n')].filter((l) => l.startsWith('$ ')).map((l) => l.slice(2)).join('\n');
      try { await navigator.clipboard.writeText(text); b.textContent = 'Copied'; } catch { b.textContent = 'Select and copy'; }
      setTimeout(() => (b.textContent = 'Copy'), 1600);
    });
  }

})();
