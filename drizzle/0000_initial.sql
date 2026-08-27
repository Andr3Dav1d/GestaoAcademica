CREATE TABLE IF NOT EXISTS disciplinas (
  id text PRIMARY KEY,
  nome text NOT NULL,
  periodo text NOT NULL,
  sharepoint_site_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS grupos (
  id text PRIMARY KEY,
  nome text NOT NULL,
  disciplina_id text NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
  tema text,
  participantes jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tarefas (
  id text PRIMARY KEY,
  titulo text NOT NULL,
  descricao text,
  disciplina_id text REFERENCES disciplinas(id) ON DELETE SET NULL,
  grupo_id text REFERENCES grupos(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'A_FAZER',
  prazo timestamptz NOT NULL,
  responsaveis jsonb NOT NULL DEFAULT '[]'::jsonb,
  notificada boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS horarios_fixos (
  id text PRIMARY KEY,
  disciplina_id text NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
  professor text NOT NULL,
  dia_semana integer NOT NULL,
  hora_inicio text NOT NULL,
  hora_fim text NOT NULL,
  sala_padrao text NOT NULL DEFAULT 'D405',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS config_webhook (
  id text PRIMARY KEY,
  discord_webhook_url text,
  antecedencia_horas integer NOT NULL DEFAULT 48,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
