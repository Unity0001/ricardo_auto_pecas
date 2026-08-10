interface CategoryFilterProps {
    categories: string[];
    selected: string;
    onSelect: (category: string) => void;
}

export default function CategoryFilter({
    categories,
    selected,
    onSelect,
}: CategoryFilterProps) {
    return (
        <div className="flex overflow-x-auto bg-white shadow">
            {categories.map((category) => (
                <button
                    key={category}
                    onClick={() => onSelect(category)}
                    className={`px-8 py-4 whitespace-nowrap uppercase transition-all
            ${selected === category
                            ? "border-b-2 border-black font-semibold"
                            : "text-gray-500 hover:text-black"
                        }`}
                >
                    {category}
                </button>
            ))}
        </div>
    );
}