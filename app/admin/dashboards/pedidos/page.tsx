'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/app/lib/firebase';

interface Pedido {
  id: string;
  cart: any[];
  entrega?: {
    tipo?: string;
    nome?: string;
    rua?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    referencia?: string;
  };
  subtotal?: number;
  taxaEntrega?: number;
  total?: number;
  tipoPagamento?: string;
  troco?: number | string | null;
  status?: 'Processando' | 'Pronto' | 'Cancelado';
  pagamentoId?: string;
  pagamentoStatus?: string;
  pagamentoStatusDetail?: string;
  externalReference?: string;
  criadoEm?: any;
  pagoEm?: any;
}

type StatusPedido = 'Processando' | 'Pronto' | 'Cancelado';

export default function PedidosPage() {
  const router = useRouter();

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [autorizado, setAutorizado] = useState(false);
  const [erro, setErro] = useState('');
  const [filtro, setFiltro] = useState<StatusPedido>('Processando');
  const [pedidoSelecionado, setPedidoSelecionado] = useState<Pedido | null>(null);
  const [somAtivado, setSomAtivado] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);

  function ativarSom() {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;

      if (!AudioContextClass) {
        alert('Seu navegador não suporta áudio.');
        return;
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass();
      }

      const contexto = audioContextRef.current;

      if (!contexto) {
        return;
      }

      if (contexto.state === 'suspended') {
        contexto.resume();
      }

      setSomAtivado(true);

      const oscillator = contexto.createOscillator();
      const gain = contexto.createGain();

      oscillator.connect(gain);
      gain.connect(contexto.destination);

      oscillator.type = 'triangle';

      const agora = contexto.currentTime;

      oscillator.frequency.setValueAtTime(750, agora);

      gain.gain.setValueAtTime(0.0001, agora);

      gain.gain.exponentialRampToValueAtTime(1.5, agora + 0.05);

      gain.gain.exponentialRampToValueAtTime(0.8, agora + 0.8);

      gain.gain.exponentialRampToValueAtTime(0.0001, agora + 2.5);

      oscillator.start(agora);

      oscillator.stop(agora + 2.5);
    } catch (error) {
      console.error('Erro ao ativar som:', error);
    }
  }

  function tocarSomNovoPedido() {
    if (!somAtivado) {
      return;
    }

    try {
      if (!audioContextRef.current) {
        return;
      }

      const contexto = audioContextRef.current;

      if (!contexto) {
        return;
      }

      if (contexto.state === 'suspended') {
        contexto.resume();
      }

      const agora = contexto.currentTime;

      const tocarNota = (frequencia: number, inicio: number, duracao: number, volume: number) => {
        const inicioNota = agora + inicio;
        const fimNota = inicioNota + duracao;

        const oscillator = contexto.createOscillator();

        const gain = contexto.createGain();

        oscillator.connect(gain);
        gain.connect(contexto.destination);

        oscillator.type = 'triangle';

        oscillator.frequency.setValueAtTime(frequencia, inicioNota);

        gain.gain.setValueAtTime(0.0001, inicioNota);

        gain.gain.exponentialRampToValueAtTime(volume, inicioNota + 0.05);

        gain.gain.exponentialRampToValueAtTime(
          Math.max(volume * 0.7, 0.0001),
          inicioNota + duracao * 0.5
        );

        gain.gain.exponentialRampToValueAtTime(0.0001, fimNota);

        oscillator.start(inicioNota);

        oscillator.stop(fimNota + 0.1);
      };

      tocarNota(1047, 0, 2.0, 2.5);

      // 🔔 DONG
      tocarNota(784, 0.55, 2.3, 2.5);

      // 🔔 DING
      tocarNota(1047, 1.3, 2.0, 2.3);

      // 🔔 DONG
      tocarNota(659, 1.9, 2.2, 2.3);
    } catch (error) {
      console.error('Erro ao tocar som:', error);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      if (user.email !== 'admin@gmail.com') {
        setErro('Você não possui permissão para acessar os pedidos.');
        setAutorizado(false);
        setCarregando(false);
        return;
      }

      setAutorizado(true);
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!autorizado) {
      return;
    }

    const pedidosRef = collection(db, 'pedidos');

    const pedidosQuery = query(pedidosRef, orderBy('criadoEm', 'desc'));

    const pedidosConhecidos = new Set<string>();

    let primeiraCarga = true;

    const unsubscribe = onSnapshot(
      pedidosQuery,
      (snapshot) => {
        const lista: Pedido[] = snapshot.docs.map((pedido) => ({
          id: pedido.id,
          ...pedido.data(),
        })) as Pedido[];

        if (primeiraCarga) {
          snapshot.docs.forEach((pedido) => {
            pedidosConhecidos.add(pedido.id);
          });

          primeiraCarga = false;
        } else {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added' && !pedidosConhecidos.has(change.doc.id)) {
              pedidosConhecidos.add(change.doc.id);

              tocarSomNovoPedido();
            }
          });
        }

        setPedidos(lista);
        setCarregando(false);
      },
      (error) => {
        console.error('Erro ao carregar pedidos:', error);

        setErro('Não foi possível carregar os pedidos.');

        setCarregando(false);
      }
    );

    return () => unsubscribe();
  }, [autorizado, somAtivado]);

  async function alterarStatus(pedidoId: string, novoStatus: StatusPedido) {
    try {
      await updateDoc(doc(db, 'pedidos', pedidoId), {
        status: novoStatus,
      });

      setPedidoSelecionado((atual) => {
        if (!atual || atual.id !== pedidoId) {
          return atual;
        }

        return {
          ...atual,
          status: novoStatus,
        };
      });
    } catch (error) {
      console.error('Erro ao alterar status:', error);

      alert('Não foi possível alterar o status do pedido.');
    }
  }

  function formatarData(timestamp: any) {
    if (!timestamp) {
      return 'Data não disponível';
    }

    try {
      const data = timestamp.toDate();

      return data.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Data não disponível';
    }
  }

  function formatarValor(valor: any) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function escaparHtml(valor: any) {
    return String(valor ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function imprimirNotinha(pedido: Pedido) {
    const janela = window.open('', '_blank', 'width=400,height=700');

    if (!janela) {
      alert('O navegador bloqueou a janela de impressão. Permita pop-ups para este site.');

      return;
    }

    const itens = Array.isArray(pedido.cart) ? pedido.cart : [];

    const itensHtml = itens
      .map((item: any, index: number) => {
        const quantidade = Number(item.quantity || 1);

        const nome = item.title || item.nome || 'Produto';

        const preco = Number(item.price || 0) * quantidade;

        let detalhes = '';

        if (Array.isArray(item.misturas) && item.misturas.length > 0) {
          detalhes += `
              <div class="subitem">
                <strong>Misturas:</strong>
                ${item.misturas
                  .map((mistura: any) =>
                    escaparHtml(mistura.nome || mistura.name || mistura.id || 'Mistura')
                  )
                  .join(', ')}
              </div>
            `;
        }

        if (Array.isArray(item.acompanhamentos) && item.acompanhamentos.length > 0) {
          detalhes += `
              <div class="subitem">
                <strong>Acompanhamentos:</strong>
                ${item.acompanhamentos
                  .map((acompanhamento: any) =>
                    escaparHtml(
                      acompanhamento.nome ||
                        acompanhamento.name ||
                        acompanhamento.id ||
                        'Acompanhamento'
                    )
                  )
                  .join(', ')}
              </div>
            `;
        }

        if (item.observacao) {
          detalhes += `
              <div class="subitem">
                <strong>Obs:</strong>
                ${escaparHtml(item.observacao)}
              </div>
            `;
        }

        return `
            <div class="item">
              <div class="item-principal">
                <span>
                  ${quantidade}x
                  ${escaparHtml(nome)}
                </span>

                <span>
                  R$ ${formatarValor(preco)}
                </span>
              </div>

              ${detalhes}
            </div>
          `;
      })
      .join('');

    const entrega = pedido.entrega;

    let entregaHtml = '';

    if (entrega?.tipo === 'Entrega') {
      entregaHtml = `
        <div class="secao">
          <div class="titulo-secao">
            ENTREGA
          </div>

          ${
            entrega.nome
              ? `
                <div>
                  <strong>Cliente:</strong>
                  ${escaparHtml(entrega.nome)}
                </div>
              `
              : ''
          }

          <div>
            ${escaparHtml(entrega.rua)}, ${escaparHtml(entrega.numero)}
          </div>

          ${
            entrega.complemento
              ? `
                <div>
                  ${escaparHtml(entrega.complemento)}
                </div>
              `
              : ''
          }

          <div>
            ${escaparHtml(entrega.bairro)}
          </div>

          ${
            entrega.referencia
              ? `
                <div>
                  <strong>Referência:</strong>
                  ${escaparHtml(entrega.referencia)}
                </div>
              `
              : ''
          }
        </div>
      `;
    } else {
      entregaHtml = `
        <div class="secao">
          <div class="titulo-secao">
            RETIRADA
          </div>

          ${
            entrega?.nome
              ? `
                <div>
                  <strong>Cliente:</strong>
                  ${escaparHtml(entrega.nome)}
                </div>
              `
              : ''
          }
        </div>
      `;
    }

    let trocoHtml = '';

    if (
      pedido.tipoPagamento === 'Dinheiro' &&
      pedido.troco !== null &&
      pedido.troco !== undefined &&
      pedido.troco !== ''
    ) {
      trocoHtml = `
        <div class="linha">
          <span>Troco para:</span>
          <strong>
            R$ ${formatarValor(pedido.troco)}
          </strong>
        </div>
      `;
    }

    const numeroPedido = pedido.id.slice(-6);

    janela.document.write(`
      <!DOCTYPE html>

      <html lang="pt-BR">

      <head>
        <meta charset="UTF-8">

        <title>
          Pedido #${numeroPedido}
        </title>

        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }

          * {
            box-sizing: border-box;
          }

          html,
          body {
            width: 80mm;
            margin: 0;
            padding: 0;
            background: white;
          }

          body {
            font-family:
              Arial,
              Helvetica,
              sans-serif;

            color: #000;

            font-size: 12px;

            line-height: 1.35;

            padding: 4mm;
          }

          .nota {
            width: 100%;
          }

          .centralizado {
            text-align: center;
          }

          .empresa {
            font-size: 20px;
            font-weight: 900;
          }

          .subtitulo {
            font-size: 11px;
            margin-top: 2px;
          }

          .pedido {
            font-size: 17px;
            font-weight: 900;
            margin-top: 8px;
          }

          .data {
            font-size: 10px;
            margin-top: 3px;
          }

          .separador {
            border-top: 1px dashed #000;
            margin: 8px 0;
          }

          .secao {
            margin: 8px 0;
          }

          .titulo-secao {
            font-size: 13px;
            font-weight: 900;
            border-bottom: 1px solid #000;
            padding-bottom: 2px;
            margin-bottom: 5px;
          }

          .item {
            margin-bottom: 8px;
          }

          .item-principal {
            display: flex;
            justify-content: space-between;
            gap: 8px;
            font-weight: 700;
          }

          .item-principal span:first-child {
            flex: 1;
            word-break: break-word;
          }

          .item-principal span:last-child {
            white-space: nowrap;
          }

          .subitem {
            margin-left: 8px;
            margin-top: 2px;
            font-size: 10px;
            word-break: break-word;
          }

          .linha {
            display: flex;
            justify-content: space-between;
            gap: 8px;
            margin: 3px 0;
          }

          .total {
            display: flex;
            justify-content: space-between;
            font-size: 18px;
            font-weight: 900;
            margin-top: 5px;
          }

          .pagamento {
            font-weight: 700;
          }

          .status {
            text-align: center;
            font-size: 11px;
            font-weight: 900;
            margin-top: 8px;
          }

          .rodape {
            text-align: center;
            font-size: 10px;
            margin-top: 12px;
          }
        </style>
      </head>

      <body>
        <div class="nota">

          <div class="centralizado">

            <div class="empresa">
              REI DO SUCO
            </div>

            <div class="subtitulo">
              MARMITARIA
            </div>

            <div class="pedido">
              PEDIDO #${numeroPedido}
            </div>

            <div class="data">
              ${escaparHtml(formatarData(pedido.criadoEm))}
            </div>

          </div>

          <div class="separador"></div>

          <div class="secao">

            <div class="titulo-secao">
              ITENS
            </div>

            ${itensHtml || '<div>Nenhum item</div>'}

          </div>

          <div class="separador"></div>

          ${entregaHtml}

          <div class="separador"></div>

          <div class="secao">

            <div class="titulo-secao">
              PAGAMENTO
            </div>

            <div class="pagamento">
              ${escaparHtml(pedido.tipoPagamento || 'Não informado')}
            </div>

            ${trocoHtml}

          </div>

          <div class="separador"></div>

          <div class="secao">

            <div class="titulo-secao">
              RESUMO
            </div>

            <div class="linha">
              <span>
                Subtotal:
              </span>

              <span>
                R$ ${formatarValor(pedido.subtotal)}
              </span>
            </div>

            <div class="linha">
              <span>
                Taxa de entrega:
              </span>

              <span>
                R$ ${formatarValor(pedido.taxaEntrega)}
              </span>
            </div>

            <div class="separador"></div>

            <div class="total">
              <span>
                TOTAL
              </span>

              <span>
                R$ ${formatarValor(pedido.total)}
              </span>
            </div>

          </div>

          <div class="separador"></div>

          <div class="status">
            ${escaparHtml(pedido.status || 'Processando').toUpperCase()}
          </div>

          <div class="rodape">
            Obrigado pela preferência!
            <br />
            REI DO SUCO
          </div>

        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();

              setTimeout(function() {
                window.close();
              }, 700);

            }, 300);
          };
        </script>

      </body>

      </html>
    `);

    janela.document.close();
  }

  const pedidosFiltrados = pedidos.filter((pedido) => (pedido.status || 'Processando') === filtro);

  const quantidadeProcessando = pedidos.filter(
    (pedido) => (pedido.status || 'Processando') === 'Processando'
  ).length;

  const quantidadeProntos = pedidos.filter((pedido) => pedido.status === 'Pronto').length;

  const quantidadeCancelados = pedidos.filter((pedido) => pedido.status === 'Cancelado').length;

  function statusVisual(status?: StatusPedido) {
    switch (status || 'Processando') {
      case 'Pronto':
        return {
          texto: 'Pronto',
          emoji: '🟢',
          classe: 'bg-green-100 text-green-700',
        };

      case 'Cancelado':
        return {
          texto: 'Cancelado',
          emoji: '🔴',
          classe: 'bg-red-100 text-red-700',
        };

      default:
        return {
          texto: 'Processando',
          emoji: '🟡',
          classe: 'bg-yellow-100 text-yellow-700',
        };
    }
  }

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
        <div className="rounded-xl bg-white p-8 shadow">
          <p className="text-gray-600">Carregando pedidos...</p>
        </div>
      </main>
    );
  }

  if (erro) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
        <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow">
          <div className="mb-4 text-4xl">🔒</div>

          <h1 className="mb-3 text-xl font-bold">Acesso negado</h1>

          <p className="mb-6 text-gray-600">{erro}</p>

          <button
            onClick={() => router.push('/admin/dashboards')}
            className="w-full rounded-lg bg-gray-800 py-3 font-semibold text-white hover:bg-gray-900"
          >
            Voltar para o Dashboards
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Pedidos</h1>

            <p className="mt-1 text-sm text-gray-500">
              Clique em um pedido para visualizar os detalhes.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => {
                if (somAtivado) {
                  setSomAtivado(false);
                  return;
                }

                ativarSom();
              }}
              className={`rounded-lg px-5 py-3 font-semibold text-white transition ${
                somAtivado ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-500 hover:bg-orange-600'
              }`}
            >
              {somAtivado ? '🔊 Som ativado' : '🔇 Ativar som'}
            </button>

            <button
              onClick={() => router.push('/admin/dashboards')}
              className="rounded-lg bg-gray-800 px-5 py-3 font-semibold text-white transition hover:bg-gray-900"
            >
              ← Dashboards
            </button>
          </div>
        </div>

        {!somAtivado && (
          <div className="mb-6 rounded-xl border border-orange-200 bg-orange-50 p-4">
            <p className="text-sm font-semibold text-orange-800">
              🔔 Ative o som para receber um aviso quando chegar um novo pedido.
            </p>
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <button
            onClick={() => setFiltro('Processando')}
            className={`rounded-xl border p-5 text-left shadow-sm transition ${
              filtro === 'Processando'
                ? 'border-yellow-400 bg-yellow-50'
                : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <p className="text-sm font-medium text-gray-500">Processando</p>

            <p className="mt-1 text-3xl font-bold text-yellow-600">{quantidadeProcessando}</p>
          </button>

          <button
            onClick={() => setFiltro('Pronto')}
            className={`rounded-xl border p-5 text-left shadow-sm transition ${
              filtro === 'Pronto'
                ? 'border-green-400 bg-green-50'
                : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <p className="text-sm font-medium text-gray-500">Prontos</p>

            <p className="mt-1 text-3xl font-bold text-green-600">{quantidadeProntos}</p>
          </button>

          <button
            onClick={() => setFiltro('Cancelado')}
            className={`rounded-xl border p-5 text-left shadow-sm transition ${
              filtro === 'Cancelado'
                ? 'border-red-400 bg-red-50'
                : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <p className="text-sm font-medium text-gray-500">Cancelados</p>

            <p className="mt-1 text-3xl font-bold text-red-600">{quantidadeCancelados}</p>
          </button>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{filtro}</h2>

          <span className="rounded-full bg-gray-200 px-3 py-1 text-sm font-medium text-gray-700">
            {pedidosFiltrados.length} {pedidosFiltrados.length === 1 ? 'pedido' : 'pedidos'}
          </span>
        </div>

        {pedidosFiltrados.length === 0 ? (
          <div className="rounded-xl bg-white p-10 text-center shadow-sm">
            <div className="mb-3 text-4xl">📦</div>

            <p className="font-semibold text-gray-700">Nenhum pedido encontrado.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pedidosFiltrados.map((pedido) => {
              const status = statusVisual(pedido.status);

              const quantidadeItens = (pedido.cart || []).reduce(
                (total, item) => total + Number(item.quantity || 1),
                0
              );

              return (
                <button
                  key={pedido.id}
                  onClick={() => setPedidoSelecionado(pedido)}
                  className="group rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-gray-300 hover:shadow-lg"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium uppercase text-gray-400">Pedido</p>

                      <h3 className="text-lg font-bold text-gray-900">#{pedido.id.slice(-6)}</h3>
                    </div>

                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${status.classe}`}>
                      {status.emoji} {status.texto}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between gap-3">
                      <span>Itens</span>

                      <strong className="text-gray-900">{quantidadeItens}</strong>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span>Pagamento</span>

                      <strong className="text-gray-900">
                        {pedido.tipoPagamento || 'Não informado'}
                      </strong>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span>Tipo</span>

                      <strong className="text-gray-900">
                        {pedido.entrega?.tipo || 'Não informado'}
                      </strong>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t pt-4">
                    <span className="text-sm text-gray-500">Total</span>

                    <span className="text-xl font-bold text-gray-900">
                      R$ {Number(pedido.total || 0).toFixed(2)}
                    </span>
                  </div>

                  <p className="mt-3 text-xs text-gray-400">{formatarData(pedido.criadoEm)}</p>

                  <p className="mt-4 text-center text-xs font-semibold text-gray-400 transition group-hover:text-gray-700">
                    Clique para ver detalhes →
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {pedidoSelecionado && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setPedidoSelecionado(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-5">
              <div>
                <p className="text-xs font-medium uppercase text-gray-400">Pedido</p>

                <h2 className="text-2xl font-bold">#{pedidoSelecionado.id.slice(-6)}</h2>
              </div>

              <button
                type="button"
                onClick={() => setPedidoSelecionado(null)}
                className="rounded-full bg-gray-100 px-4 py-2 text-xl text-gray-600 hover:bg-gray-200"
              >
                ×
              </button>
            </div>

            <div className="space-y-6 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-500">Status atual</p>

                  <div className="mt-1">
                    {(() => {
                      const status = statusVisual(pedidoSelecionado.status);

                      return (
                        <span
                          className={`inline-flex rounded-full px-4 py-2 text-sm font-bold ${status.classe}`}
                        >
                          {status.emoji} {status.texto}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm text-gray-500">Data</p>

                  <p className="font-semibold">{formatarData(pedidoSelecionado.criadoEm)}</p>
                </div>
              </div>

              <section>
                <h3 className="mb-3 text-lg font-bold">🛒 Itens do pedido</h3>

                <div className="space-y-3">
                  {(pedidoSelecionado.cart || []).map((item: any, index: number) => (
                    <div key={item.id || index} className="rounded-xl border bg-gray-50 p-4">
                      <div className="flex justify-between gap-4">
                        <div>
                          <p className="font-bold">
                            {item.quantity || 1} x {item.title || item.nome || 'Produto'}
                          </p>

                          {item.description && (
                            <p className="mt-1 text-sm text-gray-500">{item.description}</p>
                          )}
                        </div>

                        <p className="whitespace-nowrap font-bold">
                          R$ {(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)}
                        </p>
                      </div>

                      {Array.isArray(item.misturas) && item.misturas.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-semibold">Misturas</p>

                          <ul className="mt-1 text-sm text-gray-600">
                            {item.misturas.map((mistura: any, i: number) => (
                              <li key={mistura.id || i}>
                                • {mistura.nome || mistura.name || mistura.id}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {Array.isArray(item.acompanhamentos) && item.acompanhamentos.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-semibold">Acompanhamentos</p>

                          <ul className="mt-1 text-sm text-gray-600">
                            {item.acompanhamentos.map((acompanhamento: any, i: number) => (
                              <li key={acompanhamento.id || i}>
                                • {acompanhamento.nome || acompanhamento.name || acompanhamento.id}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {item.observacao && (
                        <div className="mt-3 rounded-lg bg-white p-3 text-sm text-gray-700">
                          <strong>Observação:</strong> {item.observacao}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-lg font-bold">💳 Pagamento</h3>

                <div className="rounded-xl bg-gray-50 p-4">
                  <div className="flex justify-between">
                    <span>Forma de pagamento</span>

                    <strong>{pedidoSelecionado.tipoPagamento || 'Não informado'}</strong>
                  </div>

                  {pedidoSelecionado.tipoPagamento === 'Dinheiro' && pedidoSelecionado.troco && (
                    <div className="mt-2 flex justify-between text-sm">
                      <span>Troco para</span>

                      <strong>R$ {Number(pedidoSelecionado.troco).toFixed(2)}</strong>
                    </div>
                  )}

                  {pedidoSelecionado.tipoPagamento === 'PIX' && (
                    <p className="mt-2 font-semibold text-green-600">✓ Pagamento confirmado</p>
                  )}
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-lg font-bold">📍 Entrega</h3>

                <div className="rounded-xl bg-gray-50 p-4 text-sm">
                  <p className="font-bold">{pedidoSelecionado.entrega?.tipo || 'Não informado'}</p>

                  {pedidoSelecionado.entrega?.tipo === 'Entrega' && (
                    <div className="mt-2 space-y-1 text-gray-600">
                      {pedidoSelecionado.entrega.nome && (
                        <p>
                          <strong>Cliente:</strong> {pedidoSelecionado.entrega.nome}
                        </p>
                      )}

                      <p>
                        {pedidoSelecionado.entrega.rua}, {pedidoSelecionado.entrega.numero}
                      </p>

                      {pedidoSelecionado.entrega.complemento && (
                        <p>{pedidoSelecionado.entrega.complemento}</p>
                      )}

                      <p>{pedidoSelecionado.entrega.bairro}</p>

                      {pedidoSelecionado.entrega.referencia && (
                        <p>
                          <strong>Referência:</strong> {pedidoSelecionado.entrega.referencia}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-lg font-bold">💰 Resumo</h3>

                <div className="rounded-xl bg-gray-50 p-4">
                  <div className="flex justify-between py-1 text-sm">
                    <span>Subtotal</span>

                    <span>R$ {Number(pedidoSelecionado.subtotal || 0).toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between py-1 text-sm">
                    <span>Taxa de entrega</span>

                    <span>R$ {Number(pedidoSelecionado.taxaEntrega || 0).toFixed(2)}</span>
                  </div>

                  <div className="my-2 border-t" />

                  <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>

                    <span>R$ {Number(pedidoSelecionado.total || 0).toFixed(2)}</span>
                  </div>
                </div>
              </section>

              <section className="border-t pt-5">
                <h3 className="mb-3 text-lg font-bold">🖨️ Imprimir pedido</h3>

                <button
                  type="button"
                  onClick={() => imprimirNotinha(pedidoSelecionado)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-4 text-lg font-bold text-white shadow-md transition hover:bg-blue-700 active:scale-[0.98]"
                >
                  🖨️ Imprimir notinha
                </button>

                <p className="mt-2 text-center text-xs text-gray-500">
                  Papel térmico de 80 mm
                  <br />
                  Tanca TP-650
                </p>
              </section>

              <section className="border-t pt-5">
                <h3 className="mb-3 text-lg font-bold">Alterar status</h3>

                <div className="grid gap-3 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => alterarStatus(pedidoSelecionado.id, 'Processando')}
                    className="rounded-lg bg-yellow-500 px-4 py-3 font-semibold text-white hover:bg-yellow-600"
                  >
                    🟡 Processando
                  </button>

                  <button
                    type="button"
                    onClick={() => alterarStatus(pedidoSelecionado.id, 'Pronto')}
                    className="rounded-lg bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700"
                  >
                    🟢 Pronto
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const confirmar = window.confirm(
                        'Tem certeza que deseja cancelar este pedido?'
                      );

                      if (confirmar) {
                        alterarStatus(pedidoSelecionado.id, 'Cancelado');
                      }
                    }}
                    className="rounded-lg bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700"
                  >
                    🔴 Cancelar
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
