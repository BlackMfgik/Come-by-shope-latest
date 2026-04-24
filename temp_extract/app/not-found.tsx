import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <Header />
      <main style={{ textAlign: "center", padding: "4rem 1rem" }}>
        <h1 style={{ fontSize: "4rem", marginBottom: "1rem" }}>404</h1>
        <p style={{ fontSize: "1.2rem", marginBottom: "2rem", opacity: 0.7 }}>
          Сторінку не знайдено
        </p>
        <Link href="/" className="add-btn" style={{ display: "inline-block" }}>
          На головну
        </Link>
      </main>
      <Footer />
    </>
  );
}
