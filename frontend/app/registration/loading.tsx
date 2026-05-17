export default function Loading() {
  return (
    <main
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100dvh",
        padding: "80px 20px 40px",
      }}
      aria-label="Завантаження..."
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {/* Title */}
        <span
          className="skeleton-pulse skeleton-line"
          style={{
            height: 32,
            width: "55%",
            display: "block",
            marginBottom: 8,
          }}
        />

        {/* Google button */}
        <span
          className="skeleton-pulse"
          style={{
            height: 48,
            borderRadius: "var(--radius)",
            display: "block",
          }}
        />

        {/* Divider */}
        <span
          className="skeleton-pulse skeleton-line"
          style={{ height: 1, display: "block", opacity: 0.5 }}
        />

        {/* Name + Email inputs */}
        {[1, 2, 3, 4].map((_, i) => (
          <span
            key={i}
            className="skeleton-pulse"
            style={{
              height: 48,
              borderRadius: "var(--radius)",
              display: "block",
            }}
          />
        ))}

        {/* Password strength bar */}
        <span
          className="skeleton-pulse"
          style={{
            height: 6,
            borderRadius: 4,
            display: "block",
            width: "100%",
          }}
        />

        {/* Submit button */}
        <span
          className="skeleton-pulse"
          style={{
            height: 48,
            borderRadius: "var(--radius)",
            display: "block",
            marginTop: 4,
          }}
        />

        {/* Link */}
        <span
          className="skeleton-pulse skeleton-line"
          style={{
            height: 14,
            width: "50%",
            display: "block",
            margin: "0 auto",
          }}
        />
      </div>
    </main>
  );
}
