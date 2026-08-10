interface ProductCardProps {
    image: string;
    title: string;
    subtitle: string;
    description: string;
    price: number;
    onAddToCart: () => void;
}

export default function ProductCard({
    image,
    title,
    subtitle,
    description,
    price,
    onAddToCart,
}: ProductCardProps) {
    return (
        <div className="flex flex-col gap-4 rounded-lg border-l-4 border-black bg-white p-4 shadow transition hover:shadow-lg sm:flex-row">

            <img
                src={image || "/sem-imagem.png"}
                alt={title}
                className="h-48 w-full rounded-md object-cover sm:h-48 sm:w-48"
            />

            <div className="flex flex-1 flex-col">

                <h3 className="text-2xl font-bold sm:text-3xl">
                    {title}
                </h3>

                <p className="text-base text-gray-600 sm:text-lg">
                    {subtitle}
                </p>

                <p className="mt-2 text-sm text-gray-500 sm:text-base">
                    {description}
                </p>

                <div className="mt-6 flex flex-col gap-4 sm:mt-auto sm:flex-row sm:items-center sm:justify-between">

                    <span className="text-center text-2xl font-bold text-green-700 sm:text-left">
                        R$ {price.toFixed(2)}
                    </span>

                    <button
                        onClick={onAddToCart}
                        className="w-full rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700 active:scale-95 sm:w-auto"
                    >
                        🛒 Adicionar ao Carrinho
                    </button>

                </div>

            </div>

        </div>
    );
}