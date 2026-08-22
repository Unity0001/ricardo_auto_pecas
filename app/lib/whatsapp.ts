export function enviarWhatsapp({
  cart,
  entrega,
  subtotal,
  taxaEntrega,
  total,
  tipoPagamento,
  troco,
}: {
  cart: any[];
  entrega: any;
  subtotal: number;
  taxaEntrega: number;
  total: number;
  tipoPagamento: string;
  troco?: string;
}) {
  const numero = '5519995498950';

  let dadosEntrega = '';

  if (entrega?.tipo === 'Entrega') {
    dadosEntrega = `
📍 *ENTREGA*

👤 *Nome:* ${entrega.nome}

🏠 *Endereço:* ${entrega.rua}, ${entrega.numero}

🏘 *Bairro:* ${entrega.bairro}

📌 *Complemento:* ${entrega.complemento || '-'}

📍 *Referência:* ${entrega.referencia || '-'}

🚚 *Taxa de entrega:* R$ ${taxaEntrega.toFixed(2)}
`;
  } else {
    dadosEntrega = `
🏪 *RETIRADA NO LOCAL*

👤 *Nome:* ${entrega?.nome}

Cliente irá retirar o pedido.
`;
  }

  const listaProdutos = cart
    .map((item: any) => {
      const misturas =
        item.misturas?.length > 0
          ? item.misturas
              .map(
                (m: any) =>
                  `• ${m.nome}${
                    m.acrescimo > 0 ? ` (Acréscimo R$ ${Number(m.acrescimo).toFixed(2)})` : ''
                  }`
              )
              .join('\n')
          : 'Nenhuma';

      const acompanhamentos =
        item.acompanhamentos?.length > 0
          ? item.acompanhamentos.map((a: any) => `• ${a.nome}`).join('\n')
          : 'Nenhum';

      return `
🍱 *${item.quantity}x ${item.title}*

💵 Valor unitário: R$ ${Number(item.price).toFixed(2)}

🥩 *Misturas*
${misturas}

🥗 *Acompanhamentos*
${acompanhamentos}

${
  item.observacao?.trim()
    ? `📝 *Observações:*
${item.observacao}

`
    : ''
}💰 *Subtotal:* R$ ${(item.price * item.quantity).toFixed(2)}

────────────────────────────`;
    })
    .join('\n\n');

  const mensagem = `🍱 *NOVO PEDIDO*

================================

${listaProdutos}

================================

💵 *Subtotal:* R$ ${subtotal.toFixed(2)}
🚚 *Entrega:* R$ ${taxaEntrega.toFixed(2)}
💲 *TOTAL:* R$ ${total.toFixed(2)}

================================

${dadosEntrega}

================================

💳 *Forma de Pagamento:* ${tipoPagamento}

${tipoPagamento === 'Dinheiro' ? `💰 *Troco para:* R$ ${troco}` : ''}

Obrigado pela preferência! 😊`;

  window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`, '_blank');
}
