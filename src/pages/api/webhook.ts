import type { APIRoute } from 'astro';
import { db } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';

export const POST: APIRoute = async ({ request }) => {
  try {
    // 1. Captura o Secret que o Abacate Pay enviou
    const secret = request.headers.get('x-abacatepay-secret');
    const expectedSecret = process.env.ABACATE_PAY_WEBHOOK_SECRET;

    // Log de segurança (ajuda muito no deploy inicial)
    console.log("--- DEBUG WEBHOOK ---");
    console.log("Secret recebido:", secret);
    console.log("Secret esperado:", expectedSecret);

    if (secret !== expectedSecret) {
      console.error("❌ ERRO: Secret inválido. Verifique o painel do Abacate Pay e as variáveis da Vercel.");
      return new Response("Não autorizado", { status: 401 });
    }

    const body = await request.json();
    console.log("Evento recebido:", body.event);

    // 2. Processa o pagamento aprovado
    if (body.event === 'billing.paid' || body.event === 'BILLING.PAID') {
      const emailPagador = body.data?.customer?.email;
      const externalId = body.data?.products?.[0]?.externalId;

      console.log(`💰 Pagamento confirmado: ${emailPagador} | Plano: ${externalId}`);

      if (emailPagador && externalId) {
        const novaDataVencimento = new Date();
        
        // Lógica de tempo baseada no plano escolhido
        if (externalId === 'plano_teste_gstorm') {
          novaDataVencimento.setDate(novaDataVencimento.getDate() + 7); // +7 dias de teste
        } 
        else if (externalId.includes('mensal')) {
          novaDataVencimento.setMonth(novaDataVencimento.getMonth() + 1); // +1 mês
        } 
        else if (externalId.includes('semestral')) {
          novaDataVencimento.setMonth(novaDataVencimento.getMonth() + 6); // +6 meses
        } 
        else if (externalId.includes('anual')) {
          novaDataVencimento.setFullYear(novaDataVencimento.getFullYear() + 1); // +1 ano
        }

        // 3. Atualiza o banco e promove a conta para PRO
        await db.update(users)
          .set({ 
            plan: 'pro', 
            trialEndsAt: novaDataVencimento 
          })
          .where(eq(users.email, emailPagador));
            
        console.log(`✅ [PRO ATIVADO] Sucesso para: ${emailPagador}`);
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error("❌ Erro interno no Webhook:", error);
    return new Response("Erro interno", { status: 500 });
  }
}