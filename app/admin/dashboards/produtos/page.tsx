'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, getDocs, deleteDoc, updateDoc, doc } from 'firebase/firestore';

import { db } from '../../../lib/firebase';

export default function ProdutosPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);

  const [misturas, setMisturas] = useState<any[]>([]);

  const [acompanhamentos, setAcompanhamentos] = useState<any[]>([]);

  const [title, setTitle] = useState('');

  const [subtitle, setSubtitle] = useState('');

  const [description, setDescription] = useState('');

  const [category, setCategory] = useState('Combos');

  const [price, setPrice] = useState('');

  const [image, setImage] = useState('');

  const [maxMisturas, setMaxMisturas] = useState(0);

  const [maxAcompanhamentos, setMaxAcompanhamentos] = useState(0);

  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [editTitle, setEditTitle] = useState('');

  const [editSubtitle, setEditSubtitle] = useState('');

  const [editDescription, setEditDescription] = useState('');

  const [editCategory, setEditCategory] = useState('');

  const [editPrice, setEditPrice] = useState('');

  const [editImage, setEditImage] = useState('');

  const [editMaxMisturas, setEditMaxMisturas] = useState(0);

  const [editMaxAcompanhamentos, setEditMaxAcompanhamentos] = useState(0);

  const [produtoSelecionado, setProdutoSelecionado] = useState<any>(null);

  const [misturasSelecionadas, setMisturasSelecionadas] = useState<string[]>([]);

  const [acompanhamentosSelecionados, setAcompanhamentosSelecionados] = useState<string[]>([]);
  async function carregarProdutos() {
    const snapshot = await getDocs(collection(db, 'products'));

    const lista: any[] = [];

    snapshot.forEach((item) => {
      lista.push({
        id: item.id,

        ...item.data(),
      });
    });

    setProducts(lista);
  }

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
    carregarProdutos();

    carregarMisturas();

    carregarAcompanhamentos();
  }, []);

  async function adicionarProduto() {
    if (!title.trim() || !subtitle.trim() || !description.trim() || !price) {
      alert('Preencha os campos obrigatórios');

      return;
    }

    await addDoc(collection(db, 'products'), {
      title,

      subtitle,

      description,

      category,

      price: Number(price),

      image: image.trim() || 'https://placehold.co/600x400?text=Sem+Imagem',

      maxMisturas,

      maxAcompanhamentos,

      misturas: [],

      acompanhamentos: [],

      ativo: true,
    });

    setTitle('');

    setSubtitle('');

    setDescription('');

    setPrice('');

    setImage('');

    setMaxMisturas(0);

    setMaxAcompanhamentos(0);

    carregarProdutos();
  }

  async function excluirProduto(id: string) {
    const confirmar = confirm('Deseja excluir esse produto?');

    if (!confirmar) return;

    await deleteDoc(doc(db, 'products', id));

    carregarProdutos();
  }

  async function alternarAtivo(product: any) {
    await updateDoc(doc(db, 'products', product.id), {
      ativo: product.ativo !== true,
    });

    carregarProdutos();
  }

  function editarProduto(product: any) {
    setEditandoId(product.id);

    setEditTitle(product.title);

    setEditSubtitle(product.subtitle);

    setEditDescription(product.description);

    setEditCategory(product.category);

    setEditPrice(String(product.price));

    setEditImage(product.image);

    setEditMaxMisturas(product.maxMisturas || 0);

    setEditMaxAcompanhamentos(product.maxAcompanhamentos || 0);
  }

  async function salvarEdicao() {
    if (!editandoId) return;

    const dados: any = {
      title: editTitle,
      subtitle: editSubtitle,
      description: editDescription,
      category: editCategory,
      price: Number(editPrice),
      image: editImage,
    };

    if (editCategory === 'Marmitex') {
      dados.maxMisturas = editMaxMisturas;
      dados.maxAcompanhamentos = editMaxAcompanhamentos;
    } else {
      dados.maxMisturas = 0;
      dados.maxAcompanhamentos = 0;
      dados.misturas = [];
      dados.acompanhamentos = [];
    }

    await updateDoc(doc(db, 'products', editandoId), dados);

    setEditandoId(null);
    carregarProdutos();
  }

  function abrirMisturas(product: any) {
    setProdutoSelecionado(product);

    setMisturasSelecionadas(product.misturas || []);

    setAcompanhamentosSelecionados(product.acompanhamentos || []);
  }

  function toggleMistura(id: string) {
    setMisturasSelecionadas((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }

      return [...prev, id];
    });
  }

  function toggleAcompanhamento(id: string) {
    setAcompanhamentosSelecionados((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }

      return [...prev, id];
    });
  }

  async function salvarOpcoes() {
    if (!produtoSelecionado) return;

    await updateDoc(
      doc(db, 'products', produtoSelecionado.id),

      {
        misturas: misturasSelecionadas,

        acompanhamentos: acompanhamentosSelecionados,
      }
    );

    setProdutoSelecionado(null);

    carregarProdutos();
  }
  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-bold">🍔 Produtos</h1>

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

        <div className="mb-10 rounded-xl bg-white p-6 shadow">
          <h2 className="mb-6 text-2xl font-bold">Novo Produto</h2>

          <div className="grid gap-4">
            <input
              placeholder="Nome"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded border p-3"
            />

            <input
              placeholder="Subtítulo"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="rounded border p-3"
            />

            <textarea
              placeholder="Descrição"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded border p-3"
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded border p-3"
            >
              <option>Combos</option>
              <option>Marmitex</option>
              <option>Bebidas</option>
              <option>Sucos</option>
              <option>Salgados</option>
            </select>

            <input
              type="number"
              placeholder="Preço"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="rounded border p-3"
            />

            <input
              placeholder="URL da imagem"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="rounded border p-3"
            />

            {category === 'Marmitex' && (
              <>
                <input
                  type="number"
                  placeholder="Máximo de misturas"
                  value={maxMisturas}
                  onChange={(e) => setMaxMisturas(Number(e.target.value))}
                  className="rounded border p-3"
                />

                <input
                  type="number"
                  placeholder="Máximo de acompanhamentos"
                  value={maxAcompanhamentos}
                  onChange={(e) => setMaxAcompanhamentos(Number(e.target.value))}
                  className="rounded border p-3"
                />
              </>
            )}

            <button
              onClick={adicionarProduto}
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
              Adicionar Produto
            </button>
          </div>
        </div>

        {editandoId && (
          <div className="mb-10 rounded-xl bg-white p-6 shadow">
            <h2 className="mb-6 text-2xl font-bold">Editar Produto</h2>

            <div className="grid gap-4">
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="rounded border p-3"
                placeholder="Nome"
              />

              <input
                value={editSubtitle}
                onChange={(e) => setEditSubtitle(e.target.value)}
                className="rounded border p-3"
                placeholder="Subtítulo"
              />

              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="rounded border p-3"
                placeholder="Descrição"
              />

              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="rounded border p-3"
              >
                <option>Combos</option>
                <option>Marmitex</option>
                <option>Bebidas</option>
                <option>Sucos</option>
                <option>Salgados</option>
              </select>

              <input
                value={editPrice}
                type="number"
                onChange={(e) => setEditPrice(e.target.value)}
                className="rounded border p-3"
                placeholder="Preço"
              />

              <input
                value={editImage}
                onChange={(e) => setEditImage(e.target.value)}
                className="rounded border p-3"
                placeholder="URL da imagem"
              />

              {editCategory === 'Marmitex' && (
                <>
                  <input
                    type="number"
                    placeholder="Máximo de misturas"
                    value={editMaxMisturas}
                    onChange={(e) => setEditMaxMisturas(Number(e.target.value))}
                    className="rounded border p-3"
                  />

                  <input
                    type="number"
                    placeholder="Máximo de acompanhamentos"
                    value={editMaxAcompanhamentos}
                    onChange={(e) => setEditMaxAcompanhamentos(Number(e.target.value))}
                    className="rounded border p-3"
                  />
                </>
              )}

              <div className="flex gap-3">
                <button
                  onClick={salvarEdicao}
                  className="flex-1 rounded-lg bg-blue-600 p-3 font-bold text-white hover:bg-blue-700"
                >
                  Salvar
                </button>

                <button
                  onClick={() => setEditandoId(null)}
                  className="flex-1 rounded-lg bg-gray-500 p-3 font-bold text-white hover:bg-gray-600"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-5">
          {products.map((product) => (
            <div
              key={product.id}
              className="
          rounded-xl
          bg-white
          p-5
          shadow
        "
            >
              <div className="flex flex-col gap-5 md:flex-row">
                <img
                  src={product.image}
                  alt={product.title}
                  className="
              h-40
              w-full
              rounded-lg
              object-cover
              md:w-40
            "
                />

                <div className="flex-1">
                  <h2 className="text-2xl font-bold">{product.title}</h2>

                  <p className="text-gray-600">{product.description}</p>

                  <p className="mt-2 font-bold text-green-600">
                    R$ {Number(product.price).toFixed(2)}
                  </p>

                  {product.category === 'Marmitex' && (
                    <>
                      <p className="mt-2 text-sm">
                        🥩 Misturas: {product.misturas?.length || 0}/{product.maxMisturas || 0}
                      </p>

                      <p className="text-sm">
                        🥗 Acompanhamentos: {product.acompanhamentos?.length || 0}/
                        {product.maxAcompanhamentos || 0}
                      </p>
                    </>
                  )}

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <button
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
                      onClick={() => editarProduto(product)}
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
                      onClick={() => excluirProduto(product.id)}
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
  {
    /* =========================
    MODAL OPÇÕES DO PRODUTO
========================= */
  }

  {
    produtoSelecionado && (
      <div
        className="
fixed
inset-0
z-50
flex
items-center
justify-center
bg-black/50
p-4
"
      >
        <div
          className="
max-h-[90vh]
w-full
max-w-3xl
overflow-auto
rounded-xl
bg-white
p-6
"
        >
          <h2 className="mb-6 text-3xl font-bold">Opções - {produtoSelecionado.title}</h2>

          {/* =========================
        MISTURAS
========================= */}

          <div className="mb-8">
            <h3 className="mb-4 text-xl font-bold">🥩 Misturas</h3>

            <p className="mb-3 text-sm text-gray-600">
              Escolha até {produtoSelecionado.maxMisturas || 0}
            </p>

            <div className="space-y-3">
              {misturas.map((item) => (
                <label
                  key={item.id}
                  className="
flex
cursor-pointer
items-center
justify-between
rounded-lg
border
p-4
hover:bg-gray-100
"
                >
                  <div>
                    <p className="font-semibold">{item.nome}</p>

                    {item.acrescimo > 0 && (
                      <p className="text-sm text-gray-500">
                        + R$ {Number(item.acrescimo).toFixed(2)}
                      </p>
                    )}
                  </div>

                  <input
                    type="checkbox"
                    checked={misturasSelecionadas.includes(item.id)}
                    disabled={
                      !misturasSelecionadas.includes(item.id) &&
                      misturasSelecionadas.length >= produtoSelecionado.maxMisturas
                    }
                    onChange={() => toggleMistura(item.id)}
                    className="
h-5
w-5
"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* =========================
     ACOMPANHAMENTOS
========================= */}

          <div className="mb-8">
            <h3 className="mb-4 text-xl font-bold">🥗 Acompanhamentos</h3>

            <p className="mb-3 text-sm text-gray-600">
              Escolha até {produtoSelecionado.maxAcompanhamentos || 0}
            </p>

            <div className="space-y-3">
              {acompanhamentos.map((item) => (
                <label
                  key={item.id}
                  className="
flex
cursor-pointer
items-center
justify-between
rounded-lg
border
p-4
hover:bg-gray-100
"
                >
                  <span className="font-semibold">{item.nome}</span>

                  <input
                    type="checkbox"
                    checked={acompanhamentosSelecionados.includes(item.id)}
                    disabled={
                      !acompanhamentosSelecionados.includes(item.id) &&
                      acompanhamentosSelecionados.length >= produtoSelecionado.maxAcompanhamentos
                    }
                    onChange={() => toggleAcompanhamento(item.id)}
                    className="
h-5
w-5
"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={salvarOpcoes}
              className="
flex-1
rounded-lg
bg-green-600
p-3
font-bold
text-white
hover:bg-green-700
"
            >
              Salvar
            </button>

            <button
              onClick={() => setProdutoSelecionado(null)}
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
    );
  }
}
