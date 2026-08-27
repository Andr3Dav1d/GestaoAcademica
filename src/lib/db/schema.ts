import { relations, sql } from 'drizzle-orm'
import { boolean, integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const disciplinas = pgTable('disciplinas', {
  id: text('id').primaryKey(),
  nome: text('nome').notNull(),
  periodo: text('periodo').notNull(),
  sharepointSiteId: text('sharepoint_site_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const grupos = pgTable('grupos', {
  id: text('id').primaryKey(),
  nome: text('nome').notNull(),
  disciplinaId: text('disciplina_id').notNull().references(() => disciplinas.id, { onDelete: 'cascade' }),
  tema: text('tema'),
  participantes: jsonb('participantes').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const tarefas = pgTable('tarefas', {
  id: text('id').primaryKey(),
  titulo: text('titulo').notNull(),
  descricao: text('descricao'),
  disciplinaId: text('disciplina_id').references(() => disciplinas.id, { onDelete: 'set null' }),
  grupoId: text('grupo_id').references(() => grupos.id, { onDelete: 'set null' }),
  status: text('status').notNull().default('A_FAZER'),
  prazo: timestamp('prazo', { withTimezone: true }).notNull(),
  responsaveis: jsonb('responsaveis').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  notificada: boolean('notificada').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const horariosFixos = pgTable('horarios_fixos', {
  id: text('id').primaryKey(),
  disciplinaId: text('disciplina_id').notNull().references(() => disciplinas.id, { onDelete: 'cascade' }),
  professor: text('professor').notNull(),
  diaSemana: integer('dia_semana').notNull(),
  horaInicio: text('hora_inicio').notNull(),
  horaFim: text('hora_fim').notNull(),
  salaPadrao: text('sala_padrao').notNull().default('D405'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const configWebhook = pgTable('config_webhook', {
  id: text('id').primaryKey(),
  discordWebhookUrl: text('discord_webhook_url'),
  antecedenciaHoras: integer('antecedencia_horas').notNull().default(48),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const disciplinasRelations = relations(disciplinas, ({ many }) => ({
  grupos: many(grupos),
  tarefas: many(tarefas),
  horariosFixos: many(horariosFixos),
}))

export const gruposRelations = relations(grupos, ({ one, many }) => ({
  disciplina: one(disciplinas, {
    fields: [grupos.disciplinaId],
    references: [disciplinas.id],
  }),
  tarefas: many(tarefas),
}))

export const tarefasRelations = relations(tarefas, ({ one }) => ({
  disciplina: one(disciplinas, {
    fields: [tarefas.disciplinaId],
    references: [disciplinas.id],
  }),
  grupo: one(grupos, {
    fields: [tarefas.grupoId],
    references: [grupos.id],
  }),
}))

export const horariosFixosRelations = relations(horariosFixos, ({ one }) => ({
  disciplina: one(disciplinas, {
    fields: [horariosFixos.disciplinaId],
    references: [disciplinas.id],
  }),
}))
