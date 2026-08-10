"use client";

import Link from "next/link";

interface FloatingCartProps {
    totalItems: number;
}

export default function FloatingCart({
    totalItems,
}: FloatingCartProps) {
    return (
        <Link
            href="/carrinho"
            className="fixed bottom-6 right-6 z-[9999]"
        >
            <button className="flex items-center gap-3 rounded-full bg-green-600 px-6 py-4 text-white shadow-2xl transition hover:scale-105 hover:bg-green-700">
                🛒

                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-bold text-green-600">
                    {totalItems}
                </span>
            </button>
        </Link>
    );
}