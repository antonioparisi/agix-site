// The Agix site: the bus in the hero, clips that play when seen, the enlarged view, copy.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  document.documentElement.classList.add('js');

  // ---------------------------------------------------------------- the bus
  // A real crew, by role, on the runtimes it mixes: each says what it is doing, as in Mission control.
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.getElementById('bus-svg');
  const C = { x: 350, y: 262 };
  const RT = { claude: 'var(--rt-claude)', codex: 'var(--rt-codex)', pi: 'var(--rt-pi)', you: 'var(--acc)' };
  const AGENTS = [
    { id: 'you', ini: 'You', name: 'You', rt: 'you', runtime: 'approves and merges', status: 'reading the plan' },
    { id: 'pm', ini: 'PM', name: 'PM', rt: 'claude', runtime: 'Claude Code', status: 'planning' },
    { id: 'dev1', ini: 'D1', name: 'Dev 1', rt: 'claude', runtime: 'Claude Code', status: 'waiting for a task' },
    { id: 'dev2', ini: 'D2', name: 'Dev 2', rt: 'codex', runtime: 'Codex', status: 'waiting for a task' },
    { id: 'qa', ini: 'QA', name: 'QA', rt: 'pi', runtime: 'Pi', status: 'writing tests' },
    { id: 'review', ini: 'RV', name: 'Reviewer', rt: 'claude', runtime: 'Claude Code', status: 'reading the diff' },
    { id: 'perf', ini: 'PF', name: 'Performance', rt: 'codex', runtime: 'Codex', status: 'profiling' },
  ];
  const label = Object.fromEntries(AGENTS.map((g) => [g.id, g.name]));
  const KIND = { task: 'var(--k-task)', question: 'var(--k-question)', answer: 'var(--k-handoff)', handoff: 'var(--k-handoff)', review: 'var(--k-review)', approval: 'var(--acc)', note: 'var(--mu)' };
  // [from, to, kind, what it says, what each agent is doing once it has]
  const SCRIPT = [
    ['you', 'pm', 'approval', 'Plan v1 approved. Start the crew.', { you: 'watching', pm: 'assigning tasks' }],
    ['pm', 'dev1', 'task', 'T1: stream /orders/export as CSV.', { dev1: 'editing export.ts' }],
    ['pm', 'dev2', 'task', 'T2: an Export button that keeps the filters.', { dev2: 'editing ExportButton.tsx', pm: 'answering questions' }],
    ['dev1', 'you', 'question', 'Totals in cents or decimals?', { dev1: 'waiting on you', you: 'answering' }],
    ['you', 'dev1', 'answer', 'Decimals, two places, as the page shows.', { dev1: 'editing export.ts', you: 'watching' }],
    ['dev1', 'qa', 'handoff', 'T1 is done: toCsv() streams rows.', { dev1: 'done · proven', qa: 'running tests' }],
    ['perf', 'dev2', 'review', 'The filter runs once per row: hoist it.', { perf: 'waiting on Dev 2', dev2: 'fixing the loop' }],
    ['dev2', 'perf', 'answer', 'Hoisted: 40 ms instead of 900 ms.', { dev2: 'done · proven', perf: 'done' }],
    ['qa', 'pm', 'note', '14 tests pass, empty range included.', { qa: 'done · proven' }],
    ['review', 'pm', 'review', 'Approve: small, tested, readable.', { review: 'done' }],
    ['pm', 'you', 'approval', 'Ready to merge: 3 worktrees, in order.', { pm: 'done', you: 'merging' }],
  ];
  if (svg) {
    const R = 172;
    const pos = Object.fromEntries(AGENTS.map((g, k) => {
      const a = -90 + (360 / AGENTS.length) * k;
      return [g.id, { a, x: C.x + R * Math.cos(a * Math.PI / 180), y: C.y + R * Math.sin(a * Math.PI / 180) }];
    }));
    const el = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); parent?.append(e); return e; };
    const links = document.getElementById('bus-links');
    const nodes = document.getElementById('bus-nodes');
    const packets = document.getElementById('bus-packets');
    const lines = {}; const groups = {}; const statusOf = {}; const typing = {};
    for (const g of AGENTS) {
      const p = pos[g.id];
      const c = RT[g.rt];
      lines[g.id] = el('line', { x1: C.x, y1: C.y, x2: p.x, y2: p.y, class: 'link', style: `--c:${c}` }, links);
      const n = el('g', { class: 'node', style: `--c:${c}` }, nodes);
      el('circle', { cx: p.x, cy: p.y, r: 34, class: 'halo' }, n);
      el('circle', { cx: p.x, cy: p.y, r: 24, class: 'ring' }, n);
      el('text', { x: p.x, y: p.y, class: 'ini' }, n).textContent = g.ini;
      // The label sits outside the ring, along the agent's own direction: never over a node or a link.
      const cos = Math.cos(p.a * Math.PI / 180); const sin = Math.sin(p.a * Math.PI / 180);
      const side = Math.abs(cos) < 0.3 ? 'middle' : cos > 0 ? 'start' : 'end';
      const lx = p.x + cos * 38 + (side === 'middle' ? 0 : 0);
      const top = sin < -0.3 ? p.y - 70 : sin > 0.3 ? p.y + 44 : p.y - 16;
      const t = el('text', { x: lx, y: top, class: 'lbl', 'text-anchor': side }, n);
      el('tspan', { x: lx, dy: 0, class: 'nm' }, t).textContent = g.name;
      el('tspan', { x: lx, dy: 15, class: 'rl' }, t).textContent = g.runtime;
      statusOf[g.id] = el('tspan', { x: lx, dy: 16, class: 'st' }, t);
      statusOf[g.id].textContent = g.status;
      groups[g.id] = n;
    }
    // A status changes the way an agent's line does in Mission control: typed out, not swapped.
    const setStatus = (id, text, still) => {
      const s = statusOf[id];
      if (!s || s.textContent === text) return;
      clearInterval(typing[id]);
      groups[id].classList.toggle('done', /done/.test(text));
      if (still) { s.textContent = text; return; }
      let k = 0;
      s.textContent = '';
      typing[id] = setInterval(() => { s.textContent = text.slice(0, ++k); if (k >= text.length) clearInterval(typing[id]); }, 28);
    };
    const feed = document.getElementById('bus-feed');
    const count = document.getElementById('bus-count');
    let sent = 0;
    const ROWS = 4;
    // Newest on top: the others glide down a row, and the oldest fades out below the last one.
    const place = () => [...feed.children].forEach((li, n) => li.style.setProperty('--i', String(n)));
    const addFeed = ([from, to, kind, body], still = false) => {
      const li = document.createElement('li');
      li.style.setProperty('--c', KIND[kind]);
      li.innerHTML = `<span class="who">${label[from]} → ${label[to]} · <span class="kind">${kind}</span></span><span class="body"></span>`;
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
    // A message flies from its sender to the bus and on to its receiver, with a short fading trail.
    const fly = (msg) => new Promise((done) => {
      const [from, to, kind] = msg;
      const a = pos[from]; const b = pos[to];
      const trail = [0.45, 0.3, 0.18, 0.1].map((o, k) => el('circle', { r: 5 - k, class: 'packet trail', style: `--c:${KIND[kind]};opacity:${o}`, cx: a.x, cy: a.y }, packets));
      const dot = el('circle', { r: 6, class: 'packet', style: `--c:${KIND[kind]}`, cx: a.x, cy: a.y }, packets);
      const past = [];
      lines[from].classList.add('hot'); lines[to].classList.add('hot');
      groups[from].classList.add('on');
      const t0 = performance.now(); const dur = 1400;
      const step = (now) => {
        const t = Math.min(1, (now - t0) / dur);
        const half = t < 0.5; const u = half ? t * 2 : (t - 0.5) * 2;
        const e = u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2;
        const p = half ? { x: a.x + (C.x - a.x) * e, y: a.y + (C.y - a.y) * e } : { x: C.x + (b.x - C.x) * e, y: C.y + (b.y - C.y) * e };
        dot.setAttribute('cx', p.x); dot.setAttribute('cy', p.y);
        past.unshift(p); past.length = Math.min(past.length, 16);
        trail.forEach((c, k) => { const q = past[(k + 1) * 3] ?? past.at(-1); c.setAttribute('cx', q.x); c.setAttribute('cy', q.y); });
        if (!half) { groups[from].classList.remove('on'); groups[to].classList.add('on'); }
        if (t < 1) requestAnimationFrame(step);
        else {
          dot.remove(); trail.forEach((c) => c.remove());
          lines[from].classList.remove('hot'); lines[to].classList.remove('hot');
          setTimeout(() => groups[to].classList.remove('on'), 500);
          done();
        }
      };
      requestAnimationFrame(step);
    });
    const reset = () => AGENTS.forEach((g) => setStatus(g.id, g.status, true));
    let i = 0; let running = false;
    const loop = async () => {
      if (running) return;
      running = true;
      while (!reduce.matches && !document.hidden) {
        const msg = SCRIPT[i % SCRIPT.length];
        if (i % SCRIPT.length === 0 && i > 0) { reset(); await new Promise((r) => setTimeout(r, 900)); }
        await fly(msg);
        addFeed(msg);
        for (const [id, text] of Object.entries(msg[4])) setStatus(id, text, false);
        i++;
        await new Promise((r) => setTimeout(r, 900));
      }
      running = false;
    };
    // The page opens with the feed already full, as it would be mid-run: the last messages of the script.
    for (const m of SCRIPT.slice(-ROWS)) addFeed(m, true);
    if (reduce.matches) {
      // Still: the crew as it stands at the end of the run.
      for (const m of SCRIPT) for (const [id, text] of Object.entries(m[4])) setStatus(id, text, true);
    } else loop();
    document.addEventListener('visibilitychange', () => { if (!document.hidden && !reduce.matches) loop(); });
    reduce.addEventListener('change', () => { if (!reduce.matches) loop(); });
  }

  // ---------------------------------------------------------------- clips
  const clips = [...document.querySelectorAll('.clip video')];

  // Each clip comes in a few widths, scaled down ahead of time so text stays crisp: the browser
  // shrinks video crudely, and a 2560-wide clip drawn 750 pixels wide on a non-Retina screen blurs.
  // The width picked is the smallest at least as wide as the clip is drawn, in device pixels.
  const SIZES = { phone: [390, 780] };
  const nameOf = (v) => (v.getAttribute('poster') || '').replace(/^media\//, '').replace(/\.png$/, '');
  const sizesOf = (name) => SIZES[name] ?? [1280, 1920, 2560];
  const full = (name) => sizesOf(name).at(-1);
  const sourcesFor = (name, w) => {
    const file = w === full(name) ? name : `${name}-${w}`;
    return `<source src="media/${file}.webm" type="video/webm"><source src="media/${file}.mp4" type="video/mp4">`;
  };
  const pick = (v) => {
    const name = nameOf(v);
    if (!name) return;
    const need = v.getBoundingClientRect().width * (window.devicePixelRatio || 1);
    const w = sizesOf(name).find((s) => s >= need * 0.95) ?? full(name);
    if (v.dataset.w === String(w)) return;
    const playing = !v.paused;
    v.dataset.w = String(w);
    v.innerHTML = sourcesFor(name, w);
    v.load();
    if (playing) v.play().catch(() => {});
  };
  for (const v of clips) pick(v);
  let again = 0;
  const repick = () => { clearTimeout(again); again = setTimeout(() => clips.forEach(pick), 200); };
  addEventListener('resize', repick);
  // Moved to a screen of another density: the same layout needs another width.
  const watchDensity = () => matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`).addEventListener('change', () => { repick(); watchDensity(); }, { once: true });
  watchDensity();
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
    // Enlarged, it gets the full width, whatever the page shows.
    big.innerHTML = nameOf(v) ? sourcesFor(nameOf(v), full(nameOf(v))) : v.innerHTML;
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

  // ---------------------------------------------------------------- effects
  // The flow line draws once the steps come into view (they are readable before, and without it).
  const steps = document.querySelector('.steps');
  steps?.querySelectorAll('.step').forEach((s, n) => s.style.setProperty('--n', String(n)));
  if (steps && 'IntersectionObserver' in window && !reduce.matches) {
    const so = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { steps.classList.add('drawn'); so.disconnect(); } }, { threshold: 0.35 });
    so.observe(steps);
  }
  // The light on a bridge card follows the pointer.
  for (const card of document.querySelectorAll('.b-card')) {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  }
})();
