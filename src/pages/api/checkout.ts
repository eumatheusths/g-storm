// src/pages/api/webhook.ts
import type { APIRoute } from 'astro';
import { db } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';

export const POST: APIRoute = async ({ request }) => {
  try {
    // 1. Validação de Segurança
    const secret = request.headers.get('x-abacatepay-secret');
    if (secret !== process.env.ABACATE_PAY_WEBHOOK_SECRET) {
      console.error("Tentativa de acesso ao Webhook com Secret inválido.");
      return new Response("Não autorizado", { status: 401 });
    }

    const body = await request.json();
    console.log("🔔 Webhook recebido do Abacate Pay:", body.event);

    // 2. Verifica se o pagamento foi aprovado
    if (body.event === 'billing.paid' || body.event === 'BILLING.PAID') {
      const emailPagador = body.data?.customer?.email;
      const externalId = body.data?.products?.[0]?.externalId;

      console.log(`💰 Pagamento confirmado para: ${emailPagador} | Plano: ${externalId}`);

      if (emailPagador && externalId) {
        const userDbArray = await db.select().from(users).where(eq(users.email, emailPagador)).limit(1);
        const userDb = userDbArray[0];

        if (userDb) {
          const novaDataVencimento = new Date();
          
          // Lógica de tempo de acesso:
          if (externalId === 'plano_teste_gstorm') {
            novaDataVencimento.setDate(novaDataVencimento.getDate() + 7); // 7 dias de teste no PIX de R$ 1,00
          } else if (externalId.includes('mensal')) {
            novaDataVencimento.setMonth(novaDataVencimento.getMonth() + 1);
          } else if (externalId.includes('semestral')) {
            novaDataVencimento.setMonth(novaDataVencimento.getMonth() + 6);
          } else if (externalId.includes('anual')) {
            novaDataVencimento.setFullYear(novaDataVencimento.getFullYear() + 1);
          }

          // 3. ATUALIZAÇÃO NO BANCO (A MÁGICA ACONTECE AQUI)
          await db.update(users)
            .set({ 
              plan: 'pro',
              trialEndsAt: novaDataVencimento 
            })
            .where(eq(users.id, userDb.id));
            
          console.log(`✅ CONTA PROMOVIDA COM SUCESSO: ${emailPagador}`);
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error("❌ Erro processando Webhook:", error);
    return new Response("Erro interno", { status: 500 });
  }
}