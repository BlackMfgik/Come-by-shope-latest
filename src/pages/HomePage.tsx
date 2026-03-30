import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCatalog from "../components/ProductCatalog";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <section className="hero">
          <h1>
            Замовляй їжу та
            <br />
            продукти онлайн —<br />
            оплата на місці чи тут
          </h1>
        </section>

        <ProductCatalog />
        <Footer />
      </main>
    </>
  );
}
