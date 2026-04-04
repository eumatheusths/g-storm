import Google from "@auth/core/providers/google";
import { defineConfig } from "auth-astro";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./src/db";
import { users, accounts, sessions, verificationTokens } from "./src/db/schema";

export default defineConfig({
  providers: [
    Google({
      clientId: import.meta.env.AUTH_GOOGLE_ID,
      clientSecret: import.meta.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
});