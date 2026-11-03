// Placeholder for images not yet added to /img
document.querySelectorAll('.photo img').forEach(function (img) {
  function markMissing() {
    var fig = img.closest('.photo');
    fig.dataset.label = img.alt + ' (adicionar: ' + img.getAttribute('src') + ')';
    fig.classList.add('missing');
    img.remove();
  }
  if (img.complete && img.naturalWidth === 0) markMissing();
  else img.addEventListener('error', markMissing);
});

// Mobile menu
var toggle = document.querySelector('.menu-toggle');
var menu = document.getElementById('menu');
toggle.addEventListener('click', function () {
  var open = menu.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);
});
menu.addEventListener('click', function (e) {
  if (e.target.tagName === 'A') {
    menu.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }
});

// Reveal on scroll + active menu link
if ('IntersectionObserver' in window) {
  var revealEls = document.querySelectorAll('.section .container > *');
  revealEls.forEach(function (el) { el.classList.add('reveal'); });
  var revealObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  revealEls.forEach(function (el) { revealObs.observe(el); });

  var links = document.querySelectorAll('.menu a');
  var navObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      links.forEach(function (a) {
        a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id);
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('main section[id]').forEach(function (s) { navObs.observe(s); });
}
