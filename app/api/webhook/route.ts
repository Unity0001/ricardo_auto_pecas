import { NextRequest, NextResponse } from 'next/server';

import { MercadoPagoConfig, Payment } from 'mercadopago';

import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

import { db } from '@/app/lib/firebase';

const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

if (!accessToken) {
  throw new Error('MERCADO_PAGO_ACCESS_TOKEN não configurado');
}

const client = new MercadoPagoConfig({
  accessToken,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log('Webhook Mercado Pago:', body);

    if (body.type !== 'payment' || !body.data?.id) {
      return NextResponse.json({
        ok: true,
      });
    }

    const paymentId = String(body.data.id);

    const payment = new Payment(client);

    const pagamento = await payment.get({
      id: paymentId,
    });

    console.log('Pagamento:', pagamento.id);
    console.log('Status:', pagamento.status);
    console.log('Status detail:', pagamento.status_detail);
    console.log('External reference:', pagamento.external_reference);

    if (pagamento.status !== 'approved') {
      return NextResponse.json({
        ok: true,
        status: pagamento.status,
      });
    }

    const referencia = pagamento.external_reference;

    if (!referencia) {
      console.error('Pagamento aprovado sem external_reference.');

      return NextResponse.json({
        ok: true,
      });
    }

    const prePedidoRef = doc(db, 'pedidos_pix', referencia);

    const prePedidoSnapshot = await getDoc(prePedidoRef);

    if (!prePedidoSnapshot.exists()) {
      console.error('Pré-pedido PIX não encontrado:', referencia);

      return NextResponse.json({
        ok: true,
      });
    }

    const prePedido = prePedidoSnapshot.data();

    if (prePedido.processado === true) {
      console.log('PIX já processado:', referencia);

      return NextResponse.json({
        ok: true,
        duplicado: true,
      });
    }

    const pedidoRef = await addDoc(collection(db, 'pedidos'), {
      cart: prePedido.cart,
      entrega: prePedido.entrega,
      subtotal: prePedido.subtotal,
      taxaEntrega: prePedido.taxaEntrega,
      total: prePedido.total,
      tipoPagamento: 'PIX',
      troco: null,
      status: 'Processando',
      pagamentoId: paymentId,
      pagamentoStatus: 'approved',
      externalReference: referencia,
      criadoEm: serverTimestamp(),
      pagoEm: serverTimestamp(),
    });

    await updateDoc(prePedidoRef, {
      processado: true,
      pedidoId: pedidoRef.id,
      pagamentoId: paymentId,
      processadoEm: serverTimestamp(),
    });

    const mensagem = montarMensagemWhatsapp({
      cart: prePedido.cart,
      entrega: prePedido.entrega,
      subtotal: prePedido.subtotal,
      taxaEntrega: prePedido.taxaEntrega,
      total: prePedido.total,
      tipoPagamento: 'PIX',
    });

    const telefone = process.env.WHATSAPP_NUMERO;

    let whatsappUrl = '';

    if (telefone) {
      whatsappUrl = `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;

      console.log('WhatsApp:', whatsappUrl);
    }

    return NextResponse.json({
      ok: true,
      pedidoId: pedidoRef.id,
      status: 'approved',
      whatsappUrl,
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

function montarMensagemWhatsapp({
  cart,
  entrega,
  subtotal,
  taxaEntrega,
  total,
  tipoPagamento,
}: any) {
  let mensagem = `✅ *NOVO PEDIDO*\n\n`;

  if (Array.isArray(cart)) {
    cart.forEach((item: any) => {
      mensagem += `🍱 ${item.quantity || 1}x ${item.title || item.nome || 'Produto'}\n`;

      if (item.price != null) {
        mensagem += `   R$ ${(Number(item.price) * Number(item.quantity || 1)).toFixed(2)}\n`;
      }

      if (Array.isArray(item.misturas) && item.misturas.length > 0) {
        mensagem += `   Misturas: ${item.misturas
          .map((m: any) => m.nome || m.title || m.id)
          .join(', ')}\n`;
      }

      if (item.observacao) {
        mensagem += `   Observação: ${item.observacao}\n`;
      }

      mensagem += '\n';
    });
  }

  mensagem += `💰 Subtotal: R$ ${Number(subtotal || 0).toFixed(2)}\n`;
  mensagem += `🚚 Entrega: R$ ${Number(taxaEntrega || 0).toFixed(2)}\n`;
  mensagem += `💵 *Total: R$ ${Number(total || 0).toFixed(2)}*\n`;
  mensagem += `💳 Pagamento: ${tipoPagamento}\n`;

  if (entrega?.tipo === 'Entrega') {
    mensagem += `\n📍 *Entrega*\n`;

    if (entrega.rua) {
      mensagem += `Rua: ${entrega.rua}\n`;
    }

    if (entrega.numero) {
      mensagem += `Número: ${entrega.numero}\n`;
    }

    if (entrega.complemento) {
      mensagem += `Complemento: ${entrega.complemento}\n`;
    }

    if (entrega.bairro) {
      mensagem += `Bairro: ${entrega.bairro}\n`;
    }

    if (entrega.referencia) {
      mensagem += `Referência: ${entrega.referencia}\n`;
    }
  } else {
    mensagem += `\n🏪 *Retirada no local*\n`;
  }

  return mensagem;
}
