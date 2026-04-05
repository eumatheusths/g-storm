import type { APIRoute } from 'astro';
import { getSession } from 'auth-astro/server';
import { db } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';

export const POST: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session?.user?.email) {
    return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401 });
  }

  try {
    const body = await request.json();
    const { plano } = body; 

    const userDbArray = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1);
    const userDb = userDbArray[0];

    if (!userDb) {
      return new Response(JSON.stringify({ error: "Usuário não encontrado" }), { status: 404 });
    }

    // Configurações de Preço, Nome e Identificador Único
    let priceInCents = 0;
    let description = '';
    let externalId = '';

    if (plano === 'teste') {
      priceInCents = 10; // R$ 0,10 (Para validar o Webhook)
      description = 'G STORM - Teste de Sistema';
      externalId = 'plano_teste_gstorm';
    } else if (plano === 'mensal') {
      priceInCents = 6790; // R$ 67,90
      description = 'G STORM PRO - Plano Mensal';
      externalId = 'plano_mensal_gstorm';
    } else if (plano === 'semestral') {
      priceInCents = 34740; // R$ 57,90 * 6 meses
      description = 'G STORM PRO - Plano Semestral';
      externalId = 'plano_semestral_gstorm';
    } else if (plano === 'anual') {
      priceInCents = 59880; // R$ 49,90 * 12 meses
      description = 'G STORM PRO - Plano Anual';
      externalId = 'plano_anual_gstorm';
    } else {
      return new Response(JSON.stringify({ error: "Plano inválido" }), { status: 400 });
    }

    const siteUrl = "https://g-storm.vercel.app";

    // Envio dos dados para o Abacate Pay
    const response = await fetch('https://api.abacatepay.com/v1/billing/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ABACATE_PAY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        frequency: "ONE_TIME",
        methods: ["PIX", "CARD"],
        returnUrl: `${siteUrl}/cancelado`,      // Página se o cliente desistir
        completionUrl: `${siteUrl}/sucesso`,    // Página após o pagamento concluído
        customer: {
          name: userDb.name || 'Dono G STORM',
          email: userDb.email,
          taxId: userDb.cpfCnpj || undefined,
          cellphone: userDb.telefone || undefined
        },
        products: [{
          externalId: externalId,
          name: description,
          quantity: 1,
          price: priceInCents
        }]
      })
    });

    const data = await response.json();

    if (data.data && data.data.url) {
      return new Response(JSON.stringify({ success: true, checkoutUrl: data.data.url }), { status: 200 });
    } else {
      console.error("ERRO ABACATE PAY:", data);
      return new Response(JSON.stringify({ error: "Erro ao gerar checkout. Verifique o terminal da Vercel." }), { status: 500 });
    }

  } catch (error) {
    console.error("Erro interno no servidor:", error);
    return new Response(JSON.stringify({ error: "Erro interno no servidor" }), { status: 500 });
  }
}