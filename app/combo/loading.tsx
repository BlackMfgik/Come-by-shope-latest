// Спільний скелетон для сторінок з каталогом товарів
// Використовує ті самі CSS-класи що й реальні картки — розміри збігаються точно
function ProductCardSkeleton() {
  return (
    <div className="product-card" style={{ pointerEvents: "none" }}>
      {/* Зображення — точна висота як у .product-img: calc(238px * var(--scale)) */}
      <div className="product-img skeleton-pulse" style={{ borderRadius: 0 }} />

      {/* Інфо — та сама секція .product-info з паддінгами */}
      <div className="product-info">
        {/* Назва товару */}
        <span
          className="skeleton-pulse"
          style={{
            display: "block",
            height: "calc(1.33rem * var(--scale))",
            width: "78%",
            borderRadius: 6,
          }}
        />
        {/* Вага */}
        <span
          className="skeleton-pulse"
          style={{
            display: "block",
            height: "calc(1.12rem * var(--scale))",
            width: "45%",
            borderRadius: 6,
          }}
        />

        {/* Ціна + кнопка */}
        <div
          className="product-bottom"
          style={{ marginTop: "auto", paddingTop: 12 }}
        >
          <span
            className="skeleton-pulse"
            style={{
              display: "block",
              height: "calc(1.75rem * var(--scale))",
              width: 80,
              borderRadius: 6,
            }}
          />
          <span
            className="skeleton-pulse"
            style={{
              display: "block",
              height: "calc(44px * var(--scale))",
              width: 110,
              borderRadius: 999,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <section className="catalog" aria-label="Завантаження...">
      {Array.from({ length: 8 }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </section>
  );
}
