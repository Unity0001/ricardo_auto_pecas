'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PixPage() {
  const router = useRouter();

  const [qrCode, setQrCode] = useState('');
  const [copiaCola, setCopiaCola] = useState('');
  const [valor, setValor] = useState(0);

  const [paymentId, setPaymentId] = useState('');
  const [statusPagamento, setStatusPagamento] = useState('pending');

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const [verificandoPagamento, setVerificandoPagamento] = useState(false);

  useEffect(() => {
    async function gerarPix() {
      try {
        const pedidoPix = sessionStorage.getItem('pedidoPix');

        let cart: any[] = [];
        let entrega: any = {};
        let subtotal = 0;
        let taxa = 0;
        let total = 0;

        if (pedidoPix) {
          const dados = JSON.parse(pedidoPix);

          cart = dados.cart || [];
          entrega = dados.entrega || {};
          subtotal = Number(dados.subtotal || 0);
          taxa = Number(dados.taxaEntrega || 0);
          total = Number(dados.total || 0);
        } else {
          cart = JSON.parse(localStorage.getItem('cart') || '[]');

          entrega = JSON.parse(localStorage.getItem('entrega') || '{}');

          if (!cart.length) {
            throw new Error('Carrinho vazio.');
          }

          subtotal = cart.reduce(
            (acc: number, item: any) => acc + Number(item.price) * Number(item.quantity || 1),
            0
          );

          taxa = Number(entrega?.taxaEntrega || 0);

          total = subtotal + taxa;
        }

        if (!cart.length) {
          throw new Error('Carrinho vazio.');
        }

        setValor(total);

        const response = await fetch('/api/pix', {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            valor: total,

            carrinho: cart,

            entrega,

            subtotal,

            taxaEntrega: taxa,

            descricao: 'Pedido Marmitaria Rei do Suco',
          }),
        });

        const data = await response.json();

        console.log('Resposta PIX:', data);

        if (!response.ok) {
          throw new Error(data.error || 'Erro ao gerar PIX');
        }

        setPaymentId(String(data.id));

        setStatusPagamento(data.status || 'pending');

        setQrCode(data.qr_code_base64 || '');

        setCopiaCola(data.qr_code || '');

        sessionStorage.setItem('pixPaymentId', String(data.id));
      } catch (error: any) {
        console.error(error);

        setErro(error.message || 'Erro ao gerar PIX');
      } finally {
        setLoading(false);
      }
    }

    gerarPix();
  }, []);

  useEffect(() => {
    if (!paymentId) {
      return;
    }

    if (
      statusPagamento === 'approved' ||
      statusPagamento === 'rejected' ||
      statusPagamento === 'cancelled'
    ) {
      return;
    }

    const intervalo = setInterval(async () => {
      try {
        setVerificandoPagamento(true);

        const response = await fetch(`/api/pix/status?id=${paymentId}`, {
          method: 'GET',
          cache: 'no-store',
        });

        const data = await response.json();

        console.log('Status PIX:', data);

        if (!response.ok) {
          return;
        }

        setStatusPagamento(data.status);

        if (data.status === 'approved') {
          clearInterval(intervalo);

          localStorage.removeItem('cart');

          localStorage.removeItem('entrega');

          sessionStorage.removeItem('pixPaymentId');

          sessionStorage.removeItem('pedidoPix');
        }
      } catch (error) {
        console.error('Erro ao verificar PIX:', error);
      } finally {
        setVerificandoPagamento(false);
      }
    }, 5000);

    return () => clearInterval(intervalo);
  }, [paymentId, statusPagamento]);

  function copiarPix() {
    if (!copiaCola) {
      return;
    }

    navigator.clipboard.writeText(copiaCola);

    alert('Código PIX copiado!');
  }

  function voltarInicio() {
    router.push('/');
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
          <p className="text-xl font-semibold">Gerando PIX...</p>
        </div>
      </main>
    );
  }

  if (erro) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
          <p className="mb-6 text-center font-semibold text-red-600">{erro}</p>

          <button
            onClick={voltarInicio}
            className="w-full rounded bg-gray-700 py-3 text-white hover:bg-gray-800"
          >
            ← Voltar para o início
          </button>
        </div>
      </main>
    );
  }

  if (statusPagamento === 'approved') {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
          <div className="mb-5 text-6xl">✅</div>

          <h1 className="mb-3 text-2xl font-bold text-green-600">Pagamento confirmado!</h1>

          <p className="mb-6 text-gray-600">Seu pedido foi recebido e já está sendo processado.</p>

          <p className="mb-6 text-xl font-bold">R$ {valor.toFixed(2)}</p>

          <button
            onClick={voltarInicio}
            className="w-full rounded-lg bg-gray-800 py-3 font-semibold text-white hover:bg-gray-900"
          >
            Voltar para o início
          </button>
        </div>
      </main>
    );
  }

  if (statusPagamento === 'rejected' || statusPagamento === 'cancelled') {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
          <div className="mb-5 text-6xl">❌</div>

          <h1 className="mb-3 text-2xl font-bold text-red-600">Pagamento não aprovado</h1>

          <p className="mb-6 text-gray-600">O pagamento não foi confirmado pelo Mercado Pago.</p>

          <button
            onClick={voltarInicio}
            className="w-full rounded-lg bg-gray-800 py-3 font-semibold text-white hover:bg-gray-900"
          >
            Voltar para o início
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <h1 className="mb-4 text-center text-2xl font-bold">Pagamento via PIX</h1>

        <p className="mb-5 text-center text-xl font-bold">R$ {valor.toFixed(2)}</p>

        <div className="mb-6 rounded-lg bg-yellow-50 p-4 text-center">
          <p className="font-semibold text-yellow-700">⏳ Aguardando pagamento</p>

          <p className="mt-1 text-sm text-yellow-600">
            Após o pagamento, confirmaremos automaticamente.
          </p>
        </div>

        {qrCode && (
          <img src={`data:image/png;base64,${qrCode}`} alt="QR Code Pix" className="mx-auto w-72" />
        )}

        {copiaCola && (
          <>
            <textarea
              readOnly
              value={copiaCola}
              className="mt-6 h-40 w-full resize-none rounded border p-3 text-sm"
            />

            <button
              onClick={copiarPix}
              className="mt-5 w-full rounded bg-green-600 py-3 font-semibold text-white hover:bg-green-700"
            >
              Copiar PIX
            </button>
          </>
        )}

        {verificandoPagamento && (
          <p className="mt-4 text-center text-sm text-gray-500">Verificando pagamento...</p>
        )}

        <button
          onClick={voltarInicio}
          className="mt-4 w-full rounded border border-gray-300 bg-gray-100 py-3 font-semibold text-gray-700 hover:bg-gray-200"
        >
          ← Voltar para o início
        </button>
      </div>
    </main>
  );
}
