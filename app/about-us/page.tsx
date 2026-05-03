import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Про нас — Come by Shop",
  description: "Дізнайся більше про команду Come by Shop.",
};

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
            <img src="/images/no-image.jpeg" alt="Наша команда" />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
