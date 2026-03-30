import { useSearchParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCatalog from "../components/ProductCatalog";

export default function ComboPage() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";
  return (
    <>
      <Header />
      <main>
        <ProductCatalog searchQuery={q} category="combo" />
        <Footer />
      </main>
    </>
  );
}
