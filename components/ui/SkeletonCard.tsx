export default function SkeletonCard() {
  return (
    <div className="product-card skeleton-card" aria-hidden="true">
      <div className="product-img skeleton-img skeleton-pulse" />
      <div className="product-info skeleton-info">
        <div
          className="skeleton-line skeleton-pulse"
          style={{ height: 18, width: "75%", marginBottom: 8 }}
        />
        <div
          className="skeleton-line skeleton-pulse"
          style={{ height: 13, width: "40%", marginBottom: 16 }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            className="skeleton-line skeleton-pulse"
            style={{ height: 20, width: "35%" }}
          />
          <div
            className="skeleton-line skeleton-pulse"
            style={{ height: 34, width: "38%", borderRadius: 20 }}
          />
        </div>
      </div>
    </div>
  );
}
