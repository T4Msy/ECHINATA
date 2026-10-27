const { db, add, str, body } = require('./_store');

module.exports = (req, res) => {
  if (req.method === 'GET') return res.status(200).json({ total: db.ouvidoria.length });
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' });

  const b = body(req);
  const row = {
    categoria: str(b.categoria, 40), local: str(b.local, 120),
    mensagem: str(b.mensagem, 2000), nome: str(b.nome, 80), contato: str(b.contato, 120)
  };
  if (!row.categoria) return res.status(400).json({ erro: 'Escolha o tipo de relato.' });
  if (row.mensagem.length < 10) return res.status(400).json({ erro: 'Descreva com pelo menos 10 caracteres.' });

  add('ouvidoria', row);
  return res.status(200).json({ message: 'Relato recebido com sucesso' });
};
