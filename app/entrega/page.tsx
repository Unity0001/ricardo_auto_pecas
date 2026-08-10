'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EntregaPage() {
  const router = useRouter();

  const [tipo, setTipo] = useState<'entrega' | 'retirada' | null>(null);

  const [nome, setNome] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [referencia, setReferencia] = useState('');

  function continuarEntrega() {
    if (!nome.trim() || !rua.trim() || !numero.trim() || !bairro.trim()) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }

    localStorage.setItem(
      'entrega',
      JSON.stringify({
        tipo: 'Entrega',
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
        nome,
      })
    );

    router.push('/pagamento');
  }

  return (
    <main className="min-h-screen bg-gray-100 flex justify-center py-10 px-4">
      <div className="w-full max-w-4xl rounded-xl bg-white p-8 shadow-lg">
        <h1 className="mb-8 text-center text-4xl font-bold">Como deseja receber seu pedido?</h1>

        <div className="mb-8">
          <label className="mb-2 block font-semibold">Nome do Comprador *</label>

          <input
            type="text"
            placeholder="Digite seu nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div className="mb-10 flex justify-center gap-6">
          <button
            onClick={() => setTipo('entrega')}
            className={`rounded-lg px-8 py-4 text-lg font-semibold transition ${
              tipo === 'entrega' ? 'bg-green-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            🚚 Entrega
          </button>

          <button
            onClick={() => setTipo('retirada')}
            className={`rounded-lg px-8 py-4 text-lg font-semibold transition ${
              tipo === 'retirada' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            🏪 Retirada
          </button>
        </div>

        {tipo === 'entrega' && (
          <div className="space-y-5">
            <h2 className="text-2xl font-bold">Endereço de Entrega</h2>

            <input
              type="text"
              placeholder="Rua *"
              value={rua}
              onChange={(e) => setRua(e.target.value)}
              className="w-full rounded-lg border p-3"
            />

            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Número *"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                className="rounded-lg border p-3"
              />

              <input
                type="text"
                placeholder="Complemento"
                value={complemento}
                onChange={(e) => setComplemento(e.target.value)}
                className="rounded-lg border p-3"
              />
            </div>

            <input
              type="text"
              placeholder="Bairro *"
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
              className="w-full rounded-lg border p-3"
            />

            <textarea
              rows={3}
              placeholder="Ponto de referência"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              className="w-full rounded-lg border p-3"
            />

            <button
              onClick={continuarEntrega}
              className="w-full rounded-lg bg-green-600 py-4 text-xl font-semibold text-white hover:bg-green-700"
            >
              Continuar para Pagamento
            </button>
          </div>
        )}

        {tipo === 'retirada' && (
          <div className="space-y-6">
            <div className="rounded-lg border p-5">
              <h3 className="mb-2 text-xl font-bold">Endereço da Loja</h3>

              <p>Rod. Washington Luiz, 220</p>
              <p>Vila Monte Negro</p>
              <p>Espírito Santo do Pinhal - SP</p>
            </div>

            <div className="rounded-lg border p-5">
              <h3 className="mb-2 text-xl font-bold">Horário estimado</h3>

              <p>Seu pedido ficará pronto em aproximadamente 40 minutos.</p>
            </div>

            <button
              onClick={continuarRetirada}
              className="w-full rounded-lg bg-blue-600 py-4 text-xl font-semibold text-white hover:bg-blue-700"
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
