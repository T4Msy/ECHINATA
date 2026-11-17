// Simulação dos sensores da praça (temperatura, umidade, movimento e pergolado).
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  if (!$('#gTemp')) return;
  var range = $('#simHora'), auto = $('#simAuto'), seguirRelogio = true;

  // clima típico de Uberlândia em novembro: mín. ~19 °C às 6h, máx. ~31 °C às 15h
  function temp(h) { return 25 + 6 * Math.cos((h - 15) / 24 * 2 * Math.PI) + 0.6 * Math.sin(h * 1.7); }
  function umid(h) { return Math.round(Math.min(95, Math.max(30, 95 - (temp(h) - 18) * 4.2))); }
  function sol(h) { return h < 6 || h > 18.5 ? 0 : Math.sin((h - 6) / 12.5 * Math.PI); }
  function mov(h) {
    var v = 4 + 38 * Math.exp(-Math.pow(h - 7, 2) / 2) + 30 * Math.exp(-Math.pow(h - 12, 2) / 3) + 70 * Math.exp(-Math.pow(h - 18.5, 2) / 3);
    return Math.round(v);
  }
  function fmtH(h) { var m = Math.round((h % 1) * 60); return Math.floor(h) + 'h' + (m < 10 ? '0' : '') + m; }
  function agora() { var d = new Date(); return d.getHours() + d.getMinutes() / 60; }

  function render(h) {
    var t = temp(h), u = umid(h), s = sol(h), aberto = t > 30 || s > 0.75;
    $('#simHoraTxt').textContent = fmtH(h);
    $('#gTemp').textContent = t.toFixed(1).replace('.', ',') + ' °C';
    $('#gTempS').textContent = t > 30 ? 'Calor: procure a sombra' : t < 20 ? 'Fresquinho' : 'Agradável';
    $('#gUmid').textContent = u + ' %';
    $('#gUmidS').textContent = u < 40 ? 'Ar seco: beba água' : 'Normal';
    $('#gMov').textContent = String(mov(h));
    $('#gPergT').textContent = aberto ? 'Aberto' : 'Recolhido';
    $('#gPergS').textContent = aberto ? 'Gerando sombra' : s === 0 ? 'Noite' : 'Sol fraco';
    $('#gPerg').classList.toggle('on', aberto);
    chart(h);
  }

  var cv = $('#simChart');
  function chart(h) {
    var dpr = window.devicePixelRatio || 1, w = cv.clientWidth, H = 160;
    if (!w) return;
    cv.width = w * dpr; cv.height = H * dpr;
    var c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, H);
    var pad = 28, x = function (hh) { return pad + hh / 24 * (w - pad * 2); }, y = function (t) { return H - 22 - (t - 16) / 18 * (H - 40); };
    c.fillStyle = 'rgba(217,162,27,.16)';
    for (var i = 0; i <= 96; i++) { var hh = i / 4; if (temp(hh) > 30 || sol(hh) > 0.75) c.fillRect(x(hh), 8, (w - pad * 2) / 96 + 0.5, H - 30); }
    c.strokeStyle = 'rgba(240,232,220,.25)'; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(pad, y(30)); c.lineTo(w - pad, y(30)); c.stroke(); c.setLineDash([]);
    c.fillStyle = 'rgba(240,232,220,.7)'; c.font = '12px Urbanist, sans-serif';
    c.fillText('30 °C', w - pad - 30, y(30) - 5);
    [0, 6, 12, 18, 24].forEach(function (hh) { c.fillText(hh + 'h', x(hh) - 8, H - 4); });
    c.strokeStyle = '#d8bc9e'; c.lineWidth = 2.5; c.beginPath();
    for (var j = 0; j <= 96; j++) { var q = j / 4; c[j ? 'lineTo' : 'moveTo'](x(q), y(temp(q))); }
    c.stroke();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(x(h), y(temp(h)), 5, 0, 7); c.fill();
  }

  range.addEventListener('input', function () { seguirRelogio = false; auto.classList.remove('on'); auto.setAttribute('aria-pressed', 'false'); render(+range.value); });
  auto.addEventListener('click', function () { seguirRelogio = true; auto.classList.add('on'); auto.setAttribute('aria-pressed', 'true'); tick(); });
  function tick() { if (!seguirRelogio) return; var h = agora(); range.value = h; render(h); }
  window.addEventListener('resize', function () { render(+range.value); });
  window.addEventListener('hashchange', function () { setTimeout(function () { render(+range.value); }, 50); });
  tick(); setInterval(tick, 30000);
})();
