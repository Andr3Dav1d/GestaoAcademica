# Documentação de Endpoints REST — API v1

Todas as rotas exigem autenticação via Cookie `auth_token` (Web UI) ou Header `Authorization: Bearer <token>` (Futuro App Flutter), exceto `POST /api/v1/auth/login`.

---

## 1. Autenticação

### `POST /api/v1/auth/login`
Autentica o usuário no sistema.
- **Request Body:**
  ```json
  {
    "username": "admin",
    "password": "suasenhaaqui"
  }
  ```
- **Response 200:**
  ```json
  {
    "message": "Login realizado com sucesso",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "user": { "username": "admin" }
  }
  ```

### `POST /api/v1/auth/logout`
Remove o cookie de autenticação `auth_token`.

---

## 2. Dashboard

### `GET /api/v1/dashboard/hoje`
Retorna a grade de aulas de hoje cruzando o horário fixo semanal com os agendamentos em tempo real da API externa de laboratórios.
- **Query Params (Opcionais):**
  - `diaSemana` (number, 1-7): permite simular um dia específico da semana.
- **Response 200:**
  ```json
  {
    "horarioHoje": [
      {
        "id": "cuid_123",
        "disciplinaId": "cuid_456",
        "disciplinaNome": "Machine Learning",
        "professor": "Marcia Pantoja",
        "horaInicio": "08:00",
        "horaFim": "10:50",
        "salaPadrao": "D405",
        "localFinal": "L101",
        "isLaboratorio": true,
        "origem": "Laboratório (API)",
        "agendamentoInfo": {
          "id": "uuid",
          "descricao": "Aula de Lab de Empreendedores"
        }
      }
    ],
    "salasAcessoLivre": [
      {
        "id": "uuid",
        "nome_sala": "L105",
        "ocupacao": 20,
        "quantidade_computadores": 19,
        "observacao": "Laboratório para pesquisas"
      }
    ],
    "diaSemana": 3
  }
  ```

---

## 3. Disciplinas

### `GET /api/v1/disciplinas`
Retorna a lista de disciplinas cadastradas.

### `POST /api/v1/disciplinas`
Cria uma nova disciplina.
- **Request Body:**
  ```json
  {
    "nome": "Machine Learning",
    "periodo": "2026.2",
    "sharepointSiteId": "team_4.6.2022010"
  }
  ```

### `GET /api/v1/disciplinas/:id`
Retorna os detalhes de uma disciplina, incluindo seus grupos e tarefas associadas.

### `PATCH /api/v1/disciplinas/:id`
Atualiza dados da disciplina.

### `DELETE /api/v1/disciplinas/:id`
Remove a disciplina e seus grupos vinculados.

---

## 4. Grupos

### `GET /api/v1/grupos`
Retorna lista de grupos (suporta filtro por query string `?disciplinaId=...`).

### `POST /api/v1/grupos`
Cria um novo grupo em uma disciplina.
- **Request Body:**
  ```json
  {
    "nome": "Grupo Alpha",
    "disciplinaId": "cuid_disciplina",
    "tema": "Sistema de Recomendação",
    "participantes": ["João Silva", "Maria Santos"]
  }
  ```

### `PATCH /api/v1/grupos/:id`
Atualiza nome, tema, disciplina ou participantes do grupo.

### `DELETE /api/v1/grupos/:id`
Exclui um grupo.

---

## 5. Tarefas (Kanban)

### `GET /api/v1/tarefas`
Retorna tarefas cadastradas.
- **Query Params (Opcionais):**
  - `disciplinaId` (string)
  - `individuais` (boolean: `true`)
  - `status` (`A_FAZER` | `EM_ANDAMENTO` | `EM_REVISAO` | `CONCLUIDO`)

### `POST /api/v1/tarefas`
Cria uma nova tarefa.
- **Request Body:**
  ```json
  {
    "titulo": "Entrega do Trabalho de IA",
    "descricao": "Detalhes...",
    "disciplinaId": "cuid_123",
    "grupoId": "cuid_grupo",
    "status": "A_FAZER",
    "prazo": "2026-08-28T23:59:00Z",
    "responsaveis": ["Eu", "João"]
  }
  ```

### `PATCH /api/v1/tarefas/:id`
Atualiza tarefa (incluindo status via drag & drop). Alterar a data de prazo reseta a flag `notificada` para `false`.

### `DELETE /api/v1/tarefas/:id`
Remove uma tarefa.

---

## 6. Horário Fixo Semanal

### `GET /api/v1/horario-fixo`
Retorna as entradas do horário fixo semanal (`?diaSemana=1..7` opcional).

### `POST /api/v1/horario-fixo`
Cria uma entrada no horário fixo.
- **Request Body:**
  ```json
  {
    "disciplinaId": "cuid_123",
    "professor": "Marcia Pantoja",
    "diaSemana": 3,
    "horaInicio": "08:00",
    "horaFim": "10:50",
    "salaPadrao": "D405"
  }
  ```

### `PATCH /api/v1/horario-fixo/:id`
Atualiza dados da entrada do horário fixo.

### `DELETE /api/v1/horario-fixo/:id`
Remove uma entrada do horário fixo.

---

## 7. Configurações de Webhook / Alerta

### `GET /api/v1/config/webhook`
Retorna as configurações atuais do webhook do Discord.

### `PATCH /api/v1/config/webhook`
Atualiza URL do Webhook e/ou horas de antecedência para disparo de notificação.
- **Request Body:**
  ```json
  {
    "discordWebhookUrl": "https://discord.com/api/webhooks/...",
    "antecedenciaHoras": 48
  }
  ```
