'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export default function CategoriasPage() {
  const router = useRouter();

  const [categorias, setCategorias] = useState<any[]>([]);
  const [nome, setNome] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState('');
  const [loading, setLoading] = useState(false);

  async function carregarCategorias() {
    try {
      const snapshot = await getDocs(collection(db, 'categories'));

      const lista: any[] = [];

      snapshot.forEach((item) => {
        lista.push({
          id: item.id,
          ...item.data(),
        });
      });

      lista.sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR'));

      setCategorias(lista);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      alert('Erro ao carregar categorias.');
    }
  }

  useEffect(() => {
    carregarCategorias();
  }, []);

  async function criarCategoria() {
    const nomeLimpo = nome.trim();

    if (!nomeLimpo) {
      alert('Digite o nome da categoria.');
      return;
    }

    const existe = categorias.some(
      (categoria) => String(categoria.nome || '').toLowerCase() === nomeLimpo.toLowerCase()
    );

    if (existe) {
      alert('Esta categoria já existe.');
      return;
    }

    try {
      setLoading(true);

      await addDoc(collection(db, 'categories'), {
        nome: nomeLimpo,
      });

      setNome('');

      await carregarCategorias();

      alert('Categoria criada com sucesso.');
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      alert('Erro ao criar categoria.');
    } finally {
      setLoading(false);
    }
  }

  function iniciarEdicao(categoria: any) {
    setEditandoId(categoria.id);
    setEditNome(categoria.nome || '');
  }

  async function salvarEdicao() {
    if (!editandoId) return;

    const nomeLimpo = editNome.trim();

    if (!nomeLimpo) {
      alert('Digite o nome da categoria.');
      return;
    }

    const existe = categorias.some(
      (categoria) =>
        categoria.id !== editandoId &&
        String(categoria.nome || '').toLowerCase() === nomeLimpo.toLowerCase()
    );

    if (existe) {
      alert('Esta categoria já existe.');
      return;
    }

    try {
      setLoading(true);

      await updateDoc(doc(db, 'categories', editandoId), {
        nome: nomeLimpo,
      });

      setEditandoId(null);
      setEditNome('');

      await carregarCategorias();

      alert('Categoria atualizada com sucesso.');
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);

      alert('Erro ao atualizar categoria.');
    } finally {
      setLoading(false);
    }
  }

  async function excluirCategoria(id: string) {
    const confirmar = confirm('Deseja realmente excluir esta categoria?');

    if (!confirmar) return;

    try {
      setLoading(true);

      await deleteDoc(doc(db, 'categories', id));

      await carregarCategorias();

      alert('Categoria excluída.');
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);

      alert('Erro ao excluir categoria.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold sm:text-4xl">Categorias</h1>

          <button
            type="button"
            onClick={() => router.push('/admin/dashboards')}
            className="rounded-lg bg-gray-800 px-5 py-3 font-semibold text-white hover:bg-gray-900"
          >
            ← Voltar
          </button>
        </div>

        <div className="mb-8 rounded-xl bg-white p-5 shadow sm:p-6">
          <h2 className="mb-5 text-2xl font-bold">Nova Categoria</h2>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              placeholder="Nome da categoria"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  criarCategoria();
                }
              }}
              className="flex-1 rounded-lg border p-3 outline-none focus:border-green-600"
            />

            <button
              type="button"
              onClick={criarCategoria}
              disabled={loading}
              className="rounded-lg bg-green-600 px-6 py-3 font-bold text-white hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? 'Salvando...' : 'Criar'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {categorias.length === 0 && (
            <div className="rounded-xl bg-white p-8 text-center shadow">
              <h2 className="text-xl font-bold">Nenhuma categoria cadastrada.</h2>
            </div>
          )}

          {categorias.map((categoria) => (
            <div key={categoria.id} className="rounded-xl bg-white p-5 shadow">
              {editandoId === categoria.id ? (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={editNome}
                    onChange={(e) => setEditNome(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        salvarEdicao();
                      }
                    }}
                    className="flex-1 rounded-lg border p-3 outline-none focus:border-blue-600"
                  />

                  <button
                    type="button"
                    onClick={salvarEdicao}
                    disabled={loading}
                    className="rounded-lg bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    Salvar
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditandoId(null);
                      setEditNome('');
                    }}
                    className="rounded-lg bg-gray-500 px-5 py-3 font-bold text-white hover:bg-gray-600"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-xl font-bold">{categoria.nome}</h2>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => iniciarEdicao(categoria)}
                      className="rounded-lg bg-yellow-500 px-5 py-2 font-bold text-white hover:bg-yellow-600"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => excluirCategoria(categoria.id)}
                      className="rounded-lg bg-red-600 px-5 py-2 font-bold text-white hover:bg-red-700"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
