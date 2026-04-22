export default function Loading() {
  return (
    <section className="catalog" aria-label="Завантаження...">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="product-card"
          style={{ opacity: 0.4, pointerEvents: "none" }}
        >
          <div
            className="product-img"
            style={{ background: "var(--skeleton-bg, #2a2a2a)" }}
          />
          <div className="product-info">
            <div
              style={{
                height: 16,
                background: "var(--skeleton-bg, #2a2a2a)",
                borderRadius: 4,
                marginBottom: 8,
              }}
            />
            <div
              style={{
                height: 12,
                width: "60%",
                background: "var(--skeleton-bg, #2a2a2a)",
                borderRadius: 4,
              }}
            />
          </div>
        </div>
      ))}
    </section>
  );
}
