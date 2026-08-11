import { NextRequest, NextResponse } from 'next/server';

import { MercadoPagoConfig, Payment } from 'mercadopago';

const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

if (!accessToken) {
  throw new Error('MERCADO_PAGO_ACCESS_TOKEN não configurado');
}

const client = new MercadoPagoConfig({
  accessToken,
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          error: 'ID do pagamento não informado',
        },
        {
          status: 400,
        }
      );
    }

    console.log('Consultando pagamento Mercado Pago:', id);

    const payment = new Payment(client);

    const pagamento = await payment.get({
      id: String(id),
    });

    console.log('========== STATUS PIX ==========');

    console.log({
      id: pagamento.id,

      status: pagamento.status,

      status_detail: pagamento.status_detail,

      transaction_amount: pagamento.transaction_amount,

      external_reference: pagamento.external_reference,
    });

    console.log('================================');

    return NextResponse.json({
      id: pagamento.id,

      status: pagamento.status || 'pending',

      status_detail: pagamento.status_detail || null,

      transaction_amount: pagamento.transaction_amount || 0,

      external_reference: pagamento.external_reference || null,
    });
  } catch (error: any) {
    console.error('========== ERRO STATUS PIX ==========');

    console.error(error);

    console.error('======================================');

    return NextResponse.json(
      {
        error: 'Erro ao consultar pagamento',

        details: error?.message || 'Erro desconhecido',
      },
      {
        status: 500,
      }
    );
  }
}
