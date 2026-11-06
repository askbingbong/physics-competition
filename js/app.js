(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  };
  const page = document.body.dataset.page;
  const learned = () => store.get('learned', {});
  const setLearned = (id, v) => { const l = learned(); if (v) l[id] = 1; else delete l[id]; store.set('learned', l); };
  const topicById = id => TOPICS.find(t => t.id === id);

  /* ---------- theme ---------- */
  const savedTheme = store.get('theme', null);
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;
  function toggleTheme() {
    const dark = document.documentElement.dataset.theme
      ? document.documentElement.dataset.theme === 'dark'
      : matchMedia('(prefers-color-scheme: dark)').matches;
    const next = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    store.set('theme', next);
  }

  /* ---------- header + drawer ---------- */
  function chrome() {
    const L = learned();
    const links = [
      ['index.html', 'Начало', 'home'], ['formulas.html', 'Формули', 'formulas'],
      ['practice.html', 'Тест', 'practice'], ['tips.html', 'Съвети', 'tips']
    ];
    const header = document.createElement('header');
    header.className = 'top';
    header.innerHTML = `<div class="wrap">
      <button class="btn-ic" id="menuBtn" aria-label="Меню">☰</button>
      <a class="brand" href="index.html"><b>Φ</b> Физика 9 клас</a>
      <nav class="nav">${links.map(l => `<a class="nl ${page === l[2] ? 'on' : ''}" href="${l[0]}">${l[1]}</a>`).join('')}</nav>
      <button class="btn-ic" id="themeBtn" aria-label="Тъмна / светла тема">◐</button></div>`;
    const scrim = document.createElement('div'); scrim.className = 'scrim';
    const drawer = document.createElement('aside'); drawer.className = 'drawer';
    const cur = new URLSearchParams(location.search).get('t');
    drawer.innerHTML = `<h4>Страници</h4>` +
      links.map(l => `<a class="${page === l[2] ? 'on' : ''}" href="${l[0]}">${l[1]}</a>`).join('') +
      `<h4>Теми</h4>` +
      TOPICS.map(t => `<a class="${page === 'topic' && cur === t.id ? 'on' : ''}" href="topic.html?t=${t.id}"><span>${t.icon}</span>${t.title}${L[t.id] ? '<span class="done">✓</span>' : ''}</a>`).join('');
    document.body.prepend(drawer); document.body.prepend(scrim); document.body.prepend(header);
    const close = () => document.body.classList.remove('menu');
    $('#menuBtn').onclick = () => document.body.classList.toggle('menu');
    $('#themeBtn').onclick = toggleTheme;
    scrim.onclick = close;
    drawer.addEventListener('click', e => { if (e.target.closest('a')) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    const f = document.createElement('footer');
    f.className = 'foot wrap';
    f.innerHTML = 'Учебен материал за подготовка. Винаги сверявай програмата и правилата с официалната обява на организаторите.';
    document.body.append(f);
  }

  /* ---------- home ---------- */
  function home() {
    const L = learned();
    const n = Object.keys(L).filter(k => topicById(k)).length;
    $('#progText').textContent = `${n} от ${TOPICS.length} теми научени`;
    $('#progBar').style.width = (100 * n / TOPICS.length) + '%';
    $('#topicGrid').innerHTML = TOPICS.map(t => `
      <a class="card tcard" href="topic.html?t=${t.id}">
        ${L[t.id] ? '<span class="ok">✓</span>' : ''}
        <div class="em">${t.icon}</div><h3>${t.title}</h3>
        ${t.ext ? '<span class="tag ext">разширение</span> ' : ''}
        <p>${t.lead}</p></a>`).join('');
    const all = TOPICS.flatMap(t => t.formulas.map(f => ({ t, f })));
    const day = Math.floor(Date.now() / 864e5) % all.length;
    const pick = all[day];
    $('#fday').innerHTML = `<div class="frow"><span class="fn">${pick.t.icon} ${pick.t.title} · ${pick.f[0]}</span><span class="fx">${pick.f[1]}</span><span class="fd">${pick.f[2]}</span></div>`;
  }

  /* ---------- topic ---------- */
  function formulaRows(list) {
    return list.map(f => `<div class="frow"><span class="fn">${f[0]}</span><span class="fx">${f[1]}</span>${f[2] ? `<span class="fd">${f[2]}</span>` : ''}</div>`).join('');
  }
  function topic() {
    const id = new URLSearchParams(location.search).get('t');
    const i = TOPICS.findIndex(t => t.id === id);
    const root = $('#topic');
    if (i < 0) { root.innerHTML = '<p>Темата не е намерена. <a href="index.html">Към началото</a></p>'; return; }
    const t = TOPICS[i];
    document.title = t.title + ' – Физика 9 клас';
    const secs = [['key', 'Накратко']];
    t.blocks.forEach((b, k) => secs.push(['b' + k, b.h]));
    secs.push(['f', 'Формули'], ['ex', 'Задачи'], ['err', 'Грешки и трикове']);
    const prev = TOPICS[i - 1], next = TOPICS[i + 1];
    root.innerHTML = `
      <p class="crumb"><a href="index.html">Начало</a> › ${t.title}</p>
      <h1 class="tt">${t.icon} ${t.title}</h1>
      <p class="lead">${t.ext ? '<span class="tag ext">разширение</span> ' : ''}${t.lead}</p>
      <div class="toc" id="toc">${secs.map(s => `<a href="#${s[0]}">${s[1]}</a>`).join('')}</div>
      <section class="blk" id="key"><div class="card key"><h3>🎯 Най-важното</h3><ul>${t.key.map(k => `<li>${k}</li>`).join('')}</ul></div></section>
      ${t.blocks.map((b, k) => `<section class="blk" id="b${k}"><div class="card"><h3>${b.h}</h3>${b.html}</div></section>`).join('')}
      <section class="blk" id="f"><h2>📐 Формули</h2><div class="ftab cols">${formulaRows(t.formulas)}</div></section>
      <section class="blk" id="ex"><h2>✍️ Решени задачи</h2><div class="stack">
        ${t.examples.map((e, k) => `<details class="ex"><summary>Задача ${k + 1}. ${e.q}</summary><div class="sol">${e.s}</div></details>`).join('')}
      </div><p style="margin-top:12px"><a class="btn" href="practice.html?t=${t.id}">Тест по тази тема →</a></p></section>
      <section class="blk" id="err"><div class="stack">
        <div class="card warn"><h3>⚠️ Типични грешки</h3><ul>${t.mistakes.map(m => `<li>${m}</li>`).join('')}</ul></div>
        <div class="card trick"><h3>💡 Трикове</h3><ul>${t.tricks.map(m => `<li>${m}</li>`).join('')}</ul></div>
      </div></section>
      <label class="card learn"><input type="checkbox" id="lc"> <span><b>Научих тази тема</b><br><small style="color:var(--muted)">Отбелязва се само на това устройство</small></span></label>
      <div class="pager">${prev ? `<a class="btn" href="topic.html?t=${prev.id}">← ${prev.title}</a>` : '<span></span>'}${next ? `<a class="btn p" href="topic.html?t=${next.id}">${next.title} →</a>` : ''}</div>`;
    const lc = $('#lc'); lc.checked = !!learned()[t.id];
    lc.onchange = () => { setLearned(t.id, lc.checked); $$('.drawer a').forEach(a => { if (a.getAttribute('href') === 'topic.html?t=' + t.id) { const d = $('.done', a); if (lc.checked && !d) a.insertAdjacentHTML('beforeend', '<span class="done">✓</span>'); if (!lc.checked && d) d.remove(); } }); };
    // подчертаване на активния раздел
    const links = $$('#toc a');
    const io = new IntersectionObserver(es => {
      es.forEach(e => { if (e.isIntersecting) { links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id)); const on = $('#toc a.on'); if (on) on.scrollIntoView({ block: 'nearest', inline: 'center' }); } });
    }, { rootMargin: '-30% 0px -60% 0px' });
    $$('section.blk').forEach(s => io.observe(s));
  }

  /* ---------- formulas ---------- */
  function formulas() {
    const root = $('#fl');
    const total = TOPICS.reduce((a, t) => a + t.formulas.length, 0);
    $('#fcount').textContent = total;
    root.innerHTML = TOPICS.map(t => `<div class="fg" id="g-${t.id}" data-t="${t.id}"><h2>${t.icon} ${t.title}${t.ext ? ' <span class="tag ext">разширение</span>' : ''}</h2><div class="ftab cols">${formulaRows(t.formulas)}</div></div>`).join('');
    $('#chips').innerHTML = `<button class="chip on" data-f="all">Всички</button>` + TOPICS.map(t => `<button class="chip" data-f="${t.id}">${t.icon} ${t.title.split(' ')[0].replace(/[,:]/g, '')}</button>`).join('');
    const apply = () => {
      const q = $('#q').value.trim().toLowerCase();
      const f = $('.chip.on').dataset.f;
      let shown = 0;
      $$('.fg').forEach(g => {
        let any = 0;
        $$('.frow', g).forEach(r => {
          const ok = (!q || r.textContent.toLowerCase().includes(q));
          r.classList.toggle('hide', !ok); if (ok) any++;
        });
        const vis = any > 0 && (f === 'all' || g.dataset.t === f);
        g.classList.toggle('hide', !vis); if (vis) shown += any;
      });
      $('#consts').classList.toggle('hide', !!q || f !== 'all');
      $('#none').classList.toggle('hide', shown > 0);
    };
    $('#q').addEventListener('input', apply);
    $('#chips').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; $$('.chip').forEach(c => c.classList.remove('on')); b.classList.add('on'); apply(); window.scrollTo({ top: 0 }); });
    $('#printBtn').onclick = () => window.print();
  }

  /* ---------- practice ---------- */
  function practice() {
    const root = $('#quiz');
    const param = new URLSearchParams(location.search).get('t');
    const opts = `<option value="all">Всички теми</option>` + TOPICS.filter(t => QUIZ.some(q => q.t === t.id)).map(t => `<option value="${t.id}" ${t.id === param ? 'selected' : ''}>${t.icon} ${t.title}</option>`).join('');
    let set = [], idx = 0, score = 0, wrong = [];
    const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    function start() {
      root.innerHTML = `<div class="card"><h3>Настройки</h3>
        <p><label>Тема<br><select id="sel" class="fsearch">${opts}</select></label></p>
        <p><label>Брой въпроси<br><select id="cnt" class="fsearch"><option>10</option><option>20</option><option value="999">Всички</option></select></label></p>
        <button class="btn p" id="go" style="width:100%">Започни</button></div>
        <p class="lead" style="margin-top:12px">В базата има ${QUIZ.length} въпроса. Смятай g = 10 m/s². Най-добре е първо да решиш на лист, после да избереш отговор.</p>`;
      $('#go').onclick = () => {
        const f = $('#sel').value;
        set = shuffle(QUIZ.filter(q => f === 'all' || q.t === f)).slice(0, +$('#cnt').value);
        idx = 0; score = 0; wrong = []; show();
      };
    }
    function show() {
      const q = set[idx];
      const order = shuffle(q.o.map((o, i) => [o, i]));
      root.innerHTML = `<div class="qbar"><span>Въпрос ${idx + 1} / ${set.length}</span><span>Верни: ${score}</span></div>
        <div class="prog"><i style="width:${100 * idx / set.length}%"></i></div>
        <div class="card"><div class="q">${q.q}</div><div class="opts">${order.map(([o, i]) => `<button class="opt" data-i="${i}">${o}</button>`).join('')}</div>
        <div id="fb"></div></div>`;
      $$('.opt').forEach(b => b.onclick = () => {
        const ok = +b.dataset.i === q.a;
        $$('.opt').forEach(x => { x.disabled = true; if (+x.dataset.i === q.a) x.classList.add('good'); });
        if (!ok) { b.classList.add('bad'); wrong.push(q); } else score++;
        $('#fb').innerHTML = `<div class="note expl"><b>${ok ? '✅ Вярно!' : '❌ Грешно.'}</b> ${q.e}</div>
          <button class="btn p" id="nx" style="width:100%;margin-top:10px">${idx + 1 < set.length ? 'Следващ' : 'Резултат'}</button>`;
        $('#nx').onclick = () => { idx++; idx < set.length ? show() : done(); };
        $('#nx').scrollIntoView({ block: 'nearest' });
      });
    }
    function done() {
      const pct = Math.round(100 * score / set.length);
      const best = store.get('best', 0); if (pct > best) store.set('best', pct);
      root.innerHTML = `<div class="card"><div class="score">${score} / ${set.length}</div>
        <p style="text-align:center">${pct}% · ${pct >= 80 ? 'Отлично! 🎉' : pct >= 50 ? 'Добре, но има какво да се подобри.' : 'Върни се към теорията и опитай пак.'}</p>
        ${wrong.length ? `<h3>Грешни отговори – за преговор</h3><ul>${wrong.map(q => `<li><b>${topicById(q.t).title}:</b> ${q.q}<br><small>${q.e}</small></li>`).join('')}</ul>` : ''}
        <div class="cta" style="margin-top:12px"><button class="btn p" id="again">Нов тест</button><a class="btn" href="index.html">Начало</a></div></div>`;
      $('#again').onclick = start;
    }
    start();
  }

  /* ---------- init ---------- */
  chrome();
  ({ home, topic, formulas, practice }[page] || (() => {}))();
})();
