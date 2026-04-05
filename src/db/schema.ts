// src/db/schema.ts
import { timestamp, pgTable, text, primaryKey, integer, uuid } from "drizzle-orm/pg-core";
import type { AdapterAccount } from "@auth/core/adapters";

// 1. Tabela de Usuários (Dono da Estética)
export const users = pgTable("user", {
  id: text("id").notNull().primaryKey(),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  
  plan: text("plan").default("pro"),
  trialEndsAt: timestamp("trialEndsAt", { mode: "date" }).$defaultFn(() => {
    const data = new Date();
    data.setDate(data.getDate() + 15);
    return data;
  }),
  
  // DADOS DA EMPRESA E LINK
  slug: text("slug").unique(),
  companyName: text("companyName"),
  
  // NOVOS CAMPOS: FISCAL E CONTATO
  cpfCnpj: text("cpfCnpj"),
  telefone: text("telefone"),
});

// 2. Tabela: Catálogo de Serviços, Tempos e Preços Dinâmicos
export const configuracoesServico = pgTable("configuracoes_servico", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  nomeServico: text("nomeServico").notNull(),
  categoriaVeiculo: text("categoriaVeiculo").notNull(), 
  duracaoMinutos: integer("duracaoMinutos").notNull(), 
  
  precoPoucoSujo: integer("precoPoucoSujo"), 
  precoMedio: integer("precoMedio"), 
  precoMuitoSujo: integer("precoMuitoSujo"), 
});

// 3. Tabela: Agendamentos
export const agendamentos = pgTable("agendamentos", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  clienteNome: text("clienteNome").notNull(),
  clienteWhatsapp: text("clienteWhatsapp").notNull(),
  
  veiculoModelo: text("veiculoModelo").notNull(),
  veiculoPlaca: text("veiculoPlaca").notNull(),
  categoriaVeiculo: text("categoriaVeiculo").notNull(),
  
  servicoDesejado: text("servicoDesejado").notNull(),
  duracaoMinutos: integer("duracaoMinutos").notNull(),
  detalhesEstadoCarro: text("detalhesEstadoCarro"),
  
  nivelSujeira: text("nivelSujeira").default("Médio"), 
  fotoVeiculo: text("fotoVeiculo"), 
  
  dataAgendamento: timestamp("dataAgendamento", { mode: "date" }).notNull(),
  horaAgendamento: text("horaAgendamento").notNull(),
  
  status: text("status").default("pendente"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
});

// --------------------------------------------------------
// Tabelas do NextAuth (Google Login)
// --------------------------------------------------------
export const accounts = pgTable(
  "account",
  {
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({ columns: [account.provider, account.providerAccountId] }),
  })
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").notNull().primaryKey(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);