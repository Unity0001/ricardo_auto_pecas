'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const router = useRouter();

  const [cart, setCart] = useState<any[]>([]);

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');

    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  function atualizarCarrinho(novoCarrinho: any[]) {
    setCart(novoCarrinho);
    localStorage.setItem('cart', JSON.stringify(novoCarrinho));
  }

  function aumentarQuantidade(id: number) {
    const novoCarrinho = cart.map((item) =>
      item.id === id ? { ...item, quantity: item.quantity + 1 } : item
    );

    atualizarCarrinho(novoCarrinho);
  }

  function diminuirQuantidade(id: number) {
    const novoCarrinho = cart
      .map((item) => (item.id === id ? { ...item, quantity: item.quantity - 1 } : item))
      .filter((item) => item.quantity > 0);

    atualizarCarrinho(novoCarrinho);
  }

  function alterarObservacao(id: number, observacao: string) {
    const novoCarrinho = cart.map((item) =>
      item.id === id
        ? {
            ...item,
            observacao,
          }
        : item
    );

    atualizarCarrinho(novoCarrinho);
  }

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const total = subtotal;

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
              </div>
            )}

            {cart.map((item) => (
              <div key={item.id} className="rounded-xl bg-white p-5 shadow">
                <div className="flex flex-col gap-5 md:flex-row">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-40 w-full rounded-lg object-cover md:h-36 md:w-36"
                  />

                  <div className="flex-1">
                    <h2 className="text-2xl font-bold">{item.title}</h2>

                    {item.subtitle && <p className="text-gray-500">{item.subtitle}</p>}

                    {/* Misturas */}
                    {item.misturas && (
                      <div className="mt-4">
                        <p className="font-semibold">Misturas:</p>

                        <ul className="ml-5 list-disc text-gray-700">
                          {item.misturas.map((mistura: any, index: number) => (
                            <li key={index}>
                              {mistura.nome}
                              {mistura.acrescimo > 0 && ` (+R$ ${mistura.acrescimo.toFixed(2)})`}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Acompanhamentos */}
                    {item.acompanhamentos && (
                      <div className="mt-4">
                        <p className="font-semibold">Acompanhamentos:</p>

                        <ul className="ml-5 list-disc text-gray-700">
                          {item.acompanhamentos.map((acomp: any, index: number) => (
                            <li key={index}>{acomp.nome}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <textarea
                      placeholder="Observações..."
                      value={item.observacao || ''}
                      onChange={(e) => alterarObservacao(item.id, e.target.value)}
                      className="mt-5 min-h-24 w-full rounded-lg border p-3"
                    />

                    <div className="mt-6 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => diminuirQuantidade(item.id)}
                          className="h-10 w-10 rounded-lg bg-red-500 text-white"
                        >
                          -
                        </button>

                        <span className="text-xl font-bold">{item.quantity}</span>

                        <button
                          onClick={() => aumentarQuantidade(item.id)}
                          className="h-10 w-10 rounded-lg bg-green-600 text-white"
                        >
                          +
                        </button>
                      </div>

                      <span className="text-2xl font-bold text-green-700">
                        R$ {(item.price * item.quantity).toFixed(2)}
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
                disabled={cart.length === 0}
                onClick={() => router.push('/entrega')}
                className="mt-8 w-full rounded-lg bg-green-600 py-4 text-xl font-bold text-white hover:bg-green-700 disabled:bg-gray-400"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
