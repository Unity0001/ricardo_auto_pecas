'use client';
import { useRouter } from 'next/navigation';
export default function Dashboard() {
  const router = useRouter();
  return (
    <main className="min-h-screen bg-gray-100 p-6">
      {' '}
      <div className="mx-auto max-w-6xl">
        {' '}
        <button
          onClick={() => router.push('/')}
          className=" mb-8 rounded-lg bg-gray-800 px-6 py-3 font-semibold text-white shadow transition hover:bg-gray-900 "
        >
          {' '}
          ← Voltar para início{' '}
        </button>{' '}
        <h1 className="mb-10 text-center text-3xl font-bold md:text-4xl">
          {' '}
          Painel Administrativo{' '}
        </h1>{' '}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {' '}
          {/* PEDIDOS */}{' '}
          <button
            onClick={() => router.push('/admin/dashboards/pedidos')}
            className=" rounded-xl bg-yellow-600 p-10 text-xl font-bold text-white shadow-lg transition hover:bg-red-700 active:scale-95 "
          >
            {' '}
            📦 <br /> Pedidos{' '}
          </button>{' '}
          <button
            onClick={() => {
              console.log('clicou produtos');
              router.push('/admin/dashboards/produtos');
            }}
            className=" rounded-xl bg-blue-600 p-10 text-xl font-bold text-white shadow-lg transition hover:bg-blue-700 active:scale-95 "
          >
            {' '}
            🍔 <br /> Produtos{' '}
          </button>{' '}
          <button
            onClick={() => router.push('/admin/dashboards/categorias')}
            className=" rounded-xl bg-green-600 p-10 text-xl font-bold text-white shadow-lg transition hover:bg-green-700 active:scale-95 "
          >
            {' '}
            🏷️ <br /> Categorias{' '}
          </button>
        </div>{' '}
      </div>{' '}
    </main>
  );
}
