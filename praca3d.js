// Aba "Praça 3D": visualizador do modelo do grupo (SketchUp → GLB) + Jardim do Cerrado.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const DATA = window.ECHINATA_PRACA || { pontos: [], plantas: [] };
const PRACA = { w: 114, d: 131.8, dx: 0.2, dz: -19.2 }; // medidas da praça no modelo (m)
const $ = (s, r) => (r || document).querySelector(s);
const esc = s => { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; };

/* ---------- Jardim do Cerrado (funciona mesmo sem 3D) ---------- */
const grid = $('#plantGrid');
grid.innerHTML = DATA.plantas.map(p =>
  '<article class="pl reveal in" data-tipo="' + p.tipo + '">' +
  '<div class="ph"><img src="assets/plantas/' + p.img + '.jpg" alt="' + esc(p.nome) + '" loading="lazy">' +
  '<span class="num">' + p.n + '</span><span class="kind">' + (p.tipo === 'arvore' ? 'Árvore' : 'Arbusto · herbácea') + '</span></div>' +
  '<div class="bd"><h3>' + esc(p.nome) + '</h3><p class="sci">' + esc(p.sci) + '</p><p class="porte">' + esc(p.porte) + '</p>' +
  '<p>' + esc(p.texto) + '</p><p class="loc"><b>Onde fica:</b> ' + esc(p.local) + '</p>' +
  '<button type="button" class="btn btn-line sm" data-go="p' + p.n + '">Ver na praça 3D</button></div></article>'
).join('');

$('#spotList').innerHTML = DATA.pontos.map(p =>
  '<li><button type="button" data-go="' + p.id + '"><span class="hs s">' + p.id + '</span>' + esc(p.titulo) + '</button></li>').join('');

const pf = document.querySelectorAll('[data-pf]');
pf.forEach(b => b.addEventListener('click', () => {
  const f = b.getAttribute('data-pf');
  pf.forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
  grid.querySelectorAll('.pl').forEach(c => { c.hidden = f !== 'todas' && c.getAttribute('data-tipo') !== f; });
}));

/* ---------- visualizador ---------- */
const stage = $('#stage');
const canvasWrap = $('#stageCanvas');
const hotLayer = $('#hotspots');
const card = $('#spotCard');
const loading = $('#stageLoading');
let started = false, api = null;

function isVisible() { return !$('#p-praca3d').hidden; }

function start() {
  if (started) return; started = true;
  const gl = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl');
  if (!gl) { loading.innerHTML = 'Seu navegador não abre 3D. Veja a planta da praça abaixo.'; return; }
  api = init();
}

