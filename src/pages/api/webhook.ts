// src/pages/api/webhook.ts
import type { APIRoute } from 'astro';
import { db } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';

export const POST: APIRoute = async ({ request }) => {
  try {
    const secret = request.headers.get('x-abacatepay-secret');
    if (secret !== process.env.ABACATE_PAY_WEBHOOK_SECRET) {
      return new Response("Não autorizado", { status: 401 });
    }

    const body = await request.json();

    if (body.event === 'billing.paid' || body.event === 'BILLING.PAID') {
      const emailPagador = body.data?.customer?.email;
      const externalId = body.data?.products?.[0]?.externalId;

      if (emailPagador && externalId) {
        const novaDataVencimento = new Date();
        
        if (externalId.includes('mensal')) novaDataVencimento.setMonth(novaDataVencimento.getMonth() + 1);
        else if (externalId.includes('semestral')) novaDataVencimento.setMonth(novaDataVencimento.getMonth() + 6);
        else if (externalId.includes('anual')) novaDataVencimento.setFullYear(novaDataVencimento.getFullYear() + 1);

        await db.update(users)
          .set({ plan: 'pro', trialEndsAt: novaDataVencimento })
          .where(eq(users.email, emailPagador));
            
        console.log(`[PRO ATIVADO] ${emailPagador}`);
      }
    }
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    return new Response("Erro interno", { status: 500 });
  }
}