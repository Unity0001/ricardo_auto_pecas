import ProductList from '../products/ProductList';

export default function HeaderComp() {
  return (
    <div className="w-full">
      <div className="relative h-40 sm:h-56 md:h-64 bg-gray-300">
        <img src="/background_logo.jpeg" alt="Header" className="h-full w-full object-cover" />

        <a href="/admin" className="absolute right-3 top-3 sm:right-5 sm:top-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-500 shadow-lg sm:h-14 sm:w-14">
            <img
              src="/user_logo.png"
              alt="Administrador"
              className="h-10 w-10 rounded-md object-cover sm:h-12 sm:w-12"
            />
          </div>
        </a>
      </div>

      <div className="bg-gray-100 pb-8">
        <div className="mx-auto max-w-6xl px-2">
          <div className="relative flex justify-center">
            <div className="-mt-12 sm:-mt-16 h-24 w-24 sm:h-32 sm:w-32 overflow-hidden rounded-xl border-4 border-white bg-white shadow-lg">
              <img src="/logo.jpeg" alt="Logo" className="h-full w-full object-cover" />
            </div>
          </div>

          <div className="pt-2 text-center"></div>

          <div className="mt-5 text-center">
            <h1 className="text-2xl font-bold sm:text-4xl">Rei do Suco</h1>

            <p className="mt-2 text-sm text-blue-500 sm:text-base">
              Av. Washington Luis,220
              <br />
              Contato:(19) 995498950
            </p>

            <div className="mt-8 flex justify-center gap-10 sm:gap-12">
              <div className="text-center">
                <p className="font-semibold">🚚 Entrega</p>

                <p className="text-gray-600">50 min - 1h</p>
              </div>

              <div className="text-center">
                <p className="font-semibold">🏪 Retirada</p>

                <p className="text-gray-600">40 min</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProductList />
    </div>
  );
}