function init() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false; // cena estática: a sombra é calculada uma vez só
  canvasWrap.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#dfe8ec');
  const camera = new THREE.PerspectiveCamera(40, 1, 0.5, 1500);

  scene.add(new THREE.HemisphereLight('#ffffff', '#6f6a55', 1.6));
  const sun = new THREE.DirectionalLight('#fff4e0', 2.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0004;
  scene.add(sun, sun.target);

  const ground = new THREE.Mesh(new THREE.CircleGeometry(600, 48), new THREE.MeshLambertMaterial({ color: '#b9b4a3' }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.05; ground.receiveShadow = true;
  scene.add(ground);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI * 0.47;
  controls.minDistance = 8;
  controls.maxDistance = 320;

  // planta (px) -> mundo; calibrado com a caixa do modelo depois de carregar
  const cal = { ox: 0, oz: 0, sx: 1, sz: 1 };
  const toWorld = (x, y, h) => new THREE.Vector3(cal.ox + x * cal.sx, h, cal.oz + y * cal.sz);

  const spots = [];
  function addSpot(key, label, cls, x, y, h, info) {
    const el = document.createElement('button');
    el.type = 'button'; el.className = 'hs ' + cls; el.textContent = label;
    el.setAttribute('aria-label', info.titulo);
    el.addEventListener('click', () => focus(key));
    hotLayer.appendChild(el);
    spots.push({ key, el, x, y, h, info, pos: new THREE.Vector3(), cls });
  }
  DATA.pontos.forEach(p => addSpot(p.id, p.id, 'ponto', p.x, p.y, 6, { titulo: p.titulo, texto: p.texto, area: p.area }));
  DATA.plantas.forEach(p => addSpot('p' + p.n, String(p.n), 'planta', p.x, p.y, p.tipo === 'arvore' ? 7 : 2,
    { titulo: p.nome, sub: p.sci, texto: p.local, area: p.tipo === 'arvore' ? 'Árvore do Jardim do Cerrado' : 'Jardim do Cerrado', img: p.img }));

  let showPlants = true;
  $('#togglePlants').addEventListener('click', e => {
    showPlants = !showPlants;
    e.currentTarget.classList.toggle('on', showPlants);
    e.currentTarget.setAttribute('aria-pressed', showPlants);
    dirty = true;
  });

  // renderiza só quando algo muda (câmera, animação, redimensionamento)
  let dirty = true;
  controls.addEventListener('change', () => { dirty = true; });
  const home = { pos: new THREE.Vector3(), target: new THREE.Vector3() };
  let anim = null;
  function flyTo(pos, target, ms) {
    anim = { t0: performance.now(), ms: ms || 1400, p0: camera.position.clone(), t0v: controls.target.clone(), p1: pos.clone(), t1: target.clone() };
  }
  function showCard(s) {
    if (!s) { card.hidden = true; return; }
    const i = s.info;
    card.innerHTML = (i.img ? '<img src="assets/plantas/' + i.img + '.jpg" alt="">' : '') +
      '<div><p class="area">' + esc(i.area) + '</p><h3>' + esc(i.titulo) + '</h3>' + (i.sub ? '<p class="sci">' + esc(i.sub) + '</p>' : '') +
      '<p>' + esc(i.texto) + '</p></div><button type="button" class="x" aria-label="Fechar">×</button>';
    card.hidden = false;
    card.querySelector('.x').addEventListener('click', () => { card.hidden = true; setActive(null); });
  }
  function setActive(key) { spots.forEach(s => s.el.classList.toggle('active', s.key === key)); }
  function focus(key) {
    const s = spots.find(x => x.key === key); if (!s) return;
    stopTour();
    if (s.cls === 'planta' && !showPlants) $('#togglePlants').click();
    const t = s.pos.clone(); t.y = Math.max(0, s.pos.y - 4);
    const dir = new THREE.Vector3().subVectors(home.pos, home.target).setY(0).normalize();
    const dist = s.cls === 'planta' ? 26 : 38;
    flyTo(t.clone().add(dir.multiplyScalar(dist)).setY(t.y + dist * 0.7), t);
    setActive(key); showCard(s);
  }
  function overview() { stopTour(); card.hidden = true; setActive(null); flyTo(home.pos, home.target); }

  // tour automático (bom para o computador do estande)
  let tour = null, tourIdx = 0;
  function stopTour() { if (tour) { clearInterval(tour); tour = null; $('#btnTour').classList.remove('on'); controls.autoRotate = false; } }
  function startTour() {
    const keys = DATA.pontos.map(p => p.id);
    const step = () => { const k = keys[tourIdx++ % keys.length]; const t = tour; tour = null; focus(k); tour = t; };
    tour = setInterval(step, 6500); $('#btnTour').classList.add('on'); step();
  }
  $('#btnHome').addEventListener('click', overview);
  $('#btnTour').addEventListener('click', () => tour ? stopTour() : startTour());
  $('#btnFull').addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (stage.requestFullscreen) stage.requestFullscreen();
    else if (stage.webkitRequestFullscreen) stage.webkitRequestFullscreen();
  });
  controls.addEventListener('start', () => { anim = null; if (tour) stopTour(); });

  function resize() {
    const w = canvasWrap.clientWidth, h = canvasWrap.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); dirty = true;
  }
  new ResizeObserver(resize).observe(canvasWrap);
  resize();

  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  loader.load('assets/3d/praca.glb', gltf => {
    const model = gltf.scene;
    model.traverse(o => {
      if (o.isMesh) {
        o.castShadow = true; o.receiveShadow = true;
        const ms = Array.isArray(o.material) ? o.material : [o.material];
        ms.forEach(m => { if (m.map) m.map.anisotropy = 4; if (m.transparent && m.opacity > 0.98) m.transparent = false; });
      }
    });
    // centraliza a praça na origem, com o chão em y = 0.
    // O arquivo traz um objeto solto ao norte; a praça fica 19,2 m ao sul do centro da caixa.
    const box = new THREE.Box3().setFromObject(model, true);
    const c = box.getCenter(new THREE.Vector3());
    model.position.set(-c.x + PRACA.dx, -box.min.y, -c.z + PRACA.dz);
    scene.add(model);
    model.updateMatrixWorld(true);
    model.traverse(o => { o.matrixAutoUpdate = false; });
    const size = new THREE.Vector3(PRACA.w, box.max.y - box.min.y, PRACA.d);
    // planta (px, 740 x 860) -> mundo: modelo girado 180° em relação à planta
    cal.sx = -PRACA.w / 704; cal.sz = -PRACA.d / 824; cal.ox = 370 * PRACA.w / 704; cal.oz = 430 * PRACA.d / 824;
    spots.forEach(s => s.pos.copy(toWorld(s.x, s.y, s.h)));

    const r = Math.max(size.x, size.z);
    sun.position.set(r * 0.5, r * 0.9, r * 0.35);
    const sc = sun.shadow.camera; sc.left = -r * 0.6; sc.right = r * 0.6; sc.top = r * 0.6; sc.bottom = -r * 0.6; sc.far = r * 3; sc.updateProjectionMatrix();
    home.target.set(0, 0, 0);
    home.pos.set(r * 0.62, r * 0.62, r * 0.78);
    camera.position.copy(home.pos); controls.target.copy(home.target); controls.update();
    renderer.shadowMap.needsUpdate = true;
    renderer.compile(scene, camera);
    dirty = true;
    loading.hidden = true;
    stage.classList.add('ready');
  }, ev => {
    if (ev.total) loading.querySelector('b').textContent = Math.round(ev.loaded / ev.total * 100) + '%';
  }, () => { loading.innerHTML = 'Não foi possível carregar o modelo 3D agora.'; });

  const v = new THREE.Vector3();
  function tick(now) {
    requestAnimationFrame(tick);
    if (!isVisible()) return;
    let changed = dirty; dirty = false;
    if (anim) {
      changed = true;
      let k = Math.min(1, (now - anim.t0) / anim.ms); k = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      camera.position.lerpVectors(anim.p0, anim.p1, k); controls.target.lerpVectors(anim.t0v, anim.t1, k);
      if (k >= 1) anim = null;
    }
    if (controls.update()) changed = true;
    if (!changed) return;
    renderer.render(scene, camera);
    const w = canvasWrap.clientWidth, h = canvasWrap.clientHeight;
    spots.forEach(s => {
      const hide = !stage.classList.contains('ready') || (s.cls === 'planta' && !showPlants);
      v.copy(s.pos).project(camera);
      const off = v.z > 1 || v.x < -1.05 || v.x > 1.05 || v.y < -1.05 || v.y > 1.05;
      s.el.hidden = hide || off;
      if (!s.el.hidden) s.el.style.transform = 'translate(' + ((v.x + 1) / 2 * w) + 'px,' + ((1 - v.y) / 2 * h) + 'px)';
    });
  }
  requestAnimationFrame(tick);
  return { focus };
}

// botões "Ver na praça 3D" dos cartões e da lista
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-go]');
  if (!b) return;
  start();
  stage.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const go = () => api && stage.classList.contains('ready') ? api.focus(b.getAttribute('data-go')) : setTimeout(go, 300);
  go();
});

function check() { if (isVisible()) start(); }
window.addEventListener('hashchange', () => setTimeout(check, 0));
check();
