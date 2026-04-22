import { Suspense } from "react";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCatalog from "@/components/ProductCatalog";
import Loading from "@/app/loading";
import type { Product } from "@/types";

export const metadata: Metadata = {
  title: "Комбо — Come by Shop",
  description: "Вигідні комбо-набори від Come by Shop. Більше за менші гроші!",
};

async function getProducts(): Promise<Product[]> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "";
  try {
    const res = await fetch(`${base}/api/products`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch {
    return [];
  }
}

export default async function ComboPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const products = await getProducts();

  return (
    <>
      <Header />
      <main>
        <Suspense fallback={<Loading />}>
          <ProductCatalog
            initialProducts={products}
            searchQuery={q}
            category="combo"
          />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
