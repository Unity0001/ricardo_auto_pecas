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
    const body = await req.json();

    const carrinho = body.carrinho;
    const entrega = body.entrega;
    const cliente = body.cliente;

    console.log('========== INICIANDO PIX ==========');
    console.log('Carrinho:', carrinho);
    console.log('Entrega:', entrega);
    console.log('Cliente:', cliente);

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

    const produtos: Produto[] = produtosSnapshot.docs.map((item) => {
      const data = item.data();

      return {
        id: item.id,
        price: Number(data.price || 0),
      };
    });

    const misturasSnapshot = await getDocs(collection(db, 'misturas'));

    const misturasBanco: Mistura[] = misturasSnapshot.docs.map((item) => {
      const data = item.data();

      return {
        id: item.id,
        acrescimo: Number(data.acrescimo || 0),
      };
    });

    let subtotal = 0;

    for (const item of carrinho as CarrinhoItem[]) {
      const produto = produtos.find((p) => p.id === item.id);

      if (!produto) {
        console.warn('Produto não encontrado:', item.id);

        continue;
      }

      const quantidade = Number(item.quantity || 1);

      subtotal += produto.price * quantidade;

      if (Array.isArray(item.misturas)) {
        for (const mistura of item.misturas) {
          const misturaBanco = misturasBanco.find((m) => m.id === mistura.id);

          if (misturaBanco) {
            subtotal += misturaBanco.acrescimo * quantidade;
          }
        }
      }
    }

    subtotal = Number(subtotal.toFixed(2));

    let taxaEntrega = 0;

    if (entrega?.tipo === 'Entrega') {
      if (entrega?.tipoEntrega === 'Entrega Rodovias') {
        taxaEntrega = 8;
      } else {
        taxaEntrega = 5;
      }
    }

    const total = Number((subtotal + taxaEntrega).toFixed(2));

    console.log('Subtotal:', subtotal);
    console.log('Taxa de entrega:', taxaEntrega);
    console.log('Total:', total);

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
      subtotal,
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

    console.log('Criando pagamento no Mercado Pago...');

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

    console.log('Resposta do Mercado Pago:', resultado);

    const transactionData = resultado?.point_of_interaction?.transaction_data;

    console.log('Transaction Data:', transactionData);

    if (!transactionData) {
      console.error('Mercado Pago não retornou transaction_data');

      await deleteDoc(prePedidoRef);

      return NextResponse.json(
        {
          error: 'Mercado Pago não retornou os dados do PIX.',
          details: {
            id: resultado?.id,
            status: resultado?.status,
            status_detail: resultado?.status_detail,
          },
        },
        {
          status: 500,
        }
      );
    }

    if (!transactionData.qr_code) {
      console.error('Mercado Pago não retornou qr_code');

      await deleteDoc(prePedidoRef);

      return NextResponse.json(
        {
          error: 'Mercado Pago não retornou o Pix Copia e Cola.',
          details: {
            id: resultado?.id,
            status: resultado?.status,
            status_detail: resultado?.status_detail,
          },
        },
        {
          status: 500,
        }
      );
    }

    if (!transactionData.qr_code_base64) {
      console.error('Mercado Pago não retornou qr_code_base64');

      await deleteDoc(prePedidoRef);

      return NextResponse.json(
        {
          error: 'Mercado Pago não retornou o QR Code.',
          details: {
            id: resultado?.id,
            status: resultado?.status,
            status_detail: resultado?.status_detail,
          },
        },
        {
          status: 500,
        }
      );
    }

    await updateDoc(prePedidoRef, {
      pagamentoId: String(resultado.id),

      statusPagamento: resultado.status || 'pending',

      statusDetail: resultado.status_detail || null,
    });

    console.log('========== PIX CRIADO ==========');

    console.log({
      id: resultado.id,
      status: resultado.status,
      status_detail: resultado.status_detail,
      transaction_amount: resultado.transaction_amount,
      payment_method_id: resultado.payment_method_id,
      external_reference: resultado.external_reference,
      qr_code: transactionData.qr_code,
      has_qr_code_base64: !!transactionData.qr_code_base64,
      ticket_url: transactionData.ticket_url,
    });

    console.log('================================');

    return NextResponse.json({
      id: resultado.id,

      status: resultado.status,

      status_detail: resultado.status_detail,

      external_reference: referencia,

      valor: total,

      subtotal,

      taxaEntrega,

      qr_code_base64: transactionData.qr_code_base64,

      qr_code: transactionData.qr_code,

      ticket_url: transactionData.ticket_url,
    });
  } catch (error: any) {
    console.error('========== ERRO PIX ==========');

    console.error(error);

    console.error('Mensagem:', error?.message);

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
