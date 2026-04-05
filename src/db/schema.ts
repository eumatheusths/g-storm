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
  
  // Dados do G STORM
  plan: text("plan").default("pro"),
  trialEndsAt: timestamp("trialEndsAt", { mode: "date" }).$defaultFn(() => {
    const data = new Date();
    data.setDate(data.getDate() + 15);
    return data;
  }),
  
  // NOVO: Link único da estética para enviar aos clientes (ex: "estetica-premium")
  slug: text("slug").unique(),
  // NOVO: Nome da empresa que vai aparecer na página do cliente
  companyName: text("companyName"),
});

// 2. NOVA TABELA: Agendamentos e Quiz de Pré-Atendimento
export const agendamentos = pgTable("agendamentos", {
  // ID único gerado automaticamente pelo banco
  id: uuid("id").defaultRandom().primaryKey(),
  
  // Relacionamento: De qual estética (usuário) é esse agendamento?
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Dados do Cliente e Veículo (Passo 1 do Quiz)
  clienteNome: text("clienteNome").notNull(),
  clienteWhatsapp: text("clienteWhatsapp").notNull(),
  veiculoModelo: text("veiculoModelo").notNull(),
  veiculoPlaca: text("veiculoPlaca").notNull(),
  
  // Dados do Serviço (Passo 2 do Quiz)
  servicoDesejado: text("servicoDesejado").notNull(),
  detalhesEstadoCarro: text("detalhesEstadoCarro"), // Ex: "Pintura muito arranhada, banco manchado"
  
  // Dados de Data e Hora (Passo 3 do Quiz)
  dataAgendamento: timestamp("dataAgendamento", { mode: "date" }).notNull(),
  horaAgendamento: text("horaAgendamento").notNull(), // Ex: "14:30"
  
  // Controle do Painel
  status: text("status").default("pendente"), // Pode ser: pendente, confirmado, concluido, cancelado
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
});

// --------------------------------------------------------
// Tabelas obrigatórias do Google/NextAuth (Mantidas intactas)
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