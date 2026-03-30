import { useSearchParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCatalog from "../components/ProductCatalog";

export default function ShopPage() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";
  return (
    <>
      <Header />
      <main>
        <ProductCatalog searchQuery={q} />
        <Footer />
      </main>
    </>
  );
}
