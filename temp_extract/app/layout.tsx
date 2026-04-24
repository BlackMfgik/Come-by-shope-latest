import type { Metadata } from "next";
import Providers from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Come by Shop",
    template: "%s | Come by Shop",
  },
  description: "Замовляй їжу та продукти онлайн — оплата на місці чи тут",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://come-by-shop.com",
  ),
  openGraph: {
    type: "website",
    siteName: "Come by Shop",
    title: "Come by Shop",
    description: "Замовляй їжу та продукти онлайн — оплата на місці чи тут",
    images: [
      {
        url: "/images/products.png",
        width: 1200,
        height: 630,
        alt: "Come by Shop",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // CSS змінні --font-syne і --font-dm-sans доступні в усьому CSS
    <html lang="uk">
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
