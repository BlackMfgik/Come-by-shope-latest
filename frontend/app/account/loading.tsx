// Скелетон акаунту — точно повторює layout сторінки:
// account-page (flex row) → account-sidebar (210px) + account-content (flex:1)
// Всі відступи, розміри та gap взяті з globals.css

function AccountItemSkeleton({
  valueWidth = "55%",
  hasValue = true,
}: {
  valueWidth?: string;
  hasValue?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "calc(18px * var(--scale)) calc(22px * var(--scale))",
        background: "var(--surface)",
        minHeight: "calc(68px * var(--scale))",
        boxSizing: "border-box" as const,
      }}
    >
      {/* Ліва частина: іконка + текст */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "calc(16px * var(--scale))",
        }}
      >
        <span
          className="skeleton-pulse"
          style={{
            display: "block",
            width: "calc(18px * var(--scale))",
            height: "calc(18px * var(--scale))",
            borderRadius: "50%",
            flexShrink: 0,
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <span
            className="skeleton-pulse"
            style={{
              display: "block",
              height: "calc(0.9rem * var(--scale))",
              width: 80,
              borderRadius: 4,
            }}
          />
          {hasValue && (
            <span
              className="skeleton-pulse"
              style={{
                display: "block",
                height: "calc(0.82rem * var(--scale))",
                width: valueWidth,
                borderRadius: 4,
              }}
            />
          )}
        </div>
      </div>

      {/* Права частина: кругла кнопка */}
      <span
        className="skeleton-pulse"
        style={{
          display: "block",
          width: 32,
          height: 32,
          borderRadius: "50%",
          flexShrink: 0,
        }}
      />
    </div>
  );
}

export default function Loading() {
  const items: { valueWidth: string; hasValue: boolean }[] = [
    { valueWidth: "120px", hasValue: true }, // ім'я
    { valueWidth: "180px", hasValue: true }, // email
    { valueWidth: "130px", hasValue: true }, // телефон
    { valueWidth: "0", hasValue: false }, // пароль
    { valueWidth: "150px", hasValue: true }, // оплата
    { valueWidth: "200px", hasValue: true }, // адреса
    { valueWidth: "0", hasValue: false }, // вийти
  ];

  return (
    <main className="account-page" aria-label="Завантаження...">
      {/* Сайдбар 210px — 2 навігаційних пункти */}
      <aside className="account-sidebar">
        <ul>
          {[100, 110].map((w, i) => (
            <li
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "calc(16px * var(--scale)) calc(18px * var(--scale))",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                pointerEvents: "none" as const,
              }}
            >
              <span
                className="skeleton-pulse"
                style={{
                  display: "block",
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  flexShrink: 0,
                }}
              />
              <span
                className="skeleton-pulse"
                style={{
                  display: "block",
                  height: "calc(0.92rem * var(--scale))",
                  width: w,
                  borderRadius: 4,
                }}
              />
            </li>
          ))}
        </ul>
      </aside>

      {/* Контент */}
      <section className="account-content">
        {/* Заголовок h1 */}
        <span
          className="skeleton-pulse"
          style={{
            display: "block",
            height: "calc(1.75rem * var(--scale))",
            width: 220,
            borderRadius: 8,
            marginBottom: "calc(20px * var(--scale))",
          }}
        />

        {/* 7 рядків (як у .account-card з gap 8px) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "calc(8px * var(--scale))",
          }}
        >
          {items.map((item, i) => (
            <AccountItemSkeleton
              key={i}
              valueWidth={item.valueWidth}
              hasValue={item.hasValue}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
