(function () {
  'use strict';
  var CFG = window.ECHINATA_CONFIG || {};
  var REMOTE = !!(CFG.supabaseUrl && CFG.supabaseAnonKey);
  var API = !REMOTE && CFG.apiUrl;   // back-end próprio (funções da Vercel, em memória)

  /* ---------- helpers ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function store(k, v) {
    try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; }
  }
  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  // Envia para o Supabase (tabela) ou guarda localmente no modo demonstração.
  function send(table, row) {
    if (API) {
      return fetch(API + '/' + table, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(row)
      }).then(function (r) { if (!r.ok) throw new Error('http ' + r.status); });
    }
    if (REMOTE) {
      return fetch(CFG.supabaseUrl + '/rest/v1/' + table, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: CFG.supabaseAnonKey,
          Authorization: 'Bearer ' + CFG.supabaseAnonKey,
          Prefer: 'return=minimal'
        },
        body: JSON.stringify(row)
      }).then(function (r) { if (!r.ok) throw new Error('http ' + r.status); });
    }
    var list = store('echinata_' + table) || [];
    list.push(Object.assign({ criado_em: new Date().toISOString() }, row));
    store('echinata_' + table, list);
    return Promise.resolve();
  }

  /* ---------- menu mobile ---------- */
  var burger = $('#burger'), menu = $('#menu');
  burger.addEventListener('click', function () {
    var open = menu.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
  });
  menu.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') { menu.classList.remove('open'); burger.setAttribute('aria-expanded', false); }
  });

  /* ---------- reveal ao rolar ---------- */
  var els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .12 });
    els.forEach(function (el) { io.observe(el); });
  } else els.forEach(function (el) { el.classList.add('in'); });

  /* ---------- abas ---------- */
  var PAGES = ['inicio', 'praca', 'propostas', 'jornal', 'participe', 'sobre'];
  var ANCHORS = { topo: 'inicio', destaques: 'inicio', ouvidoria: 'participe', votacao: 'participe', equipe: 'sobre', painel: 'sobre', novidades: 'jornal' };
  var TITLES = { inicio: 'Praça Américo Ferreira de Abreu', praca: 'A praça', propostas: 'Propostas', jornal: 'Jornal da Praça', participe: 'Participe', sobre: 'Sobre' };
  var pageEls = document.querySelectorAll('.page');

  function route() {
    var id = decodeURIComponent(location.hash.slice(1)) || 'inicio';
    var page = PAGES.indexOf(id) > -1 ? id : ANCHORS[id];
    if (!page) { page = 'inicio'; id = 'inicio'; }
    Array.prototype.forEach.call(pageEls, function (el) { el.hidden = el.getAttribute('data-page') !== page; });
    Array.prototype.forEach.call(document.querySelectorAll('[data-nav]'), function (a) {
      if (a.getAttribute('data-nav') === page) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    document.title = (page === 'inicio' ? '' : TITLES[page] + ' — ') + 'Praça Américo Ferreira de Abreu — Echinata';
    var target = id !== page && document.getElementById(id);
    if (target) target.scrollIntoView(); else window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  /* ---------- jornal: eventos e notícias ---------- */
  var J = window.ECHINATA_JORNAL || { eventos: [], noticias: [] };
  var MESES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  var fmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  var fmtLong = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  function dt(d, t) { return new Date(d + 'T' + (t || '23:59') + ':00'); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  var now = new Date();
  var evs = (J.eventos || []).slice().sort(function (a, b) { return dt(a.data, a.hora) - dt(b.data, b.hora); });
  var upcoming = evs.filter(function (e) { return dt(e.data, e.fim || e.hora) >= now; });
  var past = evs.filter(function (e) { return dt(e.data, e.fim || e.hora) < now; }).reverse();

  var ed = $('#edition'); if (ed) ed.textContent = fmtLong.format(now);

  function eventCard(e, big) {
    var d = new Date(e.data + 'T12:00:00');
    var hora = e.hora ? e.hora.replace(':', 'h') + (e.fim ? ' às ' + e.fim.replace(':', 'h') : '') : '';
    var wa = 'https://wa.me/?text=' + encodeURIComponent('Você está convidado: ' + e.titulo + ' — ' + fmt.format(d) + (hora ? ', ' + hora : '') + ' · ' + e.local + ' ' + location.origin + '/#jornal');
    return '<article class="evt reveal in' + (big ? ' big' : '') + '">' +
      '<div class="date" aria-hidden="true"><b>' + d.getDate() + '</b><span>' + MESES[d.getMonth()] + '</span></div>' +
      '<div class="evt-body"><p class="meta"><span class="tag">' + esc(e.tipo || 'Evento') + '</span>' +
      (e.exemplo ? '<span class="tag ex">Exemplo</span>' : '') + '</p>' +
      '<h3>' + esc(e.titulo) + '</h3>' +
      '<p class="when"><time datetime="' + e.data + '">' + fmtLong.format(d) + '</time>' + (hora ? ' · ' + hora : '') + '</p>' +
      '<p class="where">' + esc(e.local || '') + '</p>' +
      '<p>' + esc(e.texto || '') + '</p>' +
      '<p class="acts"><button type="button" class="btn btn-primary" data-ics="' + esc(e.id) + '">Adicionar ao calendário</button>' +
      '<a class="btn btn-line" href="' + wa + '" target="_blank" rel="noopener">Convidar no WhatsApp</a></p></div></article>';
  }

  function emptyMsg(t) { return '<p class="empty">' + t + '</p>'; }
  $('#agenda').innerHTML = upcoming.length ? upcoming.map(function (e, i) { return eventCard(e, i === 0); }).join('')
    : emptyMsg('Nenhum evento marcado por enquanto. Volte em breve!');
  if (past.length) { $('#pastBox').hidden = false; $('#past').innerHTML = past.map(function (e) { return eventCard(e, false); }).join(''); }
  $('#homeNext').innerHTML = upcoming.length ? eventCard(upcoming[0], true) : emptyMsg('Ainda não há eventos marcados. Acompanhe o jornal!');

  $('#news').innerHTML = (J.noticias || []).map(function (n) {
    var t = n.data ? '<time datetime="' + n.data + '">' + fmt.format(new Date(n.data + 'T12:00:00')) + '</time>' : '';
    return '<article class="post reveal in ' + (n.cor || '') + '"><span class="tag">' + esc(n.tag) + '</span><h3>' + esc(n.titulo) +
      '</h3><p>' + esc(n.texto) + '</p>' + t + '</article>';
  }).join('');

  // .ics: abre no Google Agenda, Apple Calendário e Outlook (horário de Brasília, UTC-3)
  function icsDate(d, t) {
    var p = d.split('-'), h = (t || '00:00').split(':');
    var u = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2], +h[0] + 3, +h[1]));
    return u.getUTCFullYear() + pad(u.getUTCMonth() + 1) + pad(u.getUTCDate()) + 'T' + pad(u.getUTCHours()) + pad(u.getUTCMinutes()) + '00Z';
  }
  function icsText(s) { return String(s || '').replace(/\\/g, '\\\\').replace(/[,;]/g, '\\$&').replace(/\n/g, '\\n'); }
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('[data-ics]');
    if (!b) return;
    var e = evs.filter(function (x) { return x.id === b.getAttribute('data-ics'); })[0];
    if (!e) return;
    var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Echinata//Jornal da Praca//PT', 'BEGIN:VEVENT',
      'UID:' + e.id + '@echinata', 'DTSTAMP:' + icsDate(now.toISOString().slice(0, 10), '00:00'),
      'DTSTART:' + icsDate(e.data, e.hora || '00:00'), 'DTEND:' + icsDate(e.data, e.fim || e.hora || '23:00'),
      'SUMMARY:' + icsText(e.titulo), 'LOCATION:' + icsText(e.local), 'DESCRIPTION:' + icsText(e.texto), 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    a.download = e.id + '.ics'; document.body.appendChild(a); a.click(); a.remove();
  });

  // filtros do jornal
  var fbtns = document.querySelectorAll('.fbtn');
  Array.prototype.forEach.call(fbtns, function (b) {
    b.addEventListener('click', function () {
      var f = b.getAttribute('data-f');
      Array.prototype.forEach.call(fbtns, function (x) { var on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
      $('#blkEventos').hidden = f === 'noticias';
      $('#blkNoticias').hidden = f === 'eventos';
    });
  });

  /* ---------- ouvidoria ---------- */
  function wireForm(form, msgEl, table, build, validate) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      msgEl.className = 'msg';
      var fd = new FormData(form);
      if (fd.get('site')) return; // honeypot
      var err = validate(fd);
      if (err) { msgEl.textContent = err; msgEl.classList.add('err'); return; }
      var btn = form.querySelector('button[type=submit]');
      btn.disabled = true;
      send(table, build(fd)).then(function () {
        form.reset();
        msgEl.textContent = 'Recebemos! Obrigado por ajudar a cuidar da praça.';
        msgEl.classList.add('ok');
      }).catch(function () {
        msgEl.textContent = 'Não foi possível enviar agora. Tente novamente em instantes.';
        msgEl.classList.add('err');
      }).then(function () { btn.disabled = false; });
    });
  }

  wireForm($('#ouvForm'), $('#ouvMsg'), 'ouvidoria',
    function (fd) {
      return {
        categoria: fd.get('categoria'), local: (fd.get('local') || '').trim(),
        mensagem: fd.get('mensagem').trim(),
        nome: (fd.get('nome') || '').trim(), contato: (fd.get('contato') || '').trim()
      };
    },
    function (fd) {
      if (!fd.get('categoria')) return 'Escolha o tipo de relato.';
      if ((fd.get('mensagem') || '').trim().length < 10) return 'Descreva com pelo menos 10 caracteres.';
      return '';
    });

  wireForm($('#fbForm'), $('#fbMsg'), 'avaliacoes',
    function (fd) {
      return { nota: Number(fd.get('nota')), frequencia: fd.get('frequencia') || '', comentario: (fd.get('comentario') || '').trim() };
    },
    function (fd) { return fd.get('nota') ? '' : 'Escolha uma nota de 1 a 5.'; });

  /* ---------- votação ---------- */
  var OPTIONS = [
    'Pisos e calçadas novos', 'Rampas e acessibilidade', 'Mais sombra (pergolado inteligente)',
    'Iluminação melhor', 'Banheiros reformados', 'Bebedouros', 'Bancos e mesas novos',
    'Quadras recuperadas', 'Wi-Fi e painel com informações'
  ];
  var MAX = 3;
  var poll = $('#poll'), box = $('#pollOpts'), pbtn = $('#pollBtn'), pmsg = $('#pollMsg');
  var tally = store('echinata_tally') || {};   // demonstração: contagem local
  var voted = store('echinata_voted');

  function render() {
    var total = 0, max = 0;
    OPTIONS.forEach(function (o) { var v = tally[o] || 0; total += v; if (v > max) max = v; });
    box.innerHTML = OPTIONS.map(function (o, i) {
      var v = tally[o] || 0, pct = total ? Math.round(v / total * 100) : 0;
      var checked = voted && voted.indexOf(o) > -1 ? ' checked' : '';
      return '<label class="opt"><input type="checkbox" value="' + esc(o) + '"' + checked + (voted ? ' disabled' : '') + '>' +
        '<span class="bar" style="width:' + (voted ? pct : 0) + '%"></span>' +
        '<span class="top"><span>' + esc(o) + '</span><span class="pct">' + pct + '%</span></span></label>';
    }).join('');
    poll.classList.toggle('voted', !!voted);
    pbtn.style.display = voted ? 'none' : '';
    if (voted) { pmsg.textContent = 'Voto registrado. Obrigado!'; pmsg.className = 'msg ok'; }
  }
  box.addEventListener('change', function (e) {
    var sel = box.querySelectorAll('input:checked');
    if (sel.length > MAX) { e.target.checked = false; pmsg.textContent = 'Você pode escolher até ' + MAX + ' prioridades.'; pmsg.className = 'msg err'; }
    else pmsg.textContent = '';
  });
  pbtn.addEventListener('click', function () {
    var picks = Array.prototype.map.call(box.querySelectorAll('input:checked'), function (i) { return i.value; });
    if (!picks.length) { pmsg.textContent = 'Escolha pelo menos uma prioridade.'; pmsg.className = 'msg err'; return; }
    pbtn.disabled = true;
    send('votos', { prioridades: picks }).then(function () {
      picks.forEach(function (p) { tally[p] = (tally[p] || 0) + 1; });
      store('echinata_tally', tally); store('echinata_voted', picks); voted = picks;
      render();
    }).catch(function () {
      pmsg.textContent = 'Não foi possível registrar agora. Tente novamente.'; pmsg.className = 'msg err';
    }).then(function () { pbtn.disabled = false; });
  });
  render();
  route();
  // com back-end próprio, a contagem vem do servidor (votos de todo mundo)
  if (API) {
    fetch(API + '/votos').then(function (r) { return r.json(); }).then(function (d) {
      tally = d.contagem || {}; render();
    }).catch(function () {});
  }
})();
