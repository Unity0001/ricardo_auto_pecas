'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useRouter } from 'next/navigation';

import CategoryFilter from './CategoryFilter';
import ProductCard from './ProductCard';
import FloatingCart from './FloatingCart';

export default function ProductList() {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Marmitex');
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  const router = useRouter();

  async function carregarProdutos() {
    try {
      const productsSnapshot = await getDocs(collection(db, 'products'));

      const listaProdutos: any[] = [];

      productsSnapshot.forEach((doc) => {
        const data = doc.data();

        if (data.ativo !== true) return;

        listaProdutos.push({
          id: doc.id,
          ...data,
        });
      });

      const sobremesasSnapshot = await getDocs(collection(db, 'sobremesas'));

      const listaSobremesas: any[] = [];

      sobremesasSnapshot.forEach((doc) => {
        const data = doc.data();

        if (data.ativo !== true) return;

        listaSobremesas.push({
          id: `sobremesa-${doc.id}`,
          title: data.nome,
          subtitle: '',
          description: '',
          image: data.image || '',
          price: Number(data.price || 0),
          category: 'Sobremesas',
          sobremesaId: doc.id,
        });
      });

      const listaCompleta = [...listaProdutos, ...listaSobremesas];

      const ordemMarmitex: Record<string, number> = {
        'Marmita P': 1,
        'Marmita PP': 2,
        'Marmita M': 3,
        'Marmita G': 4,
        'Marmita GG': 5,
        'Marmitex P': 1,
        'Marmitex PP': 2,
        'Marmitex M': 3,
        'Marmitex G': 4,
        'Marmitex GG': 5,
      };

      listaCompleta.sort((a, b) => {
        const aMarmitex = a.category === 'Marmitex' || a.category === 'Marmitas';

        const bMarmitex = b.category === 'Marmitex' || b.category === 'Marmitas';

        if (aMarmitex && !bMarmitex) {
          return -1;
        }

        if (!aMarmitex && bMarmitex) {
          return 1;
        }

        if (aMarmitex && bMarmitex) {
          const ordemA = ordemMarmitex[a.title] ?? 999;

          const ordemB = ordemMarmitex[b.title] ?? 999;

          if (ordemA !== ordemB) {
            return ordemA - ordemB;
          }

          return (a.title || '').localeCompare(b.title || '', 'pt-BR');
        }

        return (a.title || '').localeCompare(b.title || '', 'pt-BR');
      });

      setProducts(listaCompleta);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  }

  useEffect(() => {
    carregarProdutos();

    const savedCart = localStorage.getItem('cart');

    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  const categories = [
    'Marmitex',
    'Bebidas',
    'Salgados',
    'Sucos',
    'Panquecas',
    'Lanches Naturais',
    'Sobremesas',
  ];

  const filteredProducts = products.filter((product) => {
    const isMarmitex = product.category === 'Marmitex' || product.category === 'Marmitas';

    const categoria =
      selectedCategory === 'Marmitex' ? isMarmitex : product.category === selectedCategory;

    const titulo = (product.title || '').toLowerCase();

    const descricao = (product.description || '').toLowerCase();

    const busca = search.toLowerCase();

    const pesquisa = titulo.includes(busca) || descricao.includes(busca);

    return categoria && pesquisa;
  });

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  function adicionarAoCarrinho(product: any) {
    const isMarmitex = product.category === 'Marmitex' || product.category === 'Marmitas';

    if (isMarmitex) {
      router.push(`/montar/${product.id}`);

      return;
    }

    const novoCarrinho = [...cart];

    const index = novoCarrinho.findIndex((item) => item.id === product.id);

    if (index >= 0) {
      novoCarrinho[index].quantity += 1;
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
          placeholder="Pesquisar..."
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
            </div>
          )}
        </div>
      </div>

      <FloatingCart totalItems={totalItems} />
    </div>
  );
}
