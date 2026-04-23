import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageSquare, CheckCircle2, Users, Rocket, Clock, Quote } from "lucide-react";
import mengoBadge from "@/assets/mengo-badge.jpg";
import { WhoWeAre, CabinetGrid } from "@/components/CabinetSection";
import { TimelineSection } from "@/components/home/TimelineSection";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { motion, useScroll, useTransform } from "framer-motion";
import HierarchyTree from "@/components/portal/HierarchyTree";
import { Badge } from "@/components/ui/badge";

function ScrollIndicator() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 2, duration: 1, repeat: Infinity, repeatType: "reverse" }}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 cursor-pointer"
      onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
    >
      <span className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-medium">Explore More</span>
      <div className="w-[1px] h-12 bg-gradient-to-b from-gold to-transparent" />
    </motion.div>
  );
}

function QuoteOfTheDaySection() {
  return (
    <section className="bg-background py-8 md:py-12 border-y overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.015] pointer-events-none">
        <Quote className="w-32 h-32 -ml-6 -mt-6 text-primary rotate-12" />
      </div>
      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl"
        >
          <div className="relative p-6 md:p-10 rounded-xl md:rounded-2xl overflow-hidden glass-card group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Quote className="w-10 h-10 text-primary" />
            </div>
            <div className="text-center">
              <Badge variant="outline" className="mb-3 border-primary/20 text-primary px-2 py-0 rounded-full uppercase tracking-widest text-[8px]">
                Inspiration
              </Badge>
              <h2 className="text-xl md:text-2xl font-serif font-bold text-primary mb-4 md:mb-6 leading-snug px-2">
                "Leadership is not about a title or a designation. It's about impact, influence, and inspiration."
              </h2>
              <div className="flex items-center justify-center gap-2">
                <div className="h-[1px] w-6 bg-primary/20" />
                <span className="text-[9px] font-semibold tracking-widest uppercase text-muted-foreground">The Council Motto</span>
                <div className="h-[1px] w-6 bg-primary/20" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}


function ImpactStatsSection() {
  const stats = [
    { label: "Students Represented", value: "2,500+", icon: <Users className="w-3 h-3" /> },
    { label: "Issues Resolved", value: "150+", icon: <CheckCircle2 className="w-3 h-3" /> },
    { label: "Council Projects", value: "24+", icon: <Rocket className="w-3 h-3" /> },
    { label: "Years of Excellence", value: "100+", icon: <Clock className="w-3 h-3" /> }
  ];

  return (
    <section className="py-8 md:py-12 bg-primary text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 bg-hero-gradient opacity-90" />
      <div className="absolute inset-0 bg-pattern opacity-10" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="mx-auto w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center mb-2 backdrop-blur-sm">
                {s.icon}
              </div>
              <div className="text-2xl md:text-3xl font-serif font-bold mb-0.5 text-gold-light">{s.value}</div>
              <div className="text-[8px] uppercase tracking-widest text-primary-foreground/60 font-medium">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BlogsPreviewSection() {
  const [blogs, setBlogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const { data } = await api.get("/blogs/?limit=3");
        setBlogs(Array.isArray(data) ? data.slice(0, 3) : data.results?.slice(0, 3) || []);
      } catch (err) {
        console.error("Failed to load blogs", err);
      }
    };
    fetchBlogs();
  }, []);

  if (blogs.length === 0) return null;

  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none mb-2 text-[10px]">Latest Updates</Badge>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-primary">From the Council Hub</h2>
          </div>
          <Button variant="outline" size="sm" className="group border-primary text-primary hover:bg-primary hover:text-white rounded-full px-5 h-9" asChild>
            <Link to="/public-blogs">
              View All <ArrowRight className="ml-2 w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {blogs.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group cursor-pointer"
            >
              <div className="relative overflow-hidden rounded-xl aspect-[16/9] mb-3">
                <img 
                  src={post.image_url || post.image || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2671&auto=format&fit=crop"} 
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-3">
                  <Badge className="bg-gold text-gold-foreground border-none text-[8px]">News</Badge>
                </div>
              </div>
              <h3 className="text-lg font-serif font-bold mb-1.5 group-hover:text-primary transition-colors line-clamp-1">{post.title}</h3>
              <p className="text-muted-foreground line-clamp-2 mb-2 text-[13px] leading-relaxed">{post.content?.replace(/<[^>]*>/g, '')}</p>
              <div className="flex items-center text-primary font-bold text-[10px] tracking-tight">
                Read More <ArrowRight className="ml-1 w-3 h-3" />
              </div>
            </motion.div>
          ))}
        </div>
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

  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <div className="relative">
      <section className="relative min-h-[90vh] overflow-hidden flex items-center justify-center">
        {/* Background Slideshow */}
        <div className="absolute inset-0 pointer-events-none">
          {activeSlides.map((img, index) => (
            <motion.div
              key={`${img}-${index}`}
              style={{ backgroundImage: `url('${img}')`, y: index === currentImageIndex ? y1 : 0 }}
              className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-[2000ms] ease-in-out ${
                index === currentImageIndex ? "opacity-100 scale-105" : "opacity-0 scale-100"
              }`}
            />
          ))}
        </div>

        {/* Dynamic Gradient Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/30 via-primary/70 to-maroon-dark/90 backdrop-blur-[1px]" />
        
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-15 bg-pattern mix-blend-overlay" />

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ opacity }}
          className="relative z-10 container mx-auto px-4 flex flex-col items-center text-center py-8 md:py-12"
        >
          <motion.div variants={itemVariants} className="mb-4 md:mb-6">
            <div className="relative inline-block">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 -m-2 border-2 border-dashed border-gold/30 rounded-full"
              />
              <motion.img 
                whileHover={{ scale: 1.1, rotate: 5 }}
                src={mengoBadge} 
                alt="Mengo Badge" 
                className="relative h-20 w-20 rounded-full border-4 border-gold object-cover shadow-[0_0_20px_rgba(212,175,55,0.2)] transition-all sm:h-24 sm:w-24" 
              />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="max-w-4xl mx-auto">
            <h1 className="font-serif text-3xl font-extrabold text-white sm:text-5xl md:text-6xl tracking-tight text-shadow-hero leading-[1.1]">
              Mengo Senior School
              <span className="mt-1 block text-gold-light text-xl sm:text-3xl md:text-4xl tracking-tight">Student Council</span>
            </h1>
            
            <div className="flex items-center justify-center gap-3 mt-4">
              <div className="h-[1px] w-6 sm:w-10 bg-gold/50" />
              <motion.p className="text-[9px] sm:text-[10px] font-bold text-gold-light/90 italic tracking-[0.3em] uppercase">
                "Akwana Akira Ayomba"
              </motion.p>
              <div className="h-[1px] w-6 sm:w-10 bg-gold/50" />
            </div>

            <motion.p className="mt-4 max-w-lg mx-auto text-sm sm:text-base text-white/80 leading-relaxed font-light px-4">
              Pioneering excellence since 1895. Stewards of student life, representing every voice.
            </motion.p>
          </motion.div>

          <motion.div variants={itemVariants} className="mt-8 flex flex-col sm:flex-row justify-center gap-3 w-full max-w-sm px-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto px-6 py-5 text-sm shadow-2xl bg-gold text-gold-foreground hover:bg-gold-light transition-all rounded-lg overflow-hidden group relative" asChild>
                <Link to="/student-voice">
                  <span className="absolute inset-0 w-full h-full -ml-16 bg-white/30 transform -skew-x-12 animate-shine"></span>
                  <MessageSquare className="mr-2 h-4 w-4 relative z-10" /> 
                  <span className="relative z-10 font-bold uppercase tracking-wider">Student Voice</span>
                </Link>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto px-6 py-5 text-sm border-2 border-white/20 text-white hover:bg-white/10 backdrop-blur-md rounded-lg transition-all font-bold uppercase tracking-wider" asChild>
                <Link to="/login" className="flex items-center group">
                  Council Portal <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>

        <ScrollIndicator />
      </section>

      <ImpactStatsSection />
      <QuoteOfTheDaySection />
      <WhoWeAre />
      
      {/* Live Council Hierarchy Section */}
      <section className="bg-background py-12 md:py-16 overflow-hidden">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="mb-8 text-center max-w-2xl mx-auto"
          >
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none mb-2 text-[10px]">Structure</Badge>
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-primary mb-3">Council Hierarchy</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Our organizational structure represents our commitment to transparency.
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-2xl border bg-card/20 shadow-lg overflow-hidden p-4 sm:p-6 backdrop-blur-xl"
          >
             <HierarchyTree />
          </motion.div>
        </div>
      </section>

      <CabinetGrid />
      <BlogsPreviewSection />
      <TimelineSection />

      {/* CTA — compact */}
      <section className="bg-primary py-12 md:py-16 overflow-hidden relative">
        <div className="absolute inset-0 bg-hero-gradient opacity-90" />
        <div className="absolute inset-0 bg-pattern opacity-10" />
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="container mx-auto px-4 text-center relative z-10"
        >
          <div className="max-w-xl mx-auto p-8 rounded-2xl glass">
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-white mb-4">Your Voice Matters</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-white/80 font-light mb-6">
              Every idea counts. Submit yours today.
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
              <Button className="bg-gold text-gold-foreground hover:bg-gold-light px-8 py-5 text-base font-bold uppercase tracking-widest rounded-lg shadow-xl" asChild>
                <Link to="/student-voice">Submit Voice Now</Link>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
