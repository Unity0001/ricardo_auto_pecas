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
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const router = useRouter();

  async function carregarProdutos() {
    const snapshot = await getDocs(collection(db, 'products'));

    const lista: any[] = [];

    snapshot.forEach((doc) => {
      lista.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    lista.sort((a, b) => {
      if (a.category === 'Combos' && b.category !== 'Combos') return -1;
      if (a.category !== 'Combos' && b.category === 'Combos') return 1;
      return a.title.localeCompare(b.title);
    });

    setProducts(lista);
  }

  useEffect(() => {
    carregarProdutos();

    const savedCart = localStorage.getItem('cart');

    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  const categories = ['Todos', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((product) => {
    const categoria = selectedCategory === 'Todos' || product.category === selectedCategory;

    const pesquisa =
      product.title.toLowerCase().includes(search.toLowerCase()) ||
      product.description.toLowerCase().includes(search.toLowerCase());

    return categoria && pesquisa;
  });

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

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
              onAddToCart={() => {
                if (product.category === 'Marmitas') {
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
              }}
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
