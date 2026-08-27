# Gestão Acadêmica

Sistema pessoal de dashboard acadêmico para gestão de horários de aulas (com cruzamento em tempo real com a API de agendamento de laboratórios), grupos de trabalho, materiais didáticos no SharePoint/Teams e quadro Kanban de tarefas com notificações automáticas via webhook no Discord.

---

## 🚀 Stack Técnica

- **Frontend / Backend**: Next.js 14 (App Router), TypeScript, React 18.
- **Design System**: Carbon Design System (`@carbon/react`) com suporte a temas claro (`g10`) e escuro (`g100`), alternância persistida via `localStorage`.
- **Banco de Dados**: PostgreSQL com **Drizzle ORM** (`drizzle-orm` + `drizzle-kit`) — versões fixadas sem `^`/`~`.
- **Autenticação**: Credenciais simples (`AUTH_USERNAME` + bcrypt `AUTH_PASSWORD_HASH`), emitindo JWT salvo em cookie httpOnly para a Web UI e aceito via Header `Authorization: Bearer <token>` para a API REST.
- **Cron / Agendador**: `node-cron` executado internamente no boot do servidor Next.js (inicialização singleton via `instrumentation.ts`).
- **Notificação**: Webhook do Discord para alertar tarefas pendentes próximas do prazo.
- **Deploy / Container**: Docker multi-stage com Docker Compose e suporte a Traefik Reverse Proxy.

---

## 📁 Estrutura de Documentos

- `API.md`: Documentação detalhada de todos os endpoints REST sob `/api/v1/`.
- `DECISIONS.md`: Registro das decisões de arquitetura e implementação.
- `.env.example`: Modelo com todas as variáveis de ambiente necessárias.

---

## ⚙️ Configuração e Execução

### 1. Variáveis de Ambiente

```bash
cp .env.example .env
```

Edite o `.env` com as suas credenciais. A variável mais importante é `DATABASE_URL` — ela é a **única** coisa que muda entre modo local e produção:

```env
# Local (Postgres embutido no compose)
DATABASE_URL="postgresql://gestao_user:gestao_pass@localhost:5432/gestao_academica"

# VPS (Postgres existente)
DATABASE_URL="postgresql://usuario_vps:senha_vps@postgres-vps-host:5432/gestao_academica"
```

---

### 💻 Modo 1: Desenvolvimento Local (Postgres via Docker Compose)

```bash
# 1. Subir Postgres + app
docker-compose up -d --build

# A aplicação já aplica as migrations automaticamente no boot (docker-entrypoint.sh)
```

Para rodar **fora do Docker** (desenvolvimento ativo com hot-reload):

```bash
npm install

# Subir só o Postgres
docker-compose up -d postgres

# Aplicar migrations
npm run db:migrate

# (Opcional) Popular banco com dados iniciais
npm run db:seed

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse `http://localhost:3000` e faça login com as credenciais em `AUTH_USERNAME` / `AUTH_PASSWORD`.

---

### 🌐 Modo 2: Deploy em Produção (VPS com Traefik e Postgres Existente)

```bash
# 1. Copiar o override de produção
cp docker-compose.override.yml.example docker-compose.override.yml

# 2. Editar docker-compose.override.yml:
#    - DATABASE_URL apontando para o Postgres da VPS
#    - Domínio nas labels do Traefik (Host(`gestao.seudominio.com.br`))
#    - Nomes das redes externas (traefik-net, vps-postgres-net)

# 3. Subir
docker-compose up -d --build
```

As migrations são aplicadas automaticamente no boot pelo `docker-entrypoint.sh`.

---

## ⚡ Comandos Úteis — Drizzle

```bash
# Gerar arquivo SQL de nova migration após alterar o schema
npm run db:generate

# Aplicar migrations pendentes no banco
npm run db:migrate

# Popular banco com dados iniciais (disciplinas e SharePoint seed)
npm run db:seed

# Desenvolvimento com hot-reload
npm run dev

# Lint
npm run lint
```

> **Nota sobre migrations**: os arquivos SQL gerados ficam em `./drizzle/` e são versionados no repositório. São SQL puro e legível — você pode auditar antes de aplicar.
