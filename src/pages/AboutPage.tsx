import Header from "../components/Header";
import Footer from "../components/Footer";

export default function AboutPage() {
  return (
    <>
      <Header />
      <main>
        <section className="team-section">
          <h1>
            Наша команда <span className="emoji">💕</span>
          </h1>
          <div className="team-image">
            <img src="/images/cats.jpeg" alt="Наша команда" />
          </div>
        </section>
        <Footer />
      </main>
    </>
  );
}
