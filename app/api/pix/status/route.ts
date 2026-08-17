import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { collection, getDocs, query, where, doc, setDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';

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

    let pedidoId: string | null = null;

    const pedidosPagamentoSnapshot = await getDocs(
      query(collection(db, 'pedidos'), where('pagamentoId', '==', String(id)))
    );

    if (!pedidosPagamentoSnapshot.empty) {
      pedidoId = pedidosPagamentoSnapshot.docs[0].id;
    }

    if (!pedidoId && pagamento.external_reference) {
      const pedidosReferenciaSnapshot = await getDocs(
        query(
          collection(db, 'pedidos'),
          where('externalReference', '==', pagamento.external_reference)
        )
      );

      if (!pedidosReferenciaSnapshot.empty) {
        pedidoId = pedidosReferenciaSnapshot.docs[0].id;
      }
    }

    if (pagamento.status === 'approved' && !pedidoId) {
      console.log('Pagamento aprovado. Procurando pré-pedido...');

      const referencia = pagamento.external_reference;

      if (referencia) {
        const prePedidoSnapshot = await getDocs(
          query(collection(db, 'pedidos_pix'), where('referencia', '==', referencia))
        );

        if (!prePedidoSnapshot.empty) {
          const prePedidoDoc = prePedidoSnapshot.docs[0];
          const prePedido = prePedidoDoc.data();

          if (!prePedido.processado) {
            pedidoId = doc(collection(db, 'pedidos')).id;

            await setDoc(doc(db, 'pedidos', pedidoId), {
              cart: prePedido.cart || [],
              entrega: prePedido.entrega || {},
              subtotal: Number(prePedido.subtotal || 0),
              taxaEntrega: Number(prePedido.taxaEntrega || 0),
              total: Number(prePedido.total || 0),
              tipoPagamento: 'PIX',
              troco: null,
              status: 'Processando',
              pagamentoId: String(pagamento.id),
              pagamentoStatus: pagamento.status,
              externalReference: referencia,
              criadoEm: new Date(),
              pagoEm: new Date(),
            });

            console.log('Pedido criado:', pedidoId);
          } else {
            pedidoId = prePedido.pedidoId || null;
          }
        }
      }
    }

    console.log('========== STATUS PIX ==========');

    console.log({
      id: pagamento.id,
      status: pagamento.status,
      status_detail: pagamento.status_detail,
      transaction_amount: pagamento.transaction_amount,
      external_reference: pagamento.external_reference,
      pedidoId,
    });

    console.log('================================');

    return NextResponse.json({
      id: pagamento.id,
      status: pagamento.status || 'pending',
      status_detail: pagamento.status_detail || null,
      transaction_amount: pagamento.transaction_amount || 0,
      external_reference: pagamento.external_reference || null,
      pedidoId,
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
