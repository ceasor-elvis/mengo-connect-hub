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
      title: "Integrity",
      description: "Leading with honesty.",
      icon: Shield,
      color: "border-primary/20 bg-primary/5"
    },
    {
      title: "Representation",
      description: "Every voice heard.",
      icon: Users,
      color: "border-gold/20 bg-gold/5"
    },
    {
      title: "Excellence",
      description: "Highest standards.",
      icon: Award,
      color: "border-primary/20 bg-primary/5"
    }
  ];

  return (
    <section className="bg-muted/50 py-12 md:py-16 relative overflow-hidden">
      <div className="absolute top-0 right-0 -mr-12 -mt-12 opacity-5 pointer-events-none">
        <Landmark className="w-48 h-48 text-primary" />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-4xl text-center mb-8"
        >
          <img src={mengoBadge} alt="Badge" className="mx-auto mb-4 h-16 w-16 rounded-full border-2 border-gold object-cover shadow-lg sm:h-20 sm:w-20" />
          <Badge className="bg-gold/10 text-gold border-none mb-2 text-[10px]">Mengo Senior School</Badge>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-primary mb-3">Who We Are</h2>
          <p className="mt-0.5 text-[8px] font-bold text-gold uppercase tracking-[0.2em] font-serif mb-4">"Akwana Akira Ayomba"</p>
          <p className="text-sm leading-relaxed text-muted-foreground md:text-base font-light max-w-xl mx-auto">
            The Mengo Senior School Student Council represents every student's voice, championing excellence.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto">
          {values.map((v, i) => (
            <motion.div 
              key={v.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-2xl border ${v.color} p-6 text-center backdrop-blur-sm group hover:scale-[1.02] transition-transform duration-500`}
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-white/50 shadow-inner group-hover:bg-white transition-colors duration-500">
                <v.icon className="h-5 h-5 text-gold" />
              </div>
              <h3 className="font-serif text-lg font-bold text-foreground mb-2">{v.title}</h3>
              <p className="text-[13px] text-muted-foreground italic leading-tight">"{v.description}"</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
