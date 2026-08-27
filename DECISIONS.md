# Decisões de Arquitetura e Implementação (DECISIONS.md)

Este documento registra as escolhas técnicas e de implementação adotadas no projeto **Gestão Acadêmica**.

---

### 1. Framework JWT e Execução do Middleware (`jose`)
- **Escolha:** Utilização da biblioteca `jose` para manipulação de tokens JWT.
- **Motivo:** O Next.js utiliza a Edge Runtime no Middleware. Bibliotecas tradicionais como `jsonwebtoken` dependem de módulos nativos do Node.js (`crypto` legado), causando falhas no Middleware. A `jose` é puramente Web API standard e roda de maneira uniforme no Middleware, Route Handlers e Node.js Server Runtime.

### 2. Normalização e Cruzamento de Professores
- **Escolha:** Normalização NFD para remoção de acentos (`normalize('NFD')`), conversão para caixa baixa, e comparação de tokens de nomes.
- **Motivo:** A API externa de agendamento de salas pode registrar o nome do professor com pequenas variações (ex: "marcia pantoja" vs "Márcia Pantoja"). A função de comparação ignora acentos, diferenças de maiúsculas/minúsculas e verifica correspondência por palavras relevantes do nome.

### 3. Representação de Dias da Semana
- **Escolha:** Padrão ISO de 1 a 7 (1 = Segunda-feira ... 7 = Domingo).
- **Motivo:** Evita ambiguidades em sistemas acadêmicos onde o primeiro dia útil de aulas é Segunda-feira. No algoritmo do Dashboard, o retorno nativo da função `.getDay()` do JavaScript (onde 0 é Domingo) é convertido para `day === 0 ? 7 : day`.

### 4. Scheduler Cron Interno e Hot-Reload
- **Escolha:** Uso da biblioteca `node-cron` encapsulada em um padrão de inicialização singleton executada no `instrumentation.ts` do Next.js.
- **Motivo:** Garantir que o processo de verificação de alertas no Discord rode dentro do próprio processo do Next.js sem depender de serviços ou workers externos, mantendo a arquitetura limpa e simples. A flag singleton evita que múltiplas instâncias do cron sejam agendadas durante o re-carregamento em ambiente de desenvolvimento (Hot Module Replacement).

### 5. Layout com Carbon Design System e Suporte a Temas Persistidos
- **Escolha:** Utilização dos temas `@carbon/react` (`g10` para modo claro, `g100` para modo escuro) com persistência da preferência do usuário via `localStorage` e atributo HTML `data-carbon-theme`.
- **Motivo:** Garante conformidade total com o Carbon Design System exigido na especificação, oferecendo troca instantânea de tema e preservação da escolha do usuário entre sessões de navegação.

### 6. Isolamento e Reuso de Rotas de API REST (`/api/v1/...`)
- **Escolha:** Todas as mutações e leituras do banco são expostas como rotas REST padrão que retornam e recebem JSON sob `/api/v1/`.
- **Motivo:** Permite que a aplicação Web React/Next.js consuma a API e que o aplicativo Flutter planejado possa reutilizar exatamente o mesmo backend sem necessidade de duplicar endpoints ou adaptar contratos.

### 7. Remoção completa do Prisma — somente Drizzle ORM
- **Escolha:** Todo vestígio do Prisma (`@prisma/client`, `prisma`, `prisma/schema.prisma`, `src/lib/prisma.ts`, scripts `prisma generate`) foi removido. O projeto usa exclusivamente Drizzle ORM.
- **Motivo:** O Prisma baixa um binário nativo (Query Engine em Rust) por arquitetura. Em imagens Docker ARM64 (Oracle Cloud VPS), esse binário frequentemente falha no build ou gera uma imagem inválida. O Drizzle não tem engine binária própria, resolvendo o problema definitivamente.

### 8. Versões de dependências fixadas sem `^`/`~`
- **Escolha:** Todas as dependências no `package.json` usam versão exata (ex: `"drizzle-orm": "0.33.0"` em vez de `"^0.33.0"`).
- **Motivo:** Garantir reprodutibilidade total de builds. Com `npm ci` e versões fixadas, um build em qualquer data futura produz exatamente o mesmo resultado — nunca puxará uma release candidate ou major nova silenciosamente.

### 9. Middleware de autenticação unificado (cookie + Bearer)
- **Escolha:** O middleware verifica tanto o cookie `auth_token` quanto o header `Authorization: Bearer` em uma única passagem, sem early-return para rotas `/api/v1/` sem token.
- **Motivo:** A implementação anterior deixava qualquer request para `/api/v1/` sem token passar sem autenticação (o `isFlutterApiRequest` só retornava `true` se houvesse Bearer, e o early-return deixava os demais passar). A nova lógica é simples: tenta cookie, tenta header, se não encontrar nenhum → 401.

### 10. `DATABASE_URL` sem `?schema=public`
- **Escolha:** A URL de conexão com o PostgreSQL não inclui o parâmetro `?schema=public`.
- **Motivo:** `?schema=public` é um parâmetro proprietário do Prisma, não do PostgreSQL. O driver `pg` (usado pelo Drizzle) ignora ou rejeita parâmetros desconhecidos na URL. O schema de trabalho do Drizzle é configurado via `drizzle.config.ts`.

### 11. Migrations Drizzle aplicadas automaticamente no boot
- **Escolha:** O `docker-entrypoint.sh` executa as migrations via `drizzle-orm/node-postgres/migrator` antes de iniciar o servidor Next.js.
- **Motivo:** Elimina passo manual de migração no deploy. Drizzle migrations são SQL puro versionado em `./drizzle/`, auditável antes de qualquer `docker-compose up`.
