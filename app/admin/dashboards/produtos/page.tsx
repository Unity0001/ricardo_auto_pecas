'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, getDocs, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export default function ProdutosPage() {
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');
  const [category, setCategory] = useState('');

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editCategory, setEditCategory] = useState('');

  const [loading, setLoading] = useState(false);

  async function carregarProdutos() {
    try {
      const snapshot = await getDocs(collection(db, 'products'));

      const lista: any[] = [];

      snapshot.forEach((item) => {
        lista.push({
          id: item.id,
          ...item.data(),
        });
      });

      lista.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'pt-BR'));

      setProducts(lista);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);

      alert('Erro ao carregar os produtos.');
    }
  }

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
    }
  }

  useEffect(() => {
    carregarProdutos();
    carregarCategorias();
  }, []);

  async function adicionarProduto() {
    if (!title.trim() || !description.trim() || !price) {
      alert('Preencha os campos obrigatórios.');
      return;
    }

    if (!category) {
      alert('Selecione uma categoria.');
      return;
    }

    const valor = Number(price);

    if (isNaN(valor) || valor <= 0) {
      alert('Digite um preço válido.');
      return;
    }

    try {
      setLoading(true);

      await addDoc(collection(db, 'products'), {
        title: title.trim(),
        subtitle: subtitle.trim(),
        description: description.trim(),
        category,
        price: valor,
        image: image.trim(),
        ativo: true,
      });

      setTitle('');
      setSubtitle('');
      setDescription('');
      setPrice('');
      setImage('');
      setCategory('');

      await carregarProdutos();

      alert('Produto adicionado com sucesso.');
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);

      alert('Erro ao adicionar o produto.');
    } finally {
      setLoading(false);
    }
  }

  async function excluirProduto(id: string) {
    const confirmar = confirm('Deseja realmente excluir este produto?');

    if (!confirmar) return;

    try {
      setLoading(true);

      await deleteDoc(doc(db, 'products', id));

      await carregarProdutos();

      alert('Produto excluído.');
    } catch (error) {
      console.error('Erro ao excluir produto:', error);

      alert('Erro ao excluir o produto.');
    } finally {
      setLoading(false);
    }
  }

  async function alternarAtivo(product: any) {
    try {
      await updateDoc(doc(db, 'products', product.id), {
        ativo: product.ativo !== true,
      });

      await carregarProdutos();
    } catch (error) {
      console.error('Erro ao alterar status:', error);

      alert('Erro ao alterar o status do produto.');
    }
  }

  function editarProduto(product: any) {
    setEditandoId(product.id);
    setEditTitle(product.title || '');
    setEditSubtitle(product.subtitle || '');
    setEditDescription(product.description || '');
    setEditPrice(String(product.price ?? ''));
    setEditImage(product.image || '');
    setEditCategory(product.category || '');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  async function salvarEdicao() {
    if (!editandoId) return;

    if (!editTitle.trim() || !editDescription.trim() || !editPrice) {
      alert('Preencha os campos obrigatórios.');
      return;
    }

    if (!editCategory) {
      alert('Selecione uma categoria.');
      return;
    }

    const valor = Number(editPrice);

    if (isNaN(valor) || valor <= 0) {
      alert('Digite um preço válido.');
      return;
    }

    try {
      setLoading(true);

      await updateDoc(doc(db, 'products', editandoId), {
        title: editTitle.trim(),
        subtitle: editSubtitle.trim(),
        description: editDescription.trim(),
        category: editCategory,
        price: valor,
        image: editImage.trim(),
      });

      setEditandoId(null);
      setEditTitle('');
      setEditSubtitle('');
      setEditDescription('');
      setEditPrice('');
      setEditImage('');
      setEditCategory('');

      await carregarProdutos();

      alert('Produto atualizado com sucesso.');
    } catch (error) {
      console.error('Erro ao editar produto:', error);

      alert('Erro ao atualizar o produto.');
    } finally {
      setLoading(false);
    }
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setEditTitle('');
    setEditSubtitle('');
    setEditDescription('');
    setEditPrice('');
    setEditImage('');
    setEditCategory('');
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold sm:text-4xl">Produtos</h1>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => router.push('/admin/categorias')}
              className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Categorias
            </button>

            <button
              type="button"
              onClick={() => router.push('/admin/dashboards')}
              className="rounded-lg bg-gray-800 px-5 py-3 font-semibold text-white hover:bg-gray-900"
            >
              ← Voltar
            </button>
          </div>
        </div>

        <div className="mb-10 rounded-xl bg-white p-5 shadow sm:p-6">
          <h2 className="mb-6 text-2xl font-bold">Novo Produto</h2>

          <div className="grid gap-4">
            <input
              placeholder="Nome do produto"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded border p-3 outline-none focus:border-green-600"
            />

            <input
              placeholder="Subtítulo"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="rounded border p-3 outline-none focus:border-green-600"
            />

            <textarea
              placeholder="Descrição"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-28 rounded border p-3 outline-none focus:border-green-600"
            />

            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Preço"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="rounded border p-3 outline-none focus:border-green-600"
            />

            <input
              placeholder="URL da imagem"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="rounded border p-3 outline-none focus:border-green-600"
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded border bg-white p-3 outline-none focus:border-green-600"
            >
              <option value="">Selecione uma categoria</option>

              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.nome}>
                  {categoria.nome}
                </option>
              ))}
            </select>

            {categorias.length === 0 && (
              <div className="rounded-lg bg-yellow-100 p-3 text-sm text-yellow-800">
                Nenhuma categoria cadastrada. Crie uma categoria antes de cadastrar produtos.
              </div>
            )}

            <button
              type="button"
              onClick={adicionarProduto}
              disabled={loading}
              className="rounded-lg bg-green-600 p-3 font-bold text-white hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? 'Salvando...' : 'Adicionar Produto'}
            </button>
          </div>
        </div>

        {editandoId && (
          <div className="mb-10 rounded-xl bg-white p-5 shadow sm:p-6">
            <h2 className="mb-6 text-2xl font-bold">Editar Produto</h2>

            <div className="grid gap-4">
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="rounded border p-3 outline-none focus:border-blue-600"
                placeholder="Nome do produto"
              />

              <input
                value={editSubtitle}
                onChange={(e) => setEditSubtitle(e.target.value)}
                className="rounded border p-3 outline-none focus:border-blue-600"
                placeholder="Subtítulo"
              />

              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="min-h-28 rounded border p-3 outline-none focus:border-blue-600"
                placeholder="Descrição"
              />

              <input
                value={editPrice}
                type="number"
                min="0"
                step="0.01"
                onChange={(e) => setEditPrice(e.target.value)}
                className="rounded border p-3 outline-none focus:border-blue-600"
                placeholder="Preço"
              />

              <input
                value={editImage}
                onChange={(e) => setEditImage(e.target.value)}
                className="rounded border p-3 outline-none focus:border-blue-600"
                placeholder="URL da imagem"
              />

              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="rounded border bg-white p-3 outline-none focus:border-blue-600"
              >
                <option value="">Selecione uma categoria</option>

                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.nome}>
                    {categoria.nome}
                  </option>
                ))}
              </select>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={salvarEdicao}
                  disabled={loading}
                  className="flex-1 rounded-lg bg-blue-600 p-3 font-bold text-white hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>

                <button
                  type="button"
                  onClick={cancelarEdicao}
                  className="flex-1 rounded-lg bg-gray-500 p-3 font-bold text-white hover:bg-gray-600"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-5">
          {products.length === 0 && (
            <div className="rounded-xl bg-white p-8 text-center shadow">
              <h2 className="text-xl font-bold sm:text-2xl">Nenhum produto cadastrado.</h2>
            </div>
          )}

          {products.map((product) => (
            <div key={product.id} className="rounded-xl bg-white p-5 shadow">
              <div className="flex flex-col gap-5 md:flex-row">
                <img
                  src={product.image || 'https://placehold.co/600x400?text=Sem+Imagem'}
                  alt={product.title || 'Produto'}
                  className="h-48 w-full rounded-lg object-cover md:h-40 md:w-40"
                />

                <div className="flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">{product.title}</h2>

                      {product.subtitle && <p className="text-gray-500">{product.subtitle}</p>}
                    </div>

                    <span
                      className={`w-fit rounded-full px-3 py-1 text-sm font-bold ${
                        product.ativo === true
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {product.ativo === true ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  <p className="mt-3 text-gray-600">{product.description}</p>

                  <p className="mt-3 font-bold text-green-600">
                    R$ {Number(product.price || 0).toFixed(2)}
                  </p>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => alternarAtivo(product)}
                      className={`rounded-lg p-3 font-bold text-white ${
                        product.ativo === true
                          ? 'bg-orange-500 hover:bg-orange-600'
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {product.ativo === true ? '⏸ Inativar' : '▶️ Ativar'}
                    </button>

                    <button
                      type="button"
                      onClick={() => editarProduto(product)}
                      className="rounded-lg bg-yellow-500 p-3 font-bold text-white hover:bg-yellow-600"
                    >
                      ✏️ Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => excluirProduto(product.id)}
                      className="rounded-lg bg-red-600 p-3 font-bold text-white hover:bg-red-700"
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
