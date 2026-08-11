'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { collection, addDoc, getDocs, deleteDoc, updateDoc, doc } from 'firebase/firestore';

import { db } from '../../../lib/firebase';

export default function MisturasPage() {
  const router = useRouter();

  const [misturas, setMisturas] = useState<any[]>([]);

  const [nome, setNome] = useState('');
  const [acrescimo, setAcrescimo] = useState('');

  const [editandoId, setEditandoId] = useState<string | null>(null);

  async function carregarMisturas() {
    const snapshot = await getDocs(collection(db, 'misturas'));

    const lista: any[] = [];

    snapshot.forEach((item) => {
      lista.push({
        id: item.id,
        ...item.data(),
      });
    });

    setMisturas(lista);
  }

  useEffect(() => {
    carregarMisturas();
  }, []);

  async function salvarMistura() {
    if (!nome.trim()) {
      alert('Digite o nome da mistura');
      return;
    }

    if (editandoId) {
      await updateDoc(doc(db, 'misturas', editandoId), {
        nome,
        acrescimo: Number(acrescimo),
      });

      setEditandoId(null);
    } else {
      await addDoc(collection(db, 'misturas'), {
        nome,
        acrescimo: Number(acrescimo),
        ativo: true,
      });
    }

    setNome('');
    setAcrescimo('');

    carregarMisturas();
  }

  function editarMistura(item: any) {
    setEditandoId(item.id);

    setNome(item.nome);

    setAcrescimo(item.acrescimo?.toString() || '0');
  }

  async function alternarAtivo(item: any) {
    await updateDoc(doc(db, 'misturas', item.id), {
      ativo: item.ativo !== true,
    });

    carregarMisturas();
  }

  async function excluirMistura(id: string) {
    if (!confirm('Deseja excluir essa mistura?')) return;

    await deleteDoc(doc(db, 'misturas', id));

    carregarMisturas();
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-bold">🥩 Gerenciar Misturas</h1>

          <button
            onClick={() => router.push('/admin/dashboards')}
            className="
              rounded-lg
              bg-gray-800
              px-5
              py-3
              font-semibold
              text-white
              shadow
              transition
              hover:bg-gray-900
            "
          >
            ← Voltar
          </button>
        </div>

        <div className="mb-8 rounded-xl bg-white p-6 shadow">
          <h2 className="mb-5 text-2xl font-bold">
            {editandoId ? 'Editar Mistura' : 'Nova Mistura'}
          </h2>

          <div className="grid gap-4">
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome da mistura"
              className="
                rounded-lg
                border
                p-3
              "
            />

            <input
              type="number"
              value={acrescimo}
              onChange={(e) => setAcrescimo(e.target.value)}
              placeholder="Acréscimo"
              className="
                rounded-lg
                border
                p-3
              "
            />

            <button
              onClick={salvarMistura}
              className="
                rounded-lg
                bg-green-600
                p-3
                font-bold
                text-white
                transition
                hover:bg-green-700
              "
            >
              {editandoId ? 'Salvar Alteração' : 'Adicionar Mistura'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {misturas.map((item) => (
            <div
              key={item.id}
              className="
                flex
                flex-col
                gap-4
                rounded-xl
                bg-white
                p-5
                shadow
                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold">{item.nome}</h3>

                  <span
                    className={`rounded-full px-3 py-1 text-sm font-bold ${
                      item.ativo === true
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {item.ativo === true ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <p className="text-gray-600">
                  Acréscimo: R$ {Number(item.acrescimo || 0).toFixed(2)}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => alternarAtivo(item)}
                  className={`rounded-lg px-5 py-2 font-semibold text-white transition ${
                    item.ativo === true
                      ? 'bg-orange-500 hover:bg-orange-600'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {item.ativo === true ? '⏸ Inativar' : '▶️ Ativar'}
                </button>

                <button
                  onClick={() => editarMistura(item)}
                  className="
                    rounded-lg
                    bg-yellow-500
                    px-5
                    py-2
                    font-semibold
                    text-white
                    transition
                    hover:bg-yellow-600
                  "
                >
                  Editar
                </button>

                <button
                  onClick={() => excluirMistura(item.id)}
                  className="
                    rounded-lg
                    bg-red-600
                    px-5
                    py-2
                    font-semibold
                    text-white
                    transition
                    hover:bg-red-700
                  "
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
