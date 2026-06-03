import { Users, Award, Shield, User, Star, Landmark } from "lucide-react";
import mengoBadge from "@/assets/mengo-badge.jpg";
import HierarchyTree from "@/components/portal/HierarchyTree";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const CABINET_MEMBERS = [
  { name: "Ssekandi Brian", position: "Chairperson", initials: "SB" },
  { name: "Nakato Grace", position: "Vice Chairperson", initials: "NG" },
  { name: "Lwanga David", position: "Speaker", initials: "LD" },
  { name: "Namutebi Sarah", position: "Deputy Speaker", initials: "NS" },
  { name: "Kato Emmanuel", position: "General Secretary", initials: "KE" },
  { name: "Achieng Patricia", position: "Asst. Gen. Secretary", initials: "AP" },
  { name: "Mugisha Ronald", position: "Secretary Finance", initials: "MR" },
  { name: "Nambi Irene", position: "Secretary Welfare", initials: "NI" },
  { name: "Okello Joseph", position: "Secretary Health", initials: "OJ" },
  { name: "Babirye Esther", position: "Sec. Women Affairs", initials: "BE" },
  { name: "Ssenoga Peter", position: "Secretary Publicity", initials: "SP" },
  { name: "Tumwine Alex", position: "Secretary PWDs", initials: "TA" },
  { name: "Mr. Kasozi John", position: "Patron", initials: "KJ" },
  { name: "Mukasa Henry", position: "Electoral Commission", initials: "MH" },
];

export function CabinetGrid() {
  return (
    <section className="py-12 md:py-16 bg-background overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center max-w-2xl mx-auto">
          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none mb-2 uppercase tracking-widest text-[8px]">The Team</Badge>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-primary mb-3">Cabinet</h2>
          <p className="text-muted-foreground text-sm italic leading-relaxed">
            "Serving with integrity and excellence."
          </p>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
          {CABINET_MEMBERS.map((member, i) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -3 }}
              className="flex flex-col items-center text-center p-3 rounded-xl border bg-card/40 hover:bg-card transition-all duration-300 group"
            >
              <div className="relative mb-2">
                <Avatar className="h-12 w-12 md:h-14 md:w-14 border border-gold/20 group-hover:border-gold transition-colors shadow-sm">
                  <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold font-serif">
                    {member.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-gold text-gold-foreground p-0.5 rounded-full scale-0 group-hover:scale-100 transition-transform">
                  <Star className="w-2 h-2 fill-gold-foreground" />
                </div>
              </div>
              <h3 className="font-serif text-[13px] font-bold text-foreground leading-tight">{member.name}</h3>
              <p className="mt-1 text-[8px] uppercase tracking-widest font-bold text-primary/60">{member.position}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function WhoWeAre() {
  const values = [
    {
      num: "01",
      title: "Integrity",
      description: "Leading by example with transparency, honesty, and alignment with school values."
    },
    {
      num: "02",
      title: "Representation",
      description: "Providing a robust, democratic platform where every student's voice is welcomed and acted upon."
    },
    {
      num: "03",
      title: "Excellence",
      description: "Striving for the highest standards in student leadership, academic support, and welfare projects."
    }
  ];

  return (
    <section className="bg-muted/30 py-16 md:py-24 relative overflow-hidden border-t border-border/30">
      <div className="absolute top-0 right-0 -mr-20 -mt-20 opacity-5 pointer-events-none">
        <Landmark className="w-64 h-64 text-primary" />
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Editorial Narrative */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6 text-left"
          >
            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] block mb-3">Our Identity</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight leading-tight mb-6">
              Championing Student Welfare & Leadership
            </h2>
            <div className="h-0.5 w-12 bg-gold mb-6" />
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed font-light mb-6">
              The Mengo Senior School Student Council is a democratically elected student government dedicated to serving the student body since the school's foundational years. We bridge the gap between students and administration, advocating for student welfare, organizing key school events, and fostering academic excellence.
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed font-light">
              Under our motto, <strong className="font-semibold text-foreground">"Akwana Akira Ayomba"</strong>, we promote cooperation, respect for human rights, and building resilient leaders for the future.
            </p>
          </motion.div>

          {/* Right Core Pillars */}
          <div className="lg:col-span-6 flex flex-col gap-6 text-left">
            {values.map((v, i) => (
              <motion.div 
                key={v.title}
                initial={{ opacity: 0, x: 25 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex items-start gap-4 p-5 rounded-2xl border border-border/40 bg-card/30 hover:bg-card/70 transition-all duration-300 group"
              >
                <span className="font-serif text-2xl font-black text-gold/40 group-hover:text-gold transition-colors duration-300">
                  {v.num}
                </span>
                <div>
                  <h3 className="font-serif text-base font-bold text-foreground mb-1 leading-tight">
                    {v.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground font-light leading-relaxed">
                    {v.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
