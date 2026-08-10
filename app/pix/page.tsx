'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PixPage() {
  const router = useRouter();

  const [qrCode, setQrCode] = useState('');
  const [copiaCola, setCopiaCola] = useState('');
  const [valor, setValor] = useState(0);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    async function gerarPix() {
      try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');

        const entrega = JSON.parse(localStorage.getItem('entrega') || '{}');

        const subtotal = cart.reduce(
          (acc: number, item: any) => acc + Number(item.price) * Number(item.quantity || 1),
          0
        );

        const taxa = entrega?.tipo === 'Entrega' ? 8 : 0;

        const total = subtotal + taxa;

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

            descricao: 'Pedido Marmitaria Rei do Suco',
          }),
        });

        const data = await response.json();

        console.log('Resposta PIX:', data);

        if (!response.ok) {
          throw new Error(data.error || 'Erro ao gerar PIX');
        }

        setQrCode(data.qr_code_base64 || '');

        setCopiaCola(data.qr_code || '');
      } catch (error: any) {
        console.error(error);

        setErro(error.message || 'Erro ao gerar PIX');
      } finally {
        setLoading(false);
      }
    }

    gerarPix();
  }, []);

  function copiarPix() {
    if (!copiaCola) return;

    navigator.clipboard.writeText(copiaCola);

    alert('Código PIX copiado!');
  }

  function voltarInicio() {
    router.push('/');
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow">
          <p className="text-center">Gerando PIX...</p>

          <button
            onClick={voltarInicio}
            className="
              mt-6
              rounded
              bg-gray-700
              px-6
              py-3
              text-white
              hover:bg-gray-800
            "
          >
            ← Voltar para o início
          </button>
        </div>
      </main>
    );
  }

  if (erro) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow">
          <p className="mb-5 text-center text-red-600">{erro}</p>

          <button
            onClick={voltarInicio}
            className="
              w-full
              rounded
              bg-gray-700
              py-3
              text-white
              hover:bg-gray-800
            "
          >
            ← Voltar para o início
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow">
        <h1 className="mb-5 text-center text-2xl font-bold">Pagamento via PIX</h1>

        <p className="mb-5 text-center text-xl font-bold">R$ {valor.toFixed(2)}</p>

        {qrCode && (
          <img src={`data:image/png;base64,${qrCode}`} alt="QR Code Pix" className="mx-auto w-72" />
        )}

        {copiaCola && (
          <>
            <textarea
              readOnly
              value={copiaCola}
              className="
                mt-6
                h-40
                w-full
                resize-none
                rounded
                border
                p-3
                text-sm
              "
            />

            <button
              onClick={copiarPix}
              className="
                mt-5
                w-full
                rounded
                bg-green-600
                py-3
                font-semibold
                text-white
                hover:bg-green-700
              "
            >
              Copiar PIX
            </button>
          </>
        )}

        <button
          onClick={voltarInicio}
          className="
            mt-4
            w-full
            rounded
            border
            border-gray-300
            bg-gray-100
            py-3
            font-semibold
            text-gray-700
            hover:bg-gray-200
          "
        >
          ← Voltar para o início
        </button>
      </div>
    </main>
  );
}
