(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt = (n, d) => n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });

  /* ---------- menu mobile ---------- */
  const menuBtn = $('.menu-btn');
  const menu = $('#menu');
  const setMenu = open => {
    menuBtn.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('is-open', open);
    $('.sr-only', menuBtn).textContent = open ? 'Fechar menu' : 'Abrir menu';
  };
  menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- barra de progresso + parallax ---------- */
  const bar = $('.progress span');
  const heroImg = $('.hero__bg img');
  let ticking = false;
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.setProperty('--p', max > 0 ? scrollY / max : 0);
    if (!reduceMotion && scrollY < innerHeight) heroImg.style.setProperty('--parallax', `${scrollY * 0.18}px`);
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  onScroll();

  /* ---------- capítulo ativo no menu ---------- */
  const links = $$('#menu a[href^="#"]');
  const byId = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
  const spy = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      links.forEach(a => a.classList.remove('is-active'));
      byId.get(en.target.id)?.classList.add('is-active');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  byId.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });

  /* ---------- waffle chart (1.000 prensadas / 100 vendidas) ---------- */
  const waffle = $('.waffle__grid');
  if (waffle) {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 100; i++) {
      const cell = document.createElement('i');
      if (i < 10) { cell.className = 'sold'; cell.style.transitionDelay = `${i * 70}ms`; }
      frag.appendChild(cell);
    }
    waffle.appendChild(frag);
  }

  /* ---------- contadores ---------- */
  const countUp = el => {
    const target = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.decimals || '0', 10);
    if (reduceMotion) { el.textContent = fmt(target, dec); return; }
    const dur = 1400, t0 = performance.now();
    const step = t => {
      const k = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(target * eased, dec);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  /* ---------- revelar ao rolar ---------- */
  const revealTargets = $$('.reveal, .waffle, .console, .sales, [data-count]');
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      if (en.target.dataset.count) countUp(en.target);
      io.unobserve(en.target);
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
  revealTargets.forEach(el => io.observe(el));

  /* ---------- jukebox (YouTube sob demanda) ---------- */
  const screen = $('#player');
  const picks = $$('.pick');
  const nowPlaying = $('#nowPlaying');
  const thumbUrl = (id, q) => `https://i.ytimg.com/vi/${id}/${q}.jpg`;
  let current = picks[0];

  const renderPoster = pick => {
    screen.innerHTML = '';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tv__play';
    btn.setAttribute('aria-label', `Tocar ${pick.dataset.title}`);
    const img = new Image();
    img.alt = '';
    img.width = 1280; img.height = 720;
    img.src = thumbUrl(pick.dataset.id, pick.dataset.thumb || 'hqdefault');
    img.onerror = () => { if (!img.dataset.fb) { img.dataset.fb = 1; img.src = thumbUrl(pick.dataset.id, 'hqdefault'); } };
    const icon = document.createElement('span');
    icon.className = 'tv__btn'; icon.setAttribute('aria-hidden', 'true'); icon.textContent = '▶';
    btn.append(img, icon);
    btn.addEventListener('click', () => play(pick));
    screen.appendChild(btn);
    nowPlaying.textContent = pick.dataset.title;
  };

  const play = pick => {
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${pick.dataset.id}?autoplay=1&rel=0&modestbranding=1`;
    iframe.title = `Mamonas Assassinas — ${pick.dataset.title}`;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    screen.innerHTML = '';
    screen.appendChild(iframe);
    nowPlaying.textContent = `▶ ${pick.dataset.title}`;
  };

  const select = (pick, autoplay) => {
    picks.forEach(p => { p.classList.toggle('is-active', p === pick); p.setAttribute('aria-pressed', String(p === pick)); });
    current = pick;
    autoplay ? play(pick) : renderPoster(pick);
  };

  if (screen && picks.length) {
    picks.forEach(p => p.addEventListener('click', () => select(p, true)));
    select(current, false);
    // links da tracklist -> seleciona o hit correspondente
    $$('[data-hit]').forEach(a => a.addEventListener('click', () => {
      const p = picks[+a.dataset.hit];
      if (p) select(p, false);
    }));
  }

  /* ---------- quiz ---------- */
  const QUIZ = [
    { q: 'Em qual cidade nasceu a banda que viria a se tornar Mamonas Assassinas?', o: ['Campinas', 'Guarulhos', 'Santos'], a: 1, n: 'Guarulhos — foi ali que a Utopia se formou.' },
    { q: 'Qual era o nome da banda antes de “Mamonas Assassinas”?', o: ['Utopia', 'Creuzebek', '1406'], a: 0, n: 'Utopia — o nome acompanhou a fase de rock mais sério. “Creuzebek” era o apelido de Rick Bonadio.' },
    { q: 'Em 1990, Dinho entrou em cena durante um show em que o público pediu qual música?', o: ["Sweet Child o' Mine", 'Smells Like Teen Spirit', 'Another Brick in the Wall'], a: 0, n: 'O episódio com “Sweet Child o’ Mine” é recorrente nas biografias da banda.' },
    { q: 'Aproximadamente quantas cópias foram produzidas do LP independente da Utopia?', o: ['100', '1.000', '10.000'], a: 1, n: 'Cerca de mil — e relatos apontam vendas em torno de cem.' },
    { q: 'Quem foi o produtor decisivo na transição da Utopia para os Mamonas?', o: ['Liminha', 'Rick Bonadio', 'Nelson Motta'], a: 1, n: 'Rick Bonadio, o “Creuzebek”, produziu o álbum de 1995.' },
    { q: 'Qual integrante é associado à sugestão do nome “Mamonas Assassinas”?', o: ['Samuel Reoli', 'Dinho', 'Bento Hinoto'], a: 0, n: 'Samuel Reoli, o baixista.' },
    { q: 'Qual gravadora contratou a banda em abril de 1995?', o: ['EMI', 'Som Livre', 'BMG'], a: 0, n: 'EMI — depois que a demo fez sucesso até na escola do filho do diretor artístico.' },
    { q: 'Em qual hit a “Brasília amarela” virou um dos símbolos visuais da banda?', o: ['Mundo Animal', 'Pelados em Santos', 'Débil Metal'], a: 1, n: 'Pelados em Santos — a Brasília virou ícone do imaginário da faixa.' },
    { q: 'O trecho curtíssimo “Money que é good nóis num have” aparece em qual música?', o: ['Chopis Centis', '1406', "Bois Don't Cry"], a: 1, n: 'O trecho aparece em “1406”.' },
    { q: 'Qual faixa transforma o tradicional vira português em rock-festa?', o: ['Vira-Vira', 'Lá Vem o Alemão', 'Robocop Gay'], a: 0, n: 'Vira-Vira caricatura musicalmente o vira português.' }
  ];
  const MSGS = [
    [10, 'Você virou o sexto Mamona.'],
    [8, 'Quase membro da banda.'],
    [5, 'Mandou bem — mas volta lá na Utopia.'],
    [0, 'Hora de rever o documentário (e o setlist).']
  ];
  const grid = $('#quizGrid');
  const scoreEl = $('#quizScore'), countEl = $('#quizCount'), barEl = $('#quizBar');
  const result = $('#quizResult');
  let score = 0, answered = 0;

  const buildQuiz = () => {
    score = 0; answered = 0;
    grid.innerHTML = '';
    QUIZ.forEach((item, i) => {
      const card = document.createElement('fieldset');
      card.className = 'q';
      card.style.border = '';
      card.innerHTML = `<legend class="sr-only">Pergunta ${i + 1}</legend><span class="q__num">${String(i + 1).padStart(2, '0')}</span><h3></h3><div class="q__opts"></div><p class="q__note" aria-live="polite"></p>`;
      $('h3', card).textContent = item.q;
      const opts = $('.q__opts', card);
      item.o.forEach((label, j) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'opt';
        b.dataset.letter = 'abc'[j];
        b.textContent = label;
        b.addEventListener('click', () => answer(card, item, j));
        opts.appendChild(b);
      });
      grid.appendChild(card);
    });
    result.hidden = true;
    updateScore();
  };

  const answer = (card, item, j) => {
    if (card.classList.contains('is-done')) return;
    const btns = $$('.opt', card);
    const ok = j === item.a;
    btns.forEach((b, k) => {
      b.disabled = true;
      if (k === item.a) b.classList.add('is-right');
      else if (k === j) b.classList.add('is-wrong');
    });
    card.classList.add('is-done', ok ? 'is-ok' : 'is-ko');
    $('.q__note', card).textContent = (ok ? 'Isso! ' : 'Quase. ') + item.n;
    answered++; if (ok) score++;
    updateScore();
    if (answered === QUIZ.length) finish();
  };

  const updateScore = () => {
    scoreEl.textContent = score;
    countEl.textContent = answered;
    barEl.style.width = `${(answered / QUIZ.length) * 100}%`;
  };

  const finish = () => {
    $('#finalScore').textContent = score;
    $('#finalMsg').textContent = MSGS.find(([min]) => score >= min)[1];
    result.hidden = false;
    setTimeout(() => result.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' }), 350);
  };

  $('#quizReset').addEventListener('click', () => {
    buildQuiz();
    $('#quiz').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  });
  buildQuiz();
})();
