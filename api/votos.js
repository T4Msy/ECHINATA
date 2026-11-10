const { db, add, body } = require('./_store');

const OPCOES = [
  'Pisos e calçadas novos', 'Rampas e acessibilidade', 'Mais sombra (pergolado inteligente)',
  'Iluminação melhor', 'Banheiros reformados', 'Bebedouros', 'Bancos e mesas novos',
  'Quadras recuperadas', 'Wi-Fi e painel com informações'
];
const MAX_ESCOLHAS = 3;

module.exports = (req, res) => {
  if (req.method === 'GET') {
    const contagem = {};
    db.votos.forEach(v => v.prioridades.forEach(p => { contagem[p] = (contagem[p] || 0) + 1; }));
    return res.status(200).json({ total: db.votos.length, contagem });
  }
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' });

  const p = body(req).prioridades;
  const picks = Array.isArray(p) ? [...new Set(p)].filter(x => OPCOES.includes(x)) : [];
  if (!picks.length) return res.status(400).json({ erro: 'Escolha pelo menos uma prioridade.' });
  if (picks.length > MAX_ESCOLHAS) return res.status(400).json({ erro: `Escolha até ${MAX_ESCOLHAS} prioridades.` });

  add('votos', { prioridades: picks });
  return res.status(200).json({ message: 'Voto registrado com sucesso' });
};
