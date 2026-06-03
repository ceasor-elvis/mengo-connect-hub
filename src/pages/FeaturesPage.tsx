import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ShieldCheck, Landmark, Vote, Users, HelpCircle, GraduationCap } from "lucide-react";

export default function FeaturesPage() {
  const portalFeatures = [
    {
      title: "Student Voice",
      icon: MessageSquare,
      description: "Direct democratic pipeline. Students can submit concerns, pitch wellness proposals, track petition statuses, and receive feedback from the Cabinet.",
    },
    {
      title: "Financial Audits & Accountability",
      icon: ShieldCheck,
      description: "Live financial summary tracking council incomes, student subscriptions, general expenses, and requisitions approved by the Chairperson and Patron.",
    },
    {
      title: "Democratic Elections",
      icon: Vote,
      description: "Electoral Commission screening hub. Evaluates student leader qualifications, registers stream candidates, and secures results with digital locks.",
    },
    {
      title: "Weekly Duty Rotas",
      icon: Users,
      description: "Roster assignments for assemblies, wellness checkups, disciplinary representation, and general stream inspections.",
    }
  ];

  const cabinetRoles = [
    { title: "Chairperson", role: "Executive Head", desc: "Coordinates all council affairs, chairs executive meetings, and represents the student body on the Board of Governors." },
    { title: "Vice Chairperson", role: "Deputy Executive", desc: "Assists the Chairperson, oversees committee reviews, and directs general welfare campaigns." },
    { title: "Speaker & Deputy", role: "Legislative Heads", desc: "Modera debates, ensures order, and steers voting during general council assemblies." },
    { title: "General Secretary", role: "Operations & Admin", desc: "Keeps records, handles correspondences, and manages termly program scheduling." },
    { title: "Secretary for Finance", role: "Treasury", desc: "Coordinates termly budgets, oversees income entries, and audits requisition lists." },
    { title: "Secretary for Welfare", role: "Student Life", desc: "Monitors dormitory facilities, food sanitation, and student assistance programs." },
    { title: "Secretary for Health", role: "Wellness", desc: "Coordinates wellness checks, handles sickbay partnerships, and conducts health seminars." },
    { title: "Special Secretaries", role: "Diversity & Inclusion", desc: "Dedicated roles for Women Affairs, PWDs (Students with Disabilities), and Publicity." },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <section className="bg-[#130709] text-white py-16 md:py-24 relative overflow-hidden border-b border-white/5 text-center">
        <div className="absolute inset-0 opacity-[0.03] bg-pattern pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 container mx-auto px-6 max-w-3xl">
          <Badge variant="outline" className="border-gold/30 text-gold mb-3 bg-gold/5 uppercase tracking-widest text-[9px] py-1 px-3">
            Portal Capabilities
          </Badge>
          <h1 className="font-serif text-3xl sm:text-5xl font-black tracking-tight mb-4 text-white">
            Features & Council Mandate
          </h1>
          <p className="text-white/60 text-sm sm:text-base font-light leading-relaxed max-w-xl mx-auto">
            Discover the digital workflows driving transparency and representation at Mengo Senior School, alongside the constitutional roles of our student cabinet.
          </p>
        </div>
      </section>

      {/* ── SECTION 1: PORTAL CAPABILITIES ──────────────────────────── */}
      <section className="container mx-auto px-6 py-16">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] block mb-2">Operations</span>
          <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            A Transparent Digital Government
          </h2>
          <div className="h-0.5 w-12 bg-gold mx-auto mt-4" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
          {portalFeatures.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="p-6 rounded-2xl border border-border/50 bg-card/30 hover:bg-card/70 transition-all duration-300 flex gap-4 text-left"
            >
              <div className="p-3 rounded-xl bg-primary/5 text-primary h-fit">
                <f.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-base sm:text-lg font-bold text-foreground mb-2">
                  {f.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground font-light leading-relaxed">
                  {f.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── SECTION 2: CABINET PORTFOLIOS ───────────────────────────── */}
      <section className="bg-muted/20 border-y border-border/40 py-16 md:py-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-24 -mt-24 opacity-5 pointer-events-none">
          <Landmark className="w-72 h-72 text-primary" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] block mb-2">Constitution</span>
            <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              Executive Cabinet Portfolios
            </h2>
            <p className="text-sm text-muted-foreground font-light mt-2">
              Every secretary oversees key facets of school operations, ensuring standard student code compliance.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto">
            {cabinetRoles.map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="p-5 rounded-xl border border-border/40 bg-card flex flex-col justify-between text-left group hover:border-gold/30 transition-all duration-300"
              >
                <div>
                  <h3 className="font-serif text-base font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                    {c.title}
                  </h3>
                  <span className="text-[8px] font-bold uppercase tracking-widest text-primary/80 mt-1 block">
                    {c.role}
                  </span>
                  <p className="text-xs text-muted-foreground font-light leading-relaxed mt-3">
                    {c.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: FAQ / MANDATE ────────────────────────────────── */}
      <section className="container mx-auto px-6 py-16">
        <div className="max-w-3xl mx-auto border border-border/40 bg-card/25 rounded-2xl p-6 sm:p-8 text-left">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gold/10 text-gold h-fit">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-foreground">Frequently Asked Questions</h3>
          </div>
          <div className="space-y-6 text-sm">
            <div>
              <h4 className="font-bold text-foreground mb-1">How can I submit feedback?</h4>
              <p className="text-muted-foreground font-light leading-relaxed">
                Log into the student portal using your student credentials, or navigate to the "Student Voice" tab to submit issues anonymously if necessary.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-foreground mb-1">Who votes in general elections?</h4>
              <p className="text-muted-foreground font-light leading-relaxed">
                Every registered Mengo Senior School student is entitled to cast their vote for stream representative candidates and executive cabinet candidates.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
