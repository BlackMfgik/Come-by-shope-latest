interface Props {
  categories: string[];
  active: string;
  onChange: (cat: string) => void;
}

export default function CategoryFilter({
  categories,
  active,
  onChange,
}: Props) {
  return (
    <div className="category-filter">
      <button
        className={`category-filter-btn${active === "" ? " active" : ""}`}
        onClick={() => onChange("")}
      >
        Всі
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          className={`category-filter-btn${active === cat ? " active" : ""}`}
          onClick={() => onChange(cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
