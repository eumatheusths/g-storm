import type { APIRoute } from 'astro';
import { db } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Captura o Secret enviado no cabeçalho
    const secretChegou = request.headers.get('x-abacatepay-secret');
    
    // Tenta ler a variável da Vercel (importante: na Vercel o Astro usa process.env)
    const secretEsperado = process.env.ABACATE_PAY_WEBHOOK_SECRET || import.meta.env.ABACATE_PAY_WEBHOOK_SECRET;

    console.log("--- DEBUG WEBHOOK G STORM ---");
    console.log("Secret enviado pelo Abacate Pay:", secretChegou);
    console.log("Secret configurado na Vercel:", secretEsperado);

    // Validação com tratamento de espaços vazios
    if (!secretChegou || secretChegou.trim() !== secretEsperado?.trim()) {
      console.error("❌ BLOQUEADO: As senhas do Webhook não coincidem.");
      return new Response("Não autorizado", { status: 401 });
    }

    const body = await request.json();
    console.log("✅ SENHA CORRETA! Processando evento:", body.event);

    if (body.event === 'billing.paid' || body.event === 'BILLING.PAID') {
      const emailPagador = body.data?.customer?.email;
      const externalId = body.data?.products?.[0]?.externalId;

      if (emailPagador && externalId) {
        const novaDataVencimento = new Date();
        
        // Lógica de tempo por plano
        if (externalId === 'plano_teste_gstorm') novaDataVencimento.setDate(novaDataVencimento.getDate() + 7);
        else if (externalId.includes('mensal')) novaDataVencimento.setMonth(novaDataVencimento.getMonth() + 1);
        else if (externalId.includes('semestral')) novaDataVencimento.setMonth(novaDataVencimento.getMonth() + 6);
        else if (externalId.includes('anual')) novaDataVencimento.setFullYear(novaDataVencimento.getFullYear() + 1);

        await db.update(users)
          .set({ plan: 'pro', trialEndsAt: novaDataVencimento })
          .where(eq(users.email, emailPagador));
            
        console.log(`🚀 [PRO ATIVADO] Conta de ${emailPagador} liberada via Webhook!`);
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("❌ Erro fatal no Webhook:", error);
    return new Response("Erro interno", { status: 500 });
  }
}