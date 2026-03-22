import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageSquare } from "lucide-react";
import mengoBadge from "@/assets/mengo-badge.jpg";
import { WhoWeAre, CabinetGrid } from "@/components/CabinetSection";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-hero-gradient">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="relative z-10 flex flex-col items-center px-4 py-24 text-center md:py-36">
          <img src={mengoBadge} alt="Mengo Senior School Badge" className="mb-6 h-28 w-28 rounded-full border-4 border-gold object-cover shadow-xl" />
          <h1 className="font-serif text-4xl font-extrabold text-primary-foreground md:text-6xl">
            Mengo Senior School
            <span className="mt-2 block text-gold-light">Student Council</span>
          </h1>
          <p className="mx-auto mt-2 text-sm font-medium text-gold-light/80 italic">"Akwana Akira Ayomba"</p>
          <p className="mx-auto mt-6 max-w-xl text-lg text-primary-foreground/80">
            Serving with integrity, representing every voice, and building a better school community together.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button variant="hero" size="lg" asChild>
              <Link to="/student-voice">
                <MessageSquare className="mr-2 h-5 w-5" />
                Student Voice
              </Link>
            </Button>
            <Button variant="hero-outline" size="lg" asChild>
              <Link to="/login">
                Councillor Portal
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <WhoWeAre />
      <CabinetGrid />

      {/* CTA */}
      <section className="bg-hero-gradient py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl font-bold text-primary-foreground md:text-4xl">
            Your Voice Matters
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-primary-foreground/80">
            Have a project idea, complaint, or suggestion? Submit it through our Student Voice platform
            and let the council take action.
          </p>
          <Button variant="hero" size="lg" className="mt-8" asChild>
            <Link to="/student-voice">Submit Now</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
