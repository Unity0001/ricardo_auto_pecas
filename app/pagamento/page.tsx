'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

import { db } from '../lib/firebase';
import { enviarWhatsapp } from '../lib/whatsapp';

export default function PagamentoPage() {
  const [pagamento, setPagamento] = useState('');
  const [troco, setTroco] = useState('');

  const router = useRouter();

  const [cart, setCart] = useState<any[]>([]);
  const [entrega, setEntrega] = useState<any>(null);

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');

    const savedEntrega = localStorage.getItem('entrega');

    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }

    if (savedEntrega) {
      setEntrega(JSON.parse(savedEntrega));
    }
  }, []);

  const subtotal = cart.reduce(
    (acc: number, item: any) => acc + Number(item.price) * Number(item.quantity || 1),
    0
  );

  const taxaEntrega = entrega?.tipo === 'Entrega' ? 5 : 0;

  const total = subtotal + taxaEntrega;

  async function criarPedido(tipoPagamento: string, valorTroco?: string) {
    try {
      if (cart.length === 0) {
        alert('O carrinho está vazio.');
        return;
      }

      await addDoc(collection(db, 'pedidos'), {
        cart,

        entrega,

        subtotal,

        taxaEntrega,

        total,

        tipoPagamento,

        troco: tipoPagamento === 'Dinheiro' ? Number(valorTroco) : null,

        status: 'Processando',

        criadoEm: serverTimestamp(),
      });

      enviarWhatsapp({
        cart,
        entrega,
        subtotal,
        taxaEntrega,
        total,
        tipoPagamento,

        ...(tipoPagamento === 'Dinheiro'
          ? {
              troco: valorTroco,
            }
          : {}),
      });

      localStorage.removeItem('cart');
      localStorage.removeItem('entrega');

      setCart([]);
      setEntrega(null);

      alert('Pedido enviado com sucesso!');

      router.push('/');
    } catch (error) {
      console.error('Erro ao criar pedido:', error);

      alert('Não foi possível registrar o pedido.');
    }
  }

  async function enviarDinheiro() {
    if (!troco) {
      alert('Informe o valor para troco.');
      return;
    }

    const valorTroco = Number(troco);

    if (isNaN(valorTroco)) {
      alert('Informe um valor válido.');
      return;
    }

    if (valorTroco <= total) {
      alert(`O valor para troco deve ser maior que o total do pedido (R$ ${total.toFixed(2)}).`);
      return;
    }

    await criarPedido('Dinheiro', troco);
  }

  async function enviarCartao(tipo: 'Crédito' | 'Débito') {
    await criarPedido(tipo);
  }

  function irParaPix() {
    if (cart.length === 0) {
      alert('O carrinho está vazio.');
      return;
    }

    sessionStorage.setItem(
      'pedidoPix',
      JSON.stringify({
        cart,
        entrega,
        subtotal,
        taxaEntrega,
        total,
      })
    );

    router.push('/pix');
  }

  function novoPedido() {
    localStorage.removeItem('cart');
    localStorage.removeItem('entrega');

    sessionStorage.removeItem('pedidoPix');

    setCart([]);
    setEntrega(null);

    router.push('/');
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-8">
      <div className="mx-auto w-full max-w-md rounded-xl bg-white p-6 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold">Forma de Pagamento</h1>

        {/* TOTAL */}

        <div className="mb-6 rounded-lg bg-gray-100 p-4 text-center">
          <p className="text-sm text-gray-500">Total do pedido</p>

          <p className="mt-1 text-2xl font-bold">R$ {total.toFixed(2)}</p>
        </div>

        <div className="space-y-4">
          {/* CRÉDITO */}

          <button
            onClick={() => {
              setPagamento('Crédito');
              enviarCartao('Crédito');
            }}
            className="w-full rounded-lg bg-blue-600 p-4 font-semibold text-white transition hover:bg-blue-700"
          >
            💳 Cartão de Crédito
          </button>

          {/* DÉBITO */}

          <button
            onClick={() => {
              setPagamento('Débito');
              enviarCartao('Débito');
            }}
            className="w-full rounded-lg bg-indigo-600 p-4 font-semibold text-white transition hover:bg-indigo-700"
          >
            💳 Cartão de Débito
          </button>

          {/* PIX */}

          <button
            onClick={irParaPix}
            className="w-full rounded-lg bg-green-600 p-4 font-semibold text-white transition hover:bg-green-700"
          >
            ❖ PIX
          </button>

          {/* DINHEIRO */}

          <button
            onClick={() => setPagamento('Dinheiro')}
            className="w-full rounded-lg bg-yellow-500 p-4 font-semibold text-white transition hover:bg-yellow-600"
          >
            💵 Dinheiro
          </button>

          {/* TROCO */}

          {pagamento === 'Dinheiro' && (
            <div className="mt-6 space-y-4">
              <input
                type="number"
                placeholder={`Troco para (mínimo R$ ${(total + 0.01).toFixed(2)})`}
                value={troco}
                min={total + 0.01}
                step="0.01"
                onChange={(e) => setTroco(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-yellow-500"
              />

              <button
                onClick={enviarDinheiro}
                className="w-full rounded-lg bg-green-600 py-4 font-semibold text-white transition hover:bg-green-700"
              >
                Enviar Pedido
              </button>
            </div>
          )}

          {/* NOVO PEDIDO */}

          <button
            onClick={novoPedido}
            className="mt-4 w-full rounded-lg border border-gray-300 bg-gray-100 px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-200"
          >
            ← Fazer novo pedido
          </button>
        </div>
      </div>
    </main>
  );
}
