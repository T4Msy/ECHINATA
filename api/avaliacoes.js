const { db, add, str, body } = require('./_store');

module.exports = (req, res) => {
  if (req.method === 'GET') {
    const n = db.avaliacoes.length;
    const media = n ? db.avaliacoes.reduce((s, a) => s + a.nota, 0) / n : 0;
    return res.status(200).json({ total: n, media: Math.round(media * 10) / 10 });
  }
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' });

  const b = body(req);
  const nota = Number(b.nota);
  if (!Number.isInteger(nota) || nota < 1 || nota > 5) return res.status(400).json({ erro: 'Escolha uma nota de 1 a 5.' });

  add('avaliacoes', { nota, frequencia: str(b.frequencia, 40), comentario: str(b.comentario, 1000) });
  return res.status(200).json({ message: 'Avaliação recebida com sucesso' });
};
