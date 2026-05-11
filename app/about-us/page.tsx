import type { Metadata } from "next";
import Image from "next/image";
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
            <Image
              src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/q_auto/f_auto/no-image_ihltyz`}
              alt="Наша команда"
              width={800}
              height={500}
              priority
            />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
