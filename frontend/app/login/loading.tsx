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
          maxWidth: 400,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Title */}
        <span
          className="skeleton-pulse skeleton-line"
          style={{
            height: 32,
            width: "60%",
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

        {/* Email input */}
        <span
          className="skeleton-pulse"
          style={{
            height: 48,
            borderRadius: "var(--radius)",
            display: "block",
          }}
        />

        {/* Password input */}
        <span
          className="skeleton-pulse"
          style={{
            height: 48,
            borderRadius: "var(--radius)",
            display: "block",
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
