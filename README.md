# Echinata — Praça Américo Ferreira de Abreu

Landing page do projeto interdisciplinar de revitalização da Praça Américo Ferreira de Abreu (Uberlândia, MG).

Site estático (HTML, CSS e JS puros), sem build. Abra `index.html` ou sirva a pasta com qualquer servidor estático.

## Ouvidoria, votação e avaliação
Por padrão o site roda em modo demonstração (dados salvos só no navegador). Para receber os envios de verdade, preencha `config.js` com a URL e a chave pública de um projeto Supabase e crie as tabelas `ouvidoria`, `avaliacoes` e `votos` com política de INSERT para `anon`.
