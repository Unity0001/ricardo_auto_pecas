import { NextRequest, NextResponse } from 'next/server';

import { MercadoPagoConfig, Payment } from 'mercadopago';

import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

import { db } from '@/app/lib/firebase';

import { v4 as uuidv4 } from 'uuid';

interface CarrinhoItem {
  id: string;

  quantity: number;

  misturas?: {
    id: string;
  }[];
}

interface Produto {
  id: string;
  price: number;
}

interface Mistura {
  id: string;
  acrescimo: number;
}

const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

if (!accessToken) {
  throw new Error('MERCADO_PAGO_ACCESS_TOKEN não configurado');
}

const client = new MercadoPagoConfig({
  accessToken,
});

export async function POST(req: NextRequest) {
  let referencia = '';

  try {
    const { carrinho, entrega, cliente } = await req.json();

    if (!Array.isArray(carrinho) || carrinho.length === 0) {
      return NextResponse.json(
        {
          error: 'Carrinho vazio',
        },
        {
          status: 400,
        }
      );
    }

    const produtosSnapshot = await getDocs(collection(db, 'products'));

    const produtos: Produto[] = produtosSnapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,

        price: Number(data.price),
      };
    });

    const misturasSnapshot = await getDocs(collection(db, 'misturas'));

    const misturasBanco: Mistura[] = misturasSnapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,

        acrescimo: Number(data.acrescimo || 0),
      };
    });

    let total = 0;

    for (const item of carrinho as CarrinhoItem[]) {
      const produto = produtos.find((p) => p.id === item.id);

      if (!produto) {
        continue;
      }

      const quantidade = Number(item.quantity || 1);

      total += produto.price * quantidade;

      if (Array.isArray(item.misturas)) {
        for (const mistura of item.misturas) {
          const misturaBanco = misturasBanco.find((m) => m.id === mistura.id);

          if (misturaBanco) {
            total += misturaBanco.acrescimo * quantidade;
          }
        }
      }
    }

    const taxaEntrega = entrega?.tipo === 'Entrega' ? Number(process.env.TAXA_ENTREGA || 5) : 0;

    total += taxaEntrega;

    total = Number(total.toFixed(2));

    if (total <= 0) {
      return NextResponse.json(
        {
          error: 'Valor inválido',
        },
        {
          status: 400,
        }
      );
    }

    referencia = `PEDIDO-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;

    const prePedidoRef = doc(db, 'pedidos_pix', referencia);

    await setDoc(prePedidoRef, {
      cart: carrinho,

      entrega,

      subtotal: Number((total - taxaEntrega).toFixed(2)),

      taxaEntrega,

      total,

      tipoPagamento: 'PIX',

      status: 'Aguardando pagamento',

      processado: false,

      referencia,

      cliente: cliente || null,

      pagamentoId: null,

      criadoEm: new Date(),
    });

    console.log('Pré-pedido PIX criado:', referencia);

    const idempotencyKey = uuidv4();

    const payment = new Payment(client);

    const resultado = await payment.create({
      body: {
        transaction_amount: total,

        description: 'Pedido Rei do Suco',

        payment_method_id: 'pix',

        payer: {
          email: cliente?.email || 'cliente@email.com',

          first_name: cliente?.nome || 'Cliente',
        },

        external_reference: referencia,

        ...(process.env.MERCADO_PAGO_WEBHOOK_URL && {
          notification_url: process.env.MERCADO_PAGO_WEBHOOK_URL,
        }),
      },

      requestOptions: {
        idempotencyKey,
      },
    });

    await updateDoc(prePedidoRef, {
      pagamentoId: String(resultado.id),

      statusPagamento: resultado.status || 'pending',

      statusDetail: resultado.status_detail || null,
    });

    const transactionData = resultado.point_of_interaction?.transaction_data;

    console.log('========== PIX CRIADO ==========');

    console.log({
      id: resultado.id,

      status: resultado.status,

      status_detail: resultado.status_detail,

      transaction_amount: resultado.transaction_amount,

      payment_method_id: resultado.payment_method_id,

      external_reference: resultado.external_reference,

      qr_code: transactionData?.qr_code,

      has_qr_code_base64: !!transactionData?.qr_code_base64,
    });

    console.log('================================');

    if (!transactionData?.qr_code) {
      await deleteDoc(prePedidoRef);

      return NextResponse.json(
        {
          error: 'Mercado Pago não retornou o Pix Copia e Cola',
        },
        {
          status: 500,
        }
      );
    }

    if (!transactionData?.qr_code_base64) {
      await deleteDoc(prePedidoRef);

      return NextResponse.json(
        {
          error: 'Mercado Pago não retornou o QR Code',
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      id: resultado.id,

      status: resultado.status,

      status_detail: resultado.status_detail,

      external_reference: referencia,

      valor: total,

      qr_code_base64: transactionData.qr_code_base64,

      qr_code: transactionData.qr_code,

      ticket_url: transactionData.ticket_url,
    });
  } catch (error: any) {
    console.error('========== ERRO PIX ==========');

    console.error(error);

    console.error('================================');

    if (referencia) {
      try {
        await deleteDoc(doc(db, 'pedidos_pix', referencia));
      } catch (deleteError) {
        console.error('Erro ao remover pré-pedido:', deleteError);
      }
    }

    return NextResponse.json(
      {
        error: 'Erro ao gerar PIX',

        details: error?.message || 'Erro desconhecido',
      },
      {
        status: 500,
      }
    );
  }
}
