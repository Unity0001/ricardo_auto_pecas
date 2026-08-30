'use client';

import { useEffect, useState } from 'react';

import { collection, getDocs } from 'firebase/firestore';

import { db } from '../../lib/firebase';

import CategoryFilter from './CategoryFilter';

import ProductCard from './ProductCard';

import FloatingCart from './FloatingCart';

interface Produto {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  price: number;
  category: string;
  ativo: boolean;
}

export default function ProductList() {
  const [products, setProducts] = useState<Produto[]>([]);
  const [categories, setCategories] = useState<string[]>(['Todos']);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  async function carregarProdutos() {
    try {
      const productsSnapshot = await getDocs(collection(db, 'products'));

      const listaProdutos: Produto[] = [];

      productsSnapshot.forEach((doc) => {
        const data = doc.data();

        if (data.ativo !== true) {
          return;
        }

        listaProdutos.push({
          id: doc.id,
          title: data.title || '',
          subtitle: data.subtitle || '',
          description: data.description || '',
          image: data.image || '',
          price: Number(data.price || 0),
          category: data.category || 'Outros',
          ativo: true,
        });
      });

      listaProdutos.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));

      setProducts(listaProdutos);

      const categoriasDoBanco = Array.from(
        new Set(
          listaProdutos
            .map((produto) => produto.category.trim())
            .filter((categoria) => categoria !== '')
        )
      ).sort((a, b) => a.localeCompare(b, 'pt-BR'));

      setCategories(['Todos', ...categoriasDoBanco]);

      if (selectedCategory !== 'Todos' && !categoriasDoBanco.includes(selectedCategory)) {
        setSelectedCategory('Todos');
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  }

  useEffect(() => {
    carregarProdutos();

    const savedCart = localStorage.getItem('cart');

    if (savedCart) {
      try {
        const carrinhoSalvo = JSON.parse(savedCart);

        if (Array.isArray(carrinhoSalvo)) {
          setCart(carrinhoSalvo);
        }
      } catch (error) {
        console.error('Erro ao carregar carrinho:', error);

        localStorage.removeItem('cart');
      }
    }
  }, []);

  const filteredProducts = products.filter((product) => {
    const categoriaSelecionada =
      selectedCategory === 'Todos' || product.category === selectedCategory;

    const titulo = (product.title || '').toLowerCase();

    const descricao = (product.description || '').toLowerCase();

    const subtitulo = (product.subtitle || '').toLowerCase();

    const busca = search.toLowerCase().trim();

    const pesquisa =
      titulo.includes(busca) || descricao.includes(busca) || subtitulo.includes(busca);

    return categoriaSelecionada && pesquisa;
  });

  const totalItems = cart.reduce((acc, item) => acc + Number(item.quantity || 0), 0);

  function adicionarAoCarrinho(product: Produto) {
    const novoCarrinho = [...cart];

    const index = novoCarrinho.findIndex((item) => item.id === product.id);

    if (index >= 0) {
      novoCarrinho[index] = {
        ...novoCarrinho[index],
        quantity: Number(novoCarrinho[index].quantity || 0) + 1,
      };
    } else {
      novoCarrinho.push({
        ...product,
        quantity: 1,
      });
    }

    setCart(novoCarrinho);

    localStorage.setItem('cart', JSON.stringify(novoCarrinho));
  }

  return (
    <div className="w-full overflow-x-hidden">
      <CategoryFilter
        categories={categories}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />

      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        <input
          type="text"
          placeholder="Pesquisar produto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-6 w-full rounded-lg border p-3 outline-none"
        />

        <h2 className="mb-6 border-b-2 border-black pb-2 text-center text-3xl font-bold sm:text-4xl md:text-5xl">
          {selectedCategory}
        </h2>

        <div className="space-y-4 sm:space-y-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              image={product.image}
              title={product.title}
              subtitle={product.subtitle}
              description={product.description}
              price={product.price}
              onAddToCart={() => adicionarAoCarrinho(product)}
            />
          ))}

          {filteredProducts.length === 0 && (
            <div className="rounded-xl bg-white p-8 text-center shadow">
              <h2 className="text-xl font-bold sm:text-2xl">Nenhum produto encontrado.</h2>

              <p className="mt-2 text-gray-600">Não existem produtos ativos nesta categoria.</p>
            </div>
          )}
        </div>
      </div>

      <FloatingCart totalItems={totalItems} />
    </div>
  );
}
