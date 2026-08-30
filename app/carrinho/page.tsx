'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface CartItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  price: number;
  category: string;
  quantity: number;
}

export default function CartPage() {
  const router = useRouter();

  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');

    if (savedCart) {
      try {
        const carrinhoSalvo = JSON.parse(savedCart);

        if (Array.isArray(carrinhoSalvo)) {
          setCart(carrinhoSalvo);
        } else {
          localStorage.removeItem('cart');
        }
      } catch (error) {
        console.error('Erro ao carregar carrinho:', error);
        localStorage.removeItem('cart');
      }
    }
  }, []);

  function atualizarCarrinho(novoCarrinho: CartItem[]) {
    setCart(novoCarrinho);
    localStorage.setItem('cart', JSON.stringify(novoCarrinho));
  }

  function aumentarQuantidade(id: string) {
    const novoCarrinho = cart.map((item) =>
      item.id === id
        ? {
            ...item,
            quantity: item.quantity + 1,
          }
        : item
    );

    atualizarCarrinho(novoCarrinho);
  }

  function diminuirQuantidade(id: string) {
    const novoCarrinho = cart
      .map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: item.quantity - 1,
            }
          : item
      )
      .filter((item) => item.quantity > 0);

    atualizarCarrinho(novoCarrinho);
  }

  const subtotal = cart.reduce(
    (acc, item) => acc + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );

  const total = subtotal;

  const podeFinalizar = cart.length > 0;

  return (
    <main className="min-h-screen bg-gray-100 py-8 sm:py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Link
          href="/"
          className="mb-6 inline-block text-base text-blue-600 hover:underline sm:text-lg"
        >
          ← Continuar comprando
        </Link>

        <h1 className="mb-8 text-3xl font-bold sm:mb-10 sm:text-5xl">Meu Pedido</h1>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {cart.length === 0 && (
              <div className="rounded-xl bg-white p-8 text-center shadow">
                <h2 className="text-2xl font-bold sm:text-3xl">Seu carrinho está vazio.</h2>

                <p className="mt-3 text-gray-600">Adicione produtos ao seu pedido.</p>

                <Link
                  href="/"
                  className="mt-6 inline-block rounded-lg bg-green-600 px-6 py-3 font-bold text-white hover:bg-green-700"
                >
                  Ver produtos
                </Link>
              </div>
            )}

            {cart.map((item) => (
              <div key={item.id} className="rounded-xl bg-white p-5 shadow">
                <div className="flex flex-col gap-5 md:flex-row">
                  <img
                    src={item.image || '/placeholder.png'}
                    alt={item.title}
                    className="h-40 w-full rounded-lg object-cover md:h-36 md:w-36"
                  />

                  <div className="flex-1">
                    <h2 className="text-2xl font-bold">{item.title}</h2>

                    {item.subtitle && <p className="mt-1 text-gray-500">{item.subtitle}</p>}

                    {item.description && <p className="mt-2 text-gray-600">{item.description}</p>}

                    {item.category && (
                      <p className="mt-2 text-sm font-semibold text-blue-600">{item.category}</p>
                    )}

                    <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => diminuirQuantidade(item.id)}
                          className="h-10 w-10 rounded-lg bg-red-500 text-xl font-bold text-white hover:bg-red-600"
                        >
                          −
                        </button>

                        <span className="min-w-8 text-center text-xl font-bold">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() => aumentarQuantidade(item.id)}
                          className="h-10 w-10 rounded-lg bg-green-600 text-xl font-bold text-white hover:bg-green-700"
                        >
                          +
                        </button>
                      </div>

                      <span className="text-2xl font-bold text-green-700">
                        R$ {(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <div className="rounded-xl bg-white p-5 shadow lg:sticky lg:top-8">
              <h2 className="mb-6 text-3xl font-bold">Resumo</h2>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>

                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Entrega</span>

                  <span>A calcular</span>
                </div>

                <hr />

                <div className="flex justify-between text-2xl font-bold">
                  <span>Total</span>

                  <span>R$ {total.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="button"
                disabled={!podeFinalizar}
                onClick={() => router.push('/entrega')}
                className="mt-8 w-full rounded-lg bg-green-600 py-4 text-xl font-bold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {cart.length === 0 ? 'Carrinho vazio' : 'Continuar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
