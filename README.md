# PRIME LEILÕES

Site institucional com catálogo, página de detalhe, cadastro e login com autenticação JWT própria usando Supabase apenas como banco Postgres.

Esta é uma cópia independente, com banco Supabase próprio. O repositório GitHub e o projeto Vercel novos serão informados após a publicação.

## Stack

- HTML, CSS e JavaScript
- Node.js + Express
- JWT próprio
- Supabase Postgres
- Vercel para frontend + funções `api/`

## Rodando localmente

1. Instale as dependências:

```bash
npm install
```

2. Crie seu arquivo local:

```bash
cp .env.example .env
```

3. Preencha o `.env`

4. Inicie:

```bash
npm start
```

5. Acesse:

- `http://localhost:3000`

## Banco no Supabase

O banco deste projeto foi restaurado em um Supabase independente. Os arquivos em `supabase/` documentam a evolução do schema; não execute `001_init.sql` sobre o banco já restaurado.

Consulta rápida:

- [sql/check_profiles.sql](./sql/check_profiles.sql)

## Variáveis de ambiente

Base local:

- [`.env.example`](./.env.example)

Variáveis usadas:

- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `JWT_REFRESH_SECRET`
- `JWT_REFRESH_EXPIRES_IN`
- `BCRYPT_ROUNDS`
- `APP_ENV`
- `PORT`
- `APP_URL`
- `APP_DOMAIN`
- `CORS_ORIGIN`
- `NOWBANK_API_BASE_URL`
- `NOWBANK_CLIENT_ID`
- `NOWBANK_CLIENT_SECRET`
- `NOWBANK_CALLBACK_URL`
- `NOWBANK_WEBHOOK_TOKEN`

## Publicação

Deploy no Vercel pendente. Configure `APP_URL`, `APP_DOMAIN`, `CORS_ORIGIN` e o callback do pagamento com a URL publicada. O arquivo `.env`, os backups e os documentos privados não são versionados.

Defina `ADMIN_EMAIL` e `ADMIN_PASSWORD` no ambiente. Não existe senha administrativa padrão no código.

## APIs disponíveis

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
