(function () {
  'use strict';
  var CFG = window.ECHINATA_CONFIG || {};
  var REMOTE = !!(CFG.supabaseUrl && CFG.supabaseAnonKey);

  /* ---------- helpers ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function store(k, v) {
    try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; }
  }
  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  // Envia para o Supabase (tabela) ou guarda localmente no modo demonstração.
  function send(table, row) {
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

  /* ---------- novidades ---------- */
  var NEWS = [
    { tag: 'Projeto', cls: '', date: '2026-09-29', title: 'Plano de ação entregue',
      text: 'A equipe concluiu o plano de ação com as propostas de Arquitetura, Engenharia Mecânica, Engenharia da Computação e Sistemas de Informação.' },
    { tag: 'Diagnóstico', cls: 'verde', date: '', title: 'Mapa síntese da praça',
      text: 'O levantamento no local registrou árvores, bancos, quadras, playground, academia, rampas e pontos de ônibus, além dos principais problemas de conservação.' },
    { tag: 'Comunidade', cls: 'madeira', date: '', title: 'Um pavilhão para a comunidade',
      text: 'Entre os critérios de sucesso do projeto está um pavilhão para a confraternização dos moradores e para eventos da Paróquia Santa Mônica.' }
  ];
  var fmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  $('#news').innerHTML = NEWS.map(function (n) {
    var t = n.date ? '<time datetime="' + n.date + '">' + fmt.format(new Date(n.date + 'T12:00:00')) + '</time>' : '';
    return '<article class="post reveal in ' + n.cls + '"><span class="tag">' + esc(n.tag) + '</span><h3>' + esc(n.title) +
      '</h3><p>' + esc(n.text) + '</p>' + t + '</article>';
  }).join('');

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
})();
