# Atlas — REST Countries Explorer

Aplicação React criada para a Atividade 2 de Computação em Nuvem da ETEC. O projeto consome a API pública REST Countries e apresenta busca, filtros e páginas de detalhes.

## Recursos

- listagem de países;
- busca pelo nome;
- filtro por região;
- rota de detalhes em `/pais/:code`;
- estados de carregamento, erro e busca vazia;
- layout responsivo;
- URL da API configurada por variável de ambiente.

## Como executar

```bash
npm install
cp .env.example .env
npm run dev
```

## Variável de ambiente

```text
VITE_API_URL=https://api.restcountries.com/countries/v5
VITE_API_KEY=sua_chave_da_rest_countries
```

## Build de produção

```bash
npm run build
```

No Render, use `npm install && npm run build` como Build Command, `dist` como Publish Directory, cadastre as duas variáveis e crie uma regra Rewrite de `/*` para `/index.html`.

> A chave pública `rc_live_demo` serve apenas para testar a integração e retorna um único exemplo. Para exibir todos os países, crie uma chave gratuita da REST Countries e configure `VITE_API_KEY` no Render.
