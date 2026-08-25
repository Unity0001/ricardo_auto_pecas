'use client';

import { useEffect, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

import { db } from '../lib/firebase';

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

  const [pedidoCriado, setPedidoCriado] = useState(false);

  // Impede criar o mesmo pedido mais de uma vez
  const criandoPedidoRef = useRef(false);

  /*
   * =========================================================
   * GERAR PEDIDO APÓS PIX APROVADO
   * =========================================================
   */
  async function criarPedidoAposPagamento() {
    if (criandoPedidoRef.current) {
      return;
    }

    if (pedidoCriado) {
      return;
    }

    try {
      criandoPedidoRef.current = true;

      const pedidoPix = sessionStorage.getItem('pedidoPix');

      if (!pedidoPix) {
        throw new Error('Dados do pedido PIX não encontrados.');
      }

      const dados = JSON.parse(pedidoPix);

      const cart = Array.isArray(dados.cart) ? dados.cart : [];

      const entrega = dados.entrega || {};

      const subtotal = Number(dados.subtotal || 0);

      const taxaEntrega = Number(dados.taxaEntrega || 0);

      const total = Number(dados.total || 0);

      if (!cart.length) {
        throw new Error('O carrinho está vazio.');
      }

      if (total <= 0) {
        throw new Error('Valor do pedido inválido.');
      }

      /*
       * Verifica se este pagamento já gerou um pedido.
       */
      const chaveProcessamento = `pedido_pix_processado_${paymentId}`;

      const pedidoJaProcessado = sessionStorage.getItem(chaveProcessamento);

      if (pedidoJaProcessado === 'true') {
        setPedidoCriado(true);
        return;
      }

      /*
       * Cria o pedido exatamente como seu
       * PagamentoPage faz para cartão/dinheiro.
       */
      const pedidoRef = await addDoc(collection(db, 'pedidos'), {
        cart,

        entrega,

        subtotal,

        taxaEntrega,

        total,

        tipoPagamento: 'PIX',

        troco: null,

        status: 'Processando',

        pagamentoId: paymentId,

        pagamentoStatus: 'approved',

        criadoEm: serverTimestamp(),

        pagoEm: serverTimestamp(),
      });

      console.log('Pedido PIX criado:', pedidoRef.id);

      /*
       * Marca este pagamento como processado
       * nesta sessão para evitar duplicidade.
       */
      sessionStorage.setItem(chaveProcessamento, 'true');

      sessionStorage.setItem('ultimoPedidoId', pedidoRef.id);

      setPedidoCriado(true);

      /*
       * Agora que o pedido foi gravado,
       * podemos limpar os dados.
       */
      localStorage.removeItem('cart');

      localStorage.removeItem('entrega');

      sessionStorage.removeItem('pedidoPix');

      sessionStorage.removeItem('pixPaymentId');

      console.log('Pedido enviado para a coleção pedidos.');
    } catch (error) {
      console.error('Erro ao criar pedido PIX:', error);

      /*
       * Permite uma nova tentativa caso tenha
       * ocorrido erro na gravação.
       */
      setErro(
        'O pagamento foi aprovado, mas não foi possível registrar o pedido. Tente novamente.'
      );
    } finally {
      criandoPedidoRef.current = false;
    }
  }

  /*
   * =========================================================
   * GERAR PIX
   * =========================================================
   */
  useEffect(() => {
    let desmontado = false;

    async function gerarPix() {
      try {
        const pedidoPix = sessionStorage.getItem('pedidoPix');

        let cart: any[] = [];
        let entrega: any = {};
        let subtotal = 0;
        let taxa = 0;
        let total = 0;

        /*
         * Primeiro tenta os dados salvos pela
         * PagamentoPage.
         */
        if (pedidoPix) {
          const dados = JSON.parse(pedidoPix);

          cart = Array.isArray(dados.cart) ? dados.cart : [];

          entrega = dados.entrega || {};

          subtotal = Number(dados.subtotal || 0);

          taxa = Number(dados.taxaEntrega || 0);

          total = Number(dados.total || 0);
        } else {
          /*
           * Fallback para localStorage.
           */
          cart = JSON.parse(localStorage.getItem('cart') || '[]');

          entrega = JSON.parse(localStorage.getItem('entrega') || '{}');

          if (!cart.length) {
            throw new Error('Carrinho vazio.');
          }

          subtotal = cart.reduce(
            (acc: number, item: any) => acc + Number(item.price || 0) * Number(item.quantity || 1),
            0
          );

          taxa = Number(entrega?.taxaEntrega || 0);

          total = subtotal + taxa;
        }

        if (!cart.length) {
          throw new Error('Carrinho vazio.');
        }

        if (!total || total <= 0) {
          throw new Error('Valor do pedido inválido.');
        }

        if (desmontado) {
          return;
        }

        setValor(total);

        /*
         * Verifica se já existe um PIX sendo acompanhado.
         */
        const paymentIdSalvo = sessionStorage.getItem('pixPaymentId');

        if (paymentIdSalvo) {
          setPaymentId(paymentIdSalvo);

          setLoading(false);

          return;
        }

        /*
         * Gera novo PIX.
         */
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

        let data: any;

        try {
          data = await response.json();
        } catch {
          throw new Error('O servidor não retornou uma resposta válida.');
        }

        console.log('Resposta PIX:', data);

        if (!response.ok) {
          throw new Error(data?.error || 'Erro ao gerar PIX.');
        }

        if (!data?.id) {
          throw new Error('Mercado Pago não retornou o ID do pagamento.');
        }

        if (!data?.qr_code) {
          throw new Error('O Mercado Pago não retornou o código PIX.');
        }

        if (!data?.qr_code_base64) {
          throw new Error('O Mercado Pago não retornou o QR Code.');
        }

        if (desmontado) {
          return;
        }

        const novoPaymentId = String(data.id);

        setPaymentId(novoPaymentId);

        setStatusPagamento(data.status || 'pending');

        setQrCode(data.qr_code_base64);

        setCopiaCola(data.qr_code);

        sessionStorage.setItem('pixPaymentId', novoPaymentId);
      } catch (error: any) {
        if (desmontado) {
          return;
        }

        console.error('Erro ao gerar PIX:', error);

        setErro(error?.message || 'Erro ao gerar PIX.');
      } finally {
        if (!desmontado) {
          setLoading(false);
        }
      }
    }

    gerarPix();

    return () => {
      desmontado = true;
    };
  }, []);

  /*
   * =========================================================
   * VERIFICAR PAGAMENTO
   * =========================================================
   */
  useEffect(() => {
    if (!paymentId) {
      return;
    }

    if (pedidoCriado) {
      return;
    }

    /*
     * Não precisa continuar verificando
     * caso já esteja recusado/cancelado.
     */
    if (statusPagamento === 'rejected' || statusPagamento === 'cancelled') {
      return;
    }

    let desmontado = false;

    async function verificarPagamento() {
      if (desmontado) {
        return;
      }

      try {
        setVerificandoPagamento(true);

        const response = await fetch(`/api/pix/status?id=${encodeURIComponent(paymentId)}`, {
          method: 'GET',

          cache: 'no-store',
        });

        let data: any;

        try {
          data = await response.json();
        } catch {
          console.error('Resposta inválida da API de status PIX.');

          return;
        }

        console.log('Status PIX:', data);

        if (!response.ok) {
          console.error('Erro ao consultar status:', data);

          return;
        }

        if (desmontado) {
          return;
        }

        const novoStatus = data.status || 'pending';

        setStatusPagamento(novoStatus);

        /*
         * PIX FOI APROVADO
         *
         * Aqui criamos o documento
         * diretamente em Firestore,
         * da mesma maneira que seu
         * PagamentoPage faz.
         */
        if (novoStatus === 'approved') {
          console.log('PIX APROVADO!');

          await criarPedidoAposPagamento();
        }
      } catch (error) {
        console.error('Erro ao verificar PIX:', error);
      } finally {
        if (!desmontado) {
          setVerificandoPagamento(false);
        }
      }
    }

    /*
     * Verifica imediatamente.
     */
    verificarPagamento();

    /*
     * Continua verificando a cada 5 segundos.
     */
    const intervalo = setInterval(verificarPagamento, 5000);

    return () => {
      desmontado = true;

      clearInterval(intervalo);
    };
  }, [paymentId, statusPagamento, pedidoCriado]);

  /*
   * =========================================================
   * COPIAR PIX
   * =========================================================
   */
  async function copiarPix() {
    if (!copiaCola) {
      return;
    }

    try {
      await navigator.clipboard.writeText(copiaCola);

      alert('Código PIX copiado!');
    } catch (error) {
      console.error('Erro ao copiar PIX:', error);

      alert('Não foi possível copiar o código PIX.');
    }
  }

  /*
   * =========================================================
   * VOLTAR
   * =========================================================
   */
  function voltarInicio() {
    localStorage.removeItem('cart');

    localStorage.removeItem('entrega');

    sessionStorage.removeItem('pixPaymentId');

    sessionStorage.removeItem('pedidoPix');

    router.push('/');
  }

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
          <div className="mb-4 text-5xl">💳</div>

          <p className="text-xl font-semibold">Gerando PIX...</p>

          <p className="mt-2 text-sm text-gray-500">Aguarde enquanto preparamos seu pagamento.</p>
        </div>
      </main>
    );
  }

  /*
   * =========================================================
   * ERRO
   * =========================================================
   */
  if (erro) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
          <div className="mb-5 text-center text-5xl">❌</div>

          <h1 className="mb-3 text-center text-xl font-bold text-red-600">
            Não foi possível processar o PIX
          </h1>

          <p className="mb-6 text-center text-gray-600">{erro}</p>

          <button
            onClick={voltarInicio}
            className="w-full rounded-lg bg-gray-700 py-3 font-semibold text-white hover:bg-gray-800"
          >
            ← Voltar para o início
          </button>
        </div>
      </main>
    );
  }

  /*
   * =========================================================
   * PIX APROVADO
   * =========================================================
   */
  if (statusPagamento === 'approved') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
        <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
          <div className="mb-5 text-6xl">✅</div>

          <h1 className="mb-3 text-2xl font-bold text-green-600">Pagamento confirmado!</h1>

          <p className="mb-2 text-gray-600">Seu pagamento foi aprovado.</p>

          {pedidoCriado ? (
            <p className="mb-6 text-gray-600">Seu pedido foi enviado para a tela de pedidos.</p>
          ) : (
            <p className="mb-6 text-gray-600">Registrando seu pedido...</p>
          )}

          <div className="mb-6 rounded-lg bg-gray-100 p-4">
            <p className="text-sm text-gray-500">Valor pago</p>

            <p className="text-2xl font-bold">R$ {valor.toFixed(2)}</p>
          </div>

          {pedidoCriado && (
            <div className="mb-6 rounded-lg bg-green-50 p-4">
              <p className="font-semibold text-green-700">✓ Pedido registrado</p>
            </div>
          )}

          {!pedidoCriado && (
            <div className="mb-6 rounded-lg bg-yellow-50 p-4">
              <p className="font-semibold text-yellow-700">⏳ Registrando pedido...</p>
            </div>
          )}

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

  /*
   * =========================================================
   * PAGAMENTO RECUSADO/CANCELADO
   * =========================================================
   */
  if (statusPagamento === 'rejected' || statusPagamento === 'cancelled') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
        <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
          <div className="mb-5 text-6xl">❌</div>

          <h1 className="mb-3 text-2xl font-bold text-red-600">Pagamento não aprovado</h1>

          <p className="mb-6 text-gray-600">O pagamento não foi confirmado pelo Mercado Pago.</p>

          <button
            onClick={voltarInicio}
            className="w-full rounded-lg bg-gray-800 py-3 font-semibold text-white hover:bg-gray-900"
          >
            ← Voltar para o início
          </button>
        </div>
      </main>
    );
  }

  /*
   * =========================================================
   * TELA DO PIX
   * =========================================================
   */
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
          <div className="flex justify-center">
            <img src={`data:image/png;base64,${qrCode}`} alt="QR Code Pix" className="h-72 w-72" />
          </div>
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
              className="mt-5 w-full rounded-lg bg-green-600 py-3 font-semibold text-white hover:bg-green-700"
            >
              📋 Copiar PIX
            </button>
          </>
        )}

        {verificandoPagamento && (
          <p className="mt-4 text-center text-sm text-gray-500">Verificando pagamento...</p>
        )}

        <button
          onClick={voltarInicio}
          className="mt-4 w-full rounded-lg border border-gray-300 bg-gray-100 py-3 font-semibold text-gray-700 hover:bg-gray-200"
        >
          ← Voltar para o início
        </button>
      </div>
    </main>
  );
}
