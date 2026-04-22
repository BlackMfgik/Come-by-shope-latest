import { Suspense } from 'react';
import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCatalog from '@/components/ProductCatalog';
import Loading from '@/app/loading';
import type { Product } from '@/types';

export const metadata: Metadata = {
  title: 'Магазин — Come by Shop',
  description: 'Широкий асортимент продуктів в інтернет-магазині Come by Shop.',
};

async function getProducts(): Promise<Product[]> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? '';
  try {
    const res = await fetch(`${base}/api/products`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch {
    return [];
  }
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = '' } = await searchParams;
  const products = await getProducts();

  return (
    <>
      <Header />
      <main>
        <Suspense fallback={<Loading />}>
          <ProductCatalog initialProducts={products} searchQuery={q} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
