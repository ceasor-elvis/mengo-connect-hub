import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageSquare } from "lucide-react";
import mengoBadge from "@/assets/mengo-badge.jpg";
import { WhoWeAre, CabinetGrid } from "@/components/CabinetSection";
import { TimelineSection } from "@/components/home/TimelineSection";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { motion } from "framer-motion";

function QuoteOfTheDaySection() {
  return (
    <section className="bg-muted/30 py-12 sm:py-16 border-y overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-6 text-center"
        >
          <h2 className="font-serif text-2xl font-bold sm:text-3xl">Quote of the Day</h2>
          <p className="text-sm text-muted-foreground mt-2"> </p>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mx-auto max-w-3xl"
        >
          <div className="rounded-xl border bg-card p-8 sm:p-12 shadow-sm text-center relative overflow-hidden group hover:shadow-md transition-shadow duration-500">
            <span className="text-8xl text-primary/10 absolute -top-4 -left-2 font-serif select-none transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6">"</span>
            {/* Dynamic quote space intended for future backend connect */}
            <p className="text-lg md:text-2xl font-medium italic text-card-foreground my-4 relative z-10 transition-colors duration-300">
              Leadership is not about a title or a designation. It's about impact, influence, and inspiration.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

const slideshowImages = [
  "/slideshow/2025-02-08.webp",
  "/slideshow/2025-02-09.webp",
  "/slideshow/476063854_17890842204176339_398022608816591784_n.jpeg",
  "/slideshow/G1_ifQeXkAAGhfW.jpg",
  "/slideshow/G_20CA8XwAA27xu.jpg",
  "/slideshow/GmeokXxaQAA_GLK.jpg",
  "/slideshow/HDSX4TkW8AAxy9L.jpg",
  "/slideshow/HF9ljg7X0AAXzSb.jpg",
  "/slideshow/maxresdefault.jpg"
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { staggerChildren: 0.15, delayChildren: 0.2 } 
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } }
};

export default function HomePage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeSlides, setActiveSlides] = useState<string[]>(slideshowImages);

  useEffect(() => {
    const fetchCustomSlides = async () => {
      try {
        const { data } = await api.get("/documents/");
        const entries = Array.isArray(data) ? data : data.results || [];
        const customSlides = entries
          .filter((d: any) => d.title === "slideshow_img")
          .map((d: any) => d.file_url || d.file)
          .filter(Boolean);
        
        if (customSlides.length > 0) {
          setActiveSlides(customSlides);
          setCurrentImageIndex(0);
        }
      } catch (err) {
        console.error("Failed to load custom slides", err);
      }
    };
    fetchCustomSlides();
  }, []);

  useEffect(() => {
    if (activeSlides.length === 0) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % activeSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeSlides]);

  return (
    <>
      <section className="relative overflow-hidden bg-primary/90">
        {/* Background Slideshow */}
        {activeSlides.map((img, index) => (
          <div
            key={`${img}-${index}`}
            className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-[2000ms] ease-in-out ${
              index === currentImageIndex ? "opacity-100 scale-105" : "opacity-0 scale-100"
            }`}
            style={{ backgroundImage: `url('${img}')` }}
          />
        ))}

        {/* Maroon Blur Overlay */}
        <div className="absolute inset-0 bg-primary/70 backdrop-blur-sm" />
        
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-10 bg-pattern mix-blend-overlay" />

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 flex flex-col items-center px-4 py-16 text-center sm:py-24 md:py-32"
        >
          <motion.img 
            variants={itemVariants}
            whileHover={{ scale: 1.05, rotate: 5 }}
            src={mengoBadge} 
            alt="Mengo Badge" 
            className="mb-4 h-20 w-20 rounded-full border-4 border-gold object-cover shadow-xl sm:h-28 sm:w-28 transition-all" 
          />
          <motion.h1 variants={itemVariants} className="font-serif text-3xl font-extrabold text-primary-foreground sm:text-4xl md:text-6xl drop-shadow-md">
            Mengo Senior School
            <span className="mt-1 block text-gold-light text-2xl sm:text-3xl md:text-5xl">Student Council</span>
          </motion.h1>
          <motion.p variants={itemVariants} className="mx-auto mt-1 text-xs font-medium text-gold-light/90 italic drop-shadow sm:text-sm">
            "Akwana Akira Ayomba"
          </motion.p>
          <motion.p variants={itemVariants} className="mx-auto mt-4 max-w-xl text-sm text-primary-foreground/90 drop-shadow sm:text-lg">
            Serving with integrity, representing every voice, building a better school.
          </motion.p>
          <motion.div variants={itemVariants} className="mt-8 flex flex-wrap justify-center gap-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="hero" size="lg" className="shadow-xl backdrop-blur-sm bg-gold/90 hover:bg-gold overflow-hidden group relative" asChild>
                <Link to="/student-voice">
                  <span className="absolute inset-0 w-full h-full -ml-16 bg-white opacity-20 transform -skew-x-12 group-hover:animate-shine"></span>
                  <MessageSquare className="mr-2 h-4 w-4 relative z-10" /> 
                  <span className="relative z-10">Student Voice</span>
                </Link>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="hero-outline" size="lg" className="shadow-xl backdrop-blur-sm border-primary-foreground/30 hover:bg-primary-foreground/10" asChild>
                <Link to="/login">Portal <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      <QuoteOfTheDaySection />
      <WhoWeAre />
      <CabinetGrid />
      <TimelineSection />

      {/* CTA — compact */}
      <section className="bg-hero-gradient py-12 sm:py-16 overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="container mx-auto px-4 text-center"
        >
          <h2 className="font-serif text-2xl font-bold text-primary-foreground sm:text-3xl md:text-4xl">Your Voice Matters</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-primary-foreground/80">
            Have an idea, complaint, or project? Submit it through Student Voice.
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block mt-6">
            <Button variant="hero" size="lg" className="shadow-lg hover:shadow-xl transition-shadow" asChild>
              <Link to="/student-voice">Submit Now</Link>
            </Button>
          </motion.div>
        </motion.div>
      </section>
    </>
  );
}
