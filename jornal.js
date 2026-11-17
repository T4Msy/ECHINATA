// Conteúdo do Jornal da Praça. Para publicar algo novo, copie um bloco abaixo,
// preencha e salve — o site monta o resto (ordem por data, "próximo evento",
// agenda separada de eventos passados, botão de calendário e compartilhar).
//
// EVENTOS  data: "AAAA-MM-DD" · hora/fim: "HH:MM" (fim é opcional)
// NOTÍCIAS data: "AAAA-MM-DD" (opcional) · cor: "" (vermelho), "verde" ou "madeira"
// Itens com exemplo: true mostram o selo "Exemplo" — apague essa linha ao publicar de verdade.
window.ECHINATA_JORNAL = {
  eventos: [
    {
      id: 'sao-joao',
      tipo: 'Festa',
      titulo: 'Festa de São João na praça',
      data: '2027-06-24', hora: '18:00', fim: '22:00',
      local: 'Praça Américo Ferreira de Abreu · Uberlândia, MG',
      texto: 'Quadrilha, comidas típicas e música para toda a vizinhança. Traga a família e um prato para dividir. Um convite da comunidade e da Paróquia Santa Mônica.',
      exemplo: true
    },
    {
      id: 'mutirao',
      tipo: 'Mutirão',
      titulo: 'Mutirão de plantio e limpeza',
      data: '2027-03-20', hora: '08:00', fim: '12:00',
      local: 'Praça Américo Ferreira de Abreu · Uberlândia, MG',
      texto: 'Vamos plantar mudas, pintar bancos e deixar a praça em ordem. Luvas e ferramentas por nossa conta; traga água e disposição.',
      exemplo: true
    }
  ],
  noticias: [
    { tag: 'Projeto', cor: '', data: '2026-09-29', titulo: 'Plano de ação entregue',
      texto: 'A equipe concluiu o plano de ação com as propostas de Arquitetura, Engenharia Mecânica, Engenharia da Computação e Sistemas de Informação.' },
    { tag: 'Diagnóstico', cor: 'verde', data: '', titulo: 'Mapa síntese da praça',
      texto: 'O levantamento no local registrou árvores, bancos, quadras, playground, academia, rampas e pontos de ônibus, além dos principais problemas de conservação.' },
    { tag: 'Comunidade', cor: 'madeira', data: '', titulo: 'Um pavilhão para a comunidade',
      texto: 'Entre os critérios de sucesso do projeto está um pavilhão para a confraternização dos moradores e para eventos da Paróquia Santa Mônica.' }
  ]
};
