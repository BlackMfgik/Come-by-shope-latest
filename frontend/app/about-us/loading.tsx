export default function Loading() {
  return (
    <main aria-label="Завантаження...">
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "120px 20px 60px",
          gap: 24,
        }}
      >
        {/* Title */}
        <span
          className="skeleton-pulse skeleton-line"
          style={{ height: 36, width: 240, display: "block" }}
        />

        {/* Image placeholder */}
        <span
          className="skeleton-pulse"
          style={{
            width: "100%",
            maxWidth: 600,
            aspectRatio: "16/9",
            borderRadius: "var(--radius)",
            display: "block",
          }}
        />
      </section>
    </main>
  );
}
