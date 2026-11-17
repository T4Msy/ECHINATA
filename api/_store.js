// Armazenamento em memória (sem banco). Na Vercel cada instância tem a sua
// memória e ela é descartada quando a função "dorme" — serve para demonstração.
const MAX = 500;
const db = global.__echinata || (global.__echinata = { ouvidoria: [], avaliacoes: [], votos: [] });

function add(table, row) {
  db[table].push(Object.assign({ criado_em: new Date().toISOString() }, row));
  if (db[table].length > MAX) db[table].shift();
}

function str(v, max) { return typeof v === 'string' ? v.trim().slice(0, max) : ''; }

function body(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body || '{}'); } catch (e) { return {}; }
}

module.exports = { db, add, str, body };
