import { NextRequest, NextResponse } from 'next/server';

import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log('Webhook Mercado Pago:', body);

    if (body.type === 'payment' && body.data?.id) {
      const payment = new Payment(client);

      const pagamento = await payment.get({
        id: String(body.data.id),
      });

      console.log('Pagamento:', pagamento.id);

      console.log('Status:', pagamento.status);

      if (pagamento.status === 'approved') {
        console.log('Pagamento aprovado!');
      }
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error('Erro webhook:', error);

    return NextResponse.json(
      {
        error: 'Erro no webhook',
      },
      {
        status: 500,
      }
    );
  }
}
