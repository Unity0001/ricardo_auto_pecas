'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

import { db } from '../../lib/firebase';

interface Produto {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  category: string;
  price: number;
  maxMisturas: number;
  maxAcompanhamentos: number;
}

interface Mistura {
  id: string;
  nome: string;
  tipo?: string;
  acrescimo: number;
}

interface Acompanhamento {
  id: string;
  nome: string;
}

export default function MontarMarmita() {
  const router = useRouter();
  const { id } = useParams();

  const [marmita, setMarmita] = useState<Produto | null>(null);

  const [misturas, setMisturas] = useState<Mistura[]>([]);
  const [acompanhamentos, setAcompanhamentos] = useState<Acompanhamento[]>([]);

  const [misturasSelecionadas, setMisturasSelecionadas] = useState<Mistura[]>([]);
  const [acompanhamentosSelecionados, setAcompanhamentosSelecionados] = useState<Acompanhamento[]>(
    []
  );

  const [observacao, setObservacao] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (id) {
      carregarDados();
    }
  }, [id]);

  async function carregarDados() {
    const docRef = doc(db, 'products', id as string);

    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const produto: Produto = {
        id: docSnap.id,
        ...(docSnap.data() as Omit<Produto, 'id'>),
      };

      setMarmita(produto);
      setTotal(Number(produto.price));
    }

    const misturasSnapshot = await getDocs(collection(db, 'misturas'));

    const listaMisturas: Mistura[] = [];

    misturasSnapshot.forEach((item) => {
      const data = item.data();

      if (data.ativo !== true) return;

      listaMisturas.push({
        id: item.id,
        ...(data as Omit<Mistura, 'id'>),
      });
    });

    setMisturas(listaMisturas);

    const acompanhamentosSnapshot = await getDocs(collection(db, 'acompanhamentos'));

    const listaAcompanhamentos: Acompanhamento[] = [];

    acompanhamentosSnapshot.forEach((item) => {
      const data = item.data();

      if (data.ativo !== true) return;

      listaAcompanhamentos.push({
        id: item.id,
        ...(data as Omit<Acompanhamento, 'id'>),
      });
    });

    setAcompanhamentos(listaAcompanhamentos);
  }

  useEffect(() => {
    if (!marmita) return;

    let valor = Number(marmita.price);

    misturasSelecionadas.forEach((mistura) => {
      valor += Number(mistura.acrescimo || 0);
    });

    const carnesBovinas = misturasSelecionadas.filter((mistura) => mistura.tipo === 'bovina');

    if (carnesBovinas.length >= 2) {
      valor += 5;
    }

    setTotal(valor);
  }, [misturasSelecionadas, marmita]);

  function selecionarMistura(item: Mistura) {
    if (misturasSelecionadas.length >= marmita!.maxMisturas) {
      return;
    }

    setMisturasSelecionadas([...misturasSelecionadas, item]);
  }

  function removerMistura(item: Mistura) {
    const index = misturasSelecionadas.findIndex((m) => m.id === item.id);

    if (index === -1) return;

    const novaLista = [...misturasSelecionadas];

    novaLista.splice(index, 1);

    setMisturasSelecionadas(novaLista);
  }

  function adicionarMistura(item: Mistura) {
    if (misturasSelecionadas.length >= marmita!.maxMisturas) {
      return;
    }

    setMisturasSelecionadas([...misturasSelecionadas, item]);
  }

  function selecionarAcompanhamento(item: Acompanhamento) {
    const existe = acompanhamentosSelecionados.find((a) => a.id === item.id);

    if (existe) {
      setAcompanhamentosSelecionados(acompanhamentosSelecionados.filter((a) => a.id !== item.id));

      return;
    }

    if (acompanhamentosSelecionados.length >= marmita!.maxAcompanhamentos) {
      return;
    }

    setAcompanhamentosSelecionados([...acompanhamentosSelecionados, item]);
  }

  async function adicionarAoCarrinho() {
    if (misturasSelecionadas.length !== marmita!.maxMisturas) {
      alert(`Selecione ${marmita!.maxMisturas} mistura(s).`);
      return;
    }

    if (acompanhamentosSelecionados.length !== marmita!.maxAcompanhamentos) {
      alert(`Selecione ${marmita!.maxAcompanhamentos} acompanhamento(s).`);
      return;
    }

    const pedido = {
      id: Date.now().toString(),

      marmitaId: marmita!.id,

      title: marmita!.title,

      subtitle: marmita!.subtitle,

      image: marmita!.image,

      price: total,

      quantity: 1,

      observacao,

      misturas: misturasSelecionadas.map((m) => ({
        nome: m.nome,
        tipo: m.tipo,
        acrescimo: m.acrescimo,
      })),

      acompanhamentos: acompanhamentosSelecionados.map((a) => ({
        nome: a.nome,
      })),
    };

    const carrinho = JSON.parse(localStorage.getItem('cart') || '[]');

    carrinho.push(pedido);

    localStorage.setItem('cart', JSON.stringify(carrinho));

    router.push('/carrinho');
  }

  if (!marmita) {
    return (
      <div className="flex min-h-screen items-center justify-center text-2xl font-bold">
        Carregando...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <button
          onClick={() => router.back()}
          className="mb-6 rounded-lg bg-gray-700 px-5 py-3 text-white hover:bg-gray-800"
        >
          ← Voltar
        </button>

        <div className="rounded-xl bg-white p-6 shadow">
          <img
            src={marmita.image}
            alt={marmita.title}
            className="mb-6 h-64 w-full rounded-lg object-cover"
          />

          <h1 className="text-4xl font-bold">{marmita.title}</h1>

          <p className="mt-2 text-gray-600">{marmita.subtitle}</p>

          <p className="mt-4 text-lg">{marmita.description}</p>

          <p className="mt-4 text-3xl font-bold text-green-700">R$ {total.toFixed(2)}</p>
        </div>

        <div className="mt-10 rounded-xl bg-white p-6 shadow">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-3xl font-bold">Escolha {marmita.maxMisturas} Mistura(s)</h2>

            <span className="rounded bg-green-600 px-3 py-1 text-white">
              {misturasSelecionadas.length}/{marmita.maxMisturas}
            </span>
          </div>

          {misturas.map((mistura) => {
            const quantidade = misturasSelecionadas.filter((m) => m.id === mistura.id).length;

            return (
              <div
                key={mistura.id}
                className="
                  flex
                  h-[140px]
                  flex-col
                  rounded-lg
                  border
                  p-4
                  transition
                  hover:bg-gray-100
                "
              >
                <p className="text-lg font-bold">{mistura.nome}</p>

                <div className="mt-1 h-5">
                  {mistura.acrescimo > 0 && (
                    <p className="text-sm text-green-600">
                      + R$ {Number(mistura.acrescimo).toFixed(2)}
                    </p>
                  )}
                </div>

                <div className="mt-auto flex items-center gap-5">
                  <button
                    onClick={() => removerMistura(mistura)}
                    disabled={quantidade === 0}
                    className={`
                      h-10
                      w-10
                      rounded-lg
                      bg-red-600
                      font-bold
                      text-white
                      transition
                      ${quantidade === 0 ? 'cursor-not-allowed opacity-30' : 'hover:bg-red-700'}
                    `}
                  >
                    -
                  </button>

                  <span className="min-w-[35px] text-center text-xl font-bold">{quantidade}x</span>

                  <button
                    onClick={() => adicionarMistura(mistura)}
                    disabled={misturasSelecionadas.length >= marmita.maxMisturas}
                    className={`
                      h-10
                      w-10
                      rounded-lg
                      bg-green-600
                      font-bold
                      text-white
                      transition
                      ${
                        misturasSelecionadas.length >= marmita.maxMisturas
                          ? 'cursor-not-allowed opacity-30'
                          : 'hover:bg-green-700'
                      }
                    `}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}

          {misturasSelecionadas.filter((m) => m.tipo === 'bovina').length >= 2 && (
            <div className="mt-5 rounded-lg bg-yellow-100 p-4 text-yellow-800">
              ⚠ Foi aplicado adicional de R$ 5,00 por selecionar duas carnes bovinas.
            </div>
          )}
        </div>

        <div className="mt-10 rounded-xl bg-white p-6 shadow">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-3xl font-bold">
              Escolha {marmita.maxAcompanhamentos} Acompanhamento(s)
            </h2>

            <span className="rounded bg-blue-600 px-3 py-1 text-white">
              {acompanhamentosSelecionados.length}/{marmita.maxAcompanhamentos}
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {acompanhamentos.map((acompanhamento) => {
              const selecionado = acompanhamentosSelecionados.some(
                (a) => a.id === acompanhamento.id
              );

              return (
                <button
                  key={acompanhamento.id}
                  onClick={() => selecionarAcompanhamento(acompanhamento)}
                  className={`rounded-lg border p-4 text-left transition ${
                    selecionado ? 'border-green-600 bg-green-100' : 'hover:bg-gray-100'
                  }`}
                >
                  {acompanhamento.nome}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-10 rounded-xl bg-white p-6 shadow">
          <h2 className="mb-6 text-3xl font-bold">Resumo do Pedido</h2>

          <div>
            <h3 className="mb-2 font-bold">Misturas</h3>

            {misturasSelecionadas.length === 0 ? (
              <p className="text-gray-500">Nenhuma selecionada.</p>
            ) : (
              <ul className="list-disc pl-5">
                {Object.values(
                  misturasSelecionadas.reduce((acc: any, m) => {
                    if (!acc[m.id]) {
                      acc[m.id] = {
                        ...m,
                        quantidade: 1,
                      };
                    } else {
                      acc[m.id].quantidade++;
                    }

                    return acc;
                  }, {})
                ).map((m: any) => (
                  <li key={m.id}>
                    {m.nome} x{m.quantidade}
                    {m.acrescimo > 0 && ` (+R$ ${Number(m.acrescimo).toFixed(2)})`}
                    <button onClick={() => removerMistura(m)} className="ml-3 text-red-600">
                      remover
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <h3 className="mb-2 mt-6 font-bold">Acompanhamentos</h3>

            {acompanhamentosSelecionados.length === 0 ? (
              <p className="text-gray-500">Nenhum selecionado.</p>
            ) : (
              <ul className="list-disc pl-5">
                {acompanhamentosSelecionados.map((a) => (
                  <li key={a.id}>{a.nome}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <button
          onClick={adicionarAoCarrinho}
          className="
            rounded-lg
            bg-green-600
            px-5
            py-3
            font-semibold
            text-white
            shadow
            transition
            hover:bg-green-700
          "
        >
          Finalizar compra
        </button>
      </div>
    </main>
  );
}
