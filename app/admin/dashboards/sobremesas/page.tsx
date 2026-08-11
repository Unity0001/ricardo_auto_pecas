'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { collection, addDoc, getDocs, deleteDoc, updateDoc, doc } from 'firebase/firestore';

import { db } from '../../../lib/firebase';

export default function SobremesasPage() {
  const router = useRouter();

  const [sobremesas, setSobremesas] = useState<any[]>([]);

  const [nome, setNome] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');

  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [editNome, setEditNome] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editImage, setEditImage] = useState('');

  async function carregarSobremesas() {
    const snapshot = await getDocs(collection(db, 'sobremesas'));

    const lista: any[] = [];

    snapshot.forEach((item) => {
      lista.push({
        id: item.id,
        ...item.data(),
      });
    });

    setSobremesas(lista);
  }

  useEffect(() => {
    carregarSobremesas();
  }, []);

  async function salvarSobremesa() {
    if (!nome.trim()) {
      alert('Digite o nome da sobremesa');
      return;
    }

    if (!price || Number(price) <= 0) {
      alert('Digite um valor válido para a sobremesa');
      return;
    }

    const valor = Number(price);

    await addDoc(collection(db, 'sobremesas'), {
      nome: nome.trim(),
      price: valor,
      image: image.trim() || 'https://placehold.co/600x400?text=Sem+Imagem',
      ativo: true,
    });

    setNome('');
    setPrice('');
    setImage('');

    carregarSobremesas();
  }

  function editarSobremesa(item: any) {
    setEditandoId(item.id);

    setEditNome(item.nome || '');
    setEditPrice(item.price?.toString() || '');
    setEditImage(item.image || '');
  }

  async function salvarEdicao() {
    if (!editandoId) return;

    if (!editNome.trim()) {
      alert('Digite o nome da sobremesa');
      return;
    }

    if (!editPrice || Number(editPrice) <= 0) {
      alert('Digite um valor válido para a sobremesa');
      return;
    }

    await updateDoc(doc(db, 'sobremesas', editandoId), {
      nome: editNome.trim(),
      price: Number(editPrice),
      image: editImage.trim() || 'https://placehold.co/600x400?text=Sem+Imagem',
    });

    setEditandoId(null);

    setEditNome('');
    setEditPrice('');
    setEditImage('');

    carregarSobremesas();
  }

  async function alternarAtivo(item: any) {
    await updateDoc(doc(db, 'sobremesas', item.id), {
      ativo: item.ativo !== true,
    });

    carregarSobremesas();
  }

  async function excluirSobremesa(id: string) {
    if (!confirm('Deseja excluir essa sobremesa?')) return;

    await deleteDoc(doc(db, 'sobremesas', id));

    carregarSobremesas();
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="mx-auto w-full max-w-6xl">
        {/* CABEÇALHO */}
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
          <h1 className="text-2xl font-bold sm:text-4xl">🍮 Gerenciar Sobremesas</h1>

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

        {/* NOVA SOBREMESA */}
        <div className="mb-10 rounded-xl bg-white p-4 shadow sm:p-6">
          <h2 className="mb-6 text-xl font-bold sm:text-2xl">Nova Sobremesa</h2>

          <div className="grid gap-4">
            {/* NOME */}
            <input
              placeholder="Nome da sobremesa"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="rounded-lg border p-3 outline-none focus:border-green-500"
            />

            {/* PREÇO */}
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Preço"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="rounded-lg border p-3 outline-none focus:border-green-500"
            />

            {/* IMAGEM */}
            <input
              placeholder="URL da imagem"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="rounded-lg border p-3 outline-none focus:border-green-500"
            />

            {/* PREVIEW */}
            {image && (
              <div className="overflow-hidden rounded-lg border">
                <img
                  src={image}
                  alt="Preview da sobremesa"
                  className="h-48 w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://placehold.co/600x400?text=Imagem+Inválida';
                  }}
                />
              </div>
            )}

            <button
              onClick={salvarSobremesa}
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
              Adicionar Sobremesa
            </button>
          </div>
        </div>

        {/* EDITAR SOBREMESA */}
        {editandoId && (
          <div className="mb-10 rounded-xl bg-white p-4 shadow sm:p-6">
            <h2 className="mb-6 text-xl font-bold sm:text-2xl">Editar Sobremesa</h2>

            <div className="grid gap-4">
              <input
                value={editNome}
                onChange={(e) => setEditNome(e.target.value)}
                placeholder="Nome da sobremesa"
                className="rounded-lg border p-3 outline-none focus:border-green-500"
              />

              <input
                type="number"
                step="0.01"
                min="0"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                placeholder="Preço"
                className="rounded-lg border p-3 outline-none focus:border-green-500"
              />

              <input
                value={editImage}
                onChange={(e) => setEditImage(e.target.value)}
                placeholder="URL da imagem"
                className="rounded-lg border p-3 outline-none focus:border-green-500"
              />

              {editImage && (
                <div className="overflow-hidden rounded-lg border">
                  <img
                    src={editImage}
                    alt="Preview da sobremesa"
                    className="h-48 w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://placehold.co/600x400?text=Imagem+Inválida';
                    }}
                  />
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={salvarEdicao}
                  className="
                    flex-1
                    rounded-lg
                    bg-blue-600
                    p-3
                    font-bold
                    text-white
                    hover:bg-blue-700
                  "
                >
                  Salvar Alteração
                </button>

                <button
                  onClick={() => {
                    setEditandoId(null);
                    setEditNome('');
                    setEditPrice('');
                    setEditImage('');
                  }}
                  className="
                    flex-1
                    rounded-lg
                    bg-gray-500
                    p-3
                    font-bold
                    text-white
                    hover:bg-gray-600
                  "
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LISTA */}
        <div className="space-y-5">
          {sobremesas.map((item) => (
            <div
              key={item.id}
              className="
                rounded-xl
                bg-white
                p-4
                shadow
                sm:p-5
              "
            >
              <div className="flex flex-col gap-5 md:flex-row">
                {/* IMAGEM */}
                <img
                  src={item.image || 'https://placehold.co/600x400?text=Sem+Imagem'}
                  alt={item.nome}
                  className="
                    h-40
                    w-full
                    rounded-lg
                    object-cover
                    md:w-40
                  "
                  onError={(e) => {
                    e.currentTarget.src = 'https://placehold.co/600x400?text=Sem+Imagem';
                  }}
                />

                {/* INFORMAÇÕES */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-bold">{item.nome}</h2>

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

                  <p className="mt-2 font-bold text-green-600">
                    R${' '}
                    {Number(item.price || 0)
                      .toFixed(2)
                      .replace('.', ',')}
                  </p>

                  {/* BOTÕES */}
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <button
                      onClick={() => alternarAtivo(item)}
                      className={`rounded-lg p-3 font-bold text-white ${
                        item.ativo === true
                          ? 'bg-orange-500 hover:bg-orange-600'
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {item.ativo === true ? '⏸ Inativar' : '▶️ Ativar'}
                    </button>

                    <button
                      onClick={() => editarSobremesa(item)}
                      className="
                        rounded-lg
                        bg-yellow-500
                        p-3
                        font-bold
                        text-white
                        hover:bg-yellow-600
                      "
                    >
                      ✏️ Editar
                    </button>

                    <button
                      onClick={() => excluirSobremesa(item.id)}
                      className="
                        rounded-lg
                        bg-red-600
                        p-3
                        font-bold
                        text-white
                        hover:bg-red-700
                      "
                    >
                      🗑 Excluir
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
