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
  const numero = '5519989633907';

  let dadosEntrega = '';

  if (entrega?.tipo === 'Entrega') {
    dadosEntrega = `
📍 *ENTREGA*

👤 *Nome:* ${entrega.nome}

🏠 *Endereço:* ${entrega.rua}, ${entrega.numero}

🏘 *Bairro:* ${entrega.bairro}

📌 *Complemento:* ${entrega.complemento || '-'}

📍 *Referência:* ${entrega.referencia || '-'}

🚚 *Taxa de entrega:* R$ ${Number(taxaEntrega).toFixed(2)}
`;
  } else {
    dadosEntrega = `
🏪 *RETIRADA NO LOCAL*

👤 *Nome:* ${entrega?.nome || '-'}

Cliente irá retirar o pedido.
`;
  }

  const listaProdutos = cart
    .map((item: any) => {
      return `
🛒 *${item.quantity}x ${item.title}*

💵 *Valor unitário:* R$ ${Number(item.price).toFixed(2)}

💰 *Subtotal:* R$ ${(Number(item.price) * Number(item.quantity)).toFixed(2)}

────────────────────────────`;
    })
    .join('\n');

  const mensagem = `🔧 *RICARDO AUTO PEÇAS*

📦 *NOVO PEDIDO*

================================

${listaProdutos}

================================

💵 *Subtotal:* R$ ${Number(subtotal).toFixed(2)}
🚚 *Entrega:* R$ ${Number(taxaEntrega).toFixed(2)}
💲 *TOTAL:* R$ ${Number(total).toFixed(2)}

================================

${dadosEntrega}

================================

💳 *Forma de Pagamento:* ${tipoPagamento}

${tipoPagamento === 'Dinheiro' ? `💰 *Troco para:* R$ ${troco || '0,00'}` : ''}

Obrigado pela preferência! 😊`;

  window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`, '_blank');
}
