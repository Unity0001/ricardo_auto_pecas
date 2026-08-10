'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, getDocs, deleteDoc, updateDoc, doc } from 'firebase/firestore';

import { db } from '../../../lib/firebase';

export default function AcompanhamentosPage() {
  const router = useRouter();

  const [acompanhamentos, setAcompanhamentos] = useState<any[]>([]);
  const [nome, setNome] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);

  async function carregarAcompanhamentos() {
    const snapshot = await getDocs(collection(db, 'acompanhamentos'));

    const lista: any[] = [];

    snapshot.forEach((item) => {
      lista.push({
        id: item.id,
        ...item.data(),
      });
    });

    setAcompanhamentos(lista);
  }

  useEffect(() => {
    carregarAcompanhamentos();
  }, []);

  async function salvarAcompanhamento() {
    if (!nome.trim()) {
      alert('Digite o nome do acompanhamento');
      return;
    }

    if (editandoId) {
      await updateDoc(doc(db, 'acompanhamentos', editandoId), {
        nome,
      });

      setEditandoId(null);
    } else {
      await addDoc(collection(db, 'acompanhamentos'), {
        nome,
      });
    }

    setNome('');
    carregarAcompanhamentos();
  }

  function editarAcompanhamento(item: any) {
    setEditandoId(item.id);
    setNome(item.nome);
  }

  async function excluirAcompanhamento(id: string) {
    if (!confirm('Deseja excluir esse acompanhamento?')) return;

    await deleteDoc(doc(db, 'acompanhamentos', id));

    carregarAcompanhamentos();
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="mx-auto w-full max-w-6xl">
        {/* Cabeçalho */}
        <div
          className="
          mb-8
          flex
          flex-col
          gap-4
          sm:flex-row
          sm:items-center
          sm:justify-between
          "
        >
          <h1 className="text-2xl font-bold sm:text-4xl">🥗 Gerenciar Acompanhamentos</h1>

          <button
            onClick={() => router.push('/admin/dashboards')}
            className="
            w-full
            rounded-lg
            bg-gray-800
            px-5
            py-3
            font-semibold
            text-white
            shadow
            transition
            hover:bg-gray-900
            sm:w-auto
            "
          >
            ← Voltar
          </button>
        </div>

        {/* Formulário */}
        <div className="mb-8 rounded-xl bg-white p-4 shadow sm:p-6">
          <h2 className="mb-5 text-xl font-bold sm:text-2xl">
            {editandoId ? 'Editar Acompanhamento' : 'Novo Acompanhamento'}
          </h2>

          <div className="grid gap-4">
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do acompanhamento"
              className="
              w-full
              rounded-lg
              border
              p-3
              outline-none
              focus:border-green-500
              "
            />

            <button
              onClick={salvarAcompanhamento}
              className="
              w-full
              rounded-lg
              bg-green-600
              p-3
              font-bold
              text-white
              transition
              hover:bg-green-700
              "
            >
              {editandoId ? 'Salvar Alteração' : 'Adicionar Acompanhamento'}
            </button>
          </div>
        </div>

        {/* Lista */}
        <div className="space-y-4">
          {acompanhamentos.map((item) => (
            <div
              key={item.id}
              className="
              flex
              flex-col
              gap-4
              rounded-xl
              bg-white
              p-4
              shadow
              sm:p-5
              md:flex-row
              md:items-center
              md:justify-between
              "
            >
              <h3
                className="
                break-words
                text-lg
                font-bold
                sm:text-xl
                "
              >
                {item.nome}
              </h3>

              <div
                className="
                flex
                w-full
                flex-col
                gap-3
                sm:flex-row
                md:w-auto
                "
              >
                <button
                  onClick={() => editarAcompanhamento(item)}
                  className="
                  w-full
                  rounded-lg
                  bg-yellow-500
                  px-5
                  py-2
                  font-semibold
                  text-white
                  transition
                  hover:bg-yellow-600
                  sm:w-auto
                  "
                >
                  Editar
                </button>

                <button
                  onClick={() => excluirAcompanhamento(item.id)}
                  className="
                  w-full
                  rounded-lg
                  bg-red-600
                  px-5
                  py-2
                  font-semibold
                  text-white
                  transition
                  hover:bg-red-700
                  sm:w-auto
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
