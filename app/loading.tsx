export default function Loading() {
  return (
    <main aria-label="Завантаження...">
      {/* Hero skeleton — повторює розміри .hero + .hero h1 */}
      <section
        style={{
          textAlign: "left",
          padding:
            "calc(140px * var(--scale)) calc(5vw * var(--scale)) calc(80px * var(--scale))",
          minHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            maxWidth: 680,
            display: "flex",
            flexDirection: "column",
            gap: "clamp(12px, 1.4vw, 22px)",
          }}
        >
          <span
            className="skeleton-pulse"
            style={{
              display: "block",
              height: "clamp(3rem, 6vw, 5.5rem)",
              width: "55%",
              borderRadius: 8,
            }}
          />
          <span
            className="skeleton-pulse"
            style={{
              display: "block",
              height: "clamp(3rem, 6vw, 5.5rem)",
              width: "70%",
              borderRadius: 8,
            }}
          />
          <span
            className="skeleton-pulse"
            style={{
              display: "block",
              height: "clamp(3rem, 6vw, 5.5rem)",
              width: "62%",
              borderRadius: 8,
            }}
          />
        </div>

        {/* Кнопки-скелетони */}
        <div style={{ display: "flex", gap: 20, marginTop: 48 }}>
          <span
            className="skeleton-pulse"
            style={{
              display: "block",
              height: 52,
              width: 180,
              borderRadius: 999,
            }}
          />
          <span
            className="skeleton-pulse"
            style={{
              display: "block",
              height: 52,
              width: 150,
              borderRadius: 999,
            }}
          />
        </div>
      </section>

      {/* Верхівки карток — overflow hidden щоб картки "виглядали" знизу */}
      <div
        style={{
          overflow: "hidden",
          height: "calc(120px * var(--scale))",
          maskImage: "linear-gradient(to bottom, black 20%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 20%, transparent 100%)",
          padding: "0 calc(24px * var(--scale))",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: "calc(22px * var(--scale))",
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="product-card"
              style={{ pointerEvents: "none" }}
            >
              <div
                className="product-img skeleton-pulse"
                style={{ borderRadius: 0 }}
              />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
