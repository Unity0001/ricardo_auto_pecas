'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EntregaPage() {
  const router = useRouter();

  const [tipo, setTipo] = useState<'cidade' | 'rodovias' | 'retirada' | null>(null);

  const [nome, setNome] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [referencia, setReferencia] = useState('');

  function continuarEntrega(taxaEntrega: number, tipoEntrega: string) {
    if (!nome.trim() || !rua.trim() || !numero.trim() || !bairro.trim()) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }

    localStorage.setItem(
      'entrega',
      JSON.stringify({
        tipo: 'Entrega',
        tipoEntrega,
        taxaEntrega,
        nome,
        rua,
        numero,
        complemento,
        bairro,
        referencia,
      })
    );

    router.push('/pagamento');
  }

  function continuarRetirada() {
    if (!nome.trim()) {
      alert('Informe o nome do comprador.');
      return;
    }

    localStorage.setItem(
      'entrega',
      JSON.stringify({
        tipo: 'Retirada',
        tipoEntrega: 'Retirada',
        taxaEntrega: 0,
        nome,
      })
    );

    router.push('/pagamento');
  }

  return (
    <main className="flex min-h-screen justify-center bg-gray-100 px-4 py-10">
      <div className="w-full max-w-4xl rounded-xl bg-white p-5 shadow-lg sm:p-8">
        <h1 className="mb-8 text-center text-3xl font-bold sm:text-4xl">
          Como deseja receber seu pedido?
        </h1>

        <div className="mb-8">
          <label className="mb-2 block font-semibold">Nome do Comprador *</label>

          <input
            type="text"
            placeholder="Digite seu nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full rounded-lg border p-3 outline-none focus:border-green-500"
          />
        </div>

        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <button
            onClick={() => setTipo('cidade')}
            className={`rounded-lg px-5 py-4 text-lg font-semibold transition ${
              tipo === 'cidade' ? 'bg-green-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            🚚 Entrega na Cidade
            <span className="mt-1 block text-sm font-normal">R$ 5,00</span>
          </button>

          <button
            onClick={() => setTipo('rodovias')}
            className={`rounded-lg px-5 py-4 text-lg font-semibold transition ${
              tipo === 'rodovias' ? 'bg-orange-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            🛣️ Entrega Rodovias
            <span className="mt-1 block text-sm font-normal">R$ 7,00</span>
          </button>

          <button
            onClick={() => setTipo('retirada')}
            className={`rounded-lg px-5 py-4 text-lg font-semibold transition ${
              tipo === 'retirada' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            🏪 Retirada
            <span className="mt-1 block text-sm font-normal">Grátis</span>
          </button>
        </div>

        {(tipo === 'cidade' || tipo === 'rodovias') && (
          <div className="space-y-5">
            <div className="rounded-lg bg-gray-50 p-4">
              <h2 className="text-2xl font-bold">Endereço de Entrega</h2>

              <p className="mt-1 text-gray-600">
                {tipo === 'cidade'
                  ? 'Entrega dentro da cidade — R$ 5,00'
                  : 'Entrega em rodovias — R$ 7,00'}
              </p>
            </div>

            <input
              type="text"
              placeholder="Rua *"
              value={rua}
              onChange={(e) => setRua(e.target.value)}
              className="w-full rounded-lg border p-3 outline-none focus:border-green-500"
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Número *"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                className="rounded-lg border p-3 outline-none focus:border-green-500"
              />

              <input
                type="text"
                placeholder="Complemento"
                value={complemento}
                onChange={(e) => setComplemento(e.target.value)}
                className="rounded-lg border p-3 outline-none focus:border-green-500"
              />
            </div>

            <input
              type="text"
              placeholder="Bairro *"
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
              className="w-full rounded-lg border p-3 outline-none focus:border-green-500"
            />

            <textarea
              rows={3}
              placeholder="Ponto de referência"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              className="w-full rounded-lg border p-3 outline-none focus:border-green-500"
            />

            <button
              onClick={() =>
                continuarEntrega(
                  tipo === 'cidade' ? 5 : 7,
                  tipo === 'cidade' ? 'Entrega na Cidade' : 'Entrega Rodovias'
                )
              }
              className="w-full rounded-lg bg-green-600 py-4 text-xl font-semibold text-white transition hover:bg-green-700"
            >
              Continuar para Pagamento
            </button>
          </div>
        )}

        {tipo === 'retirada' && (
          <div className="space-y-6">
            <div className="rounded-lg border p-5">
              <h3 className="mb-2 text-xl font-bold">Endereço da Loja</h3>

              <p>AVENIDA JOÃO BERTOLDO, 160 - Parque das Nacoes</p>
              <p>Espírito Santo do Pinhal - SP</p>
            </div>

            <button
              onClick={continuarRetirada}
              className="w-full rounded-lg bg-blue-600 py-4 text-xl font-semibold text-white transition hover:bg-blue-700"
            >
              Continuar para Pagamento
            </button>
          </div>
        )}

        {!tipo && (
          <div className="rounded-lg border border-dashed p-8 text-center text-gray-500">
            Escolha uma opção acima para continuar.
          </div>
        )}
      </div>
    </main>
  );
}
