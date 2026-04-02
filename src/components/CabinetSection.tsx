import { Users, Award, Shield } from "lucide-react";
import mengoBadge from "@/assets/mengo-badge.jpg";
import HierarchyTree from "@/components/portal/HierarchyTree";

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
    <section className="py-12 sm:py-20 bg-muted/30 border-t">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">The Student Cabinet</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
            The formal organizational structure and leadership hierarchy of the Mengo Senior School Council.
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-4 sm:p-8 shadow-sm overflow-hidden">
          <HierarchyTree />
        </div>
      </div>
    </section>
  );
}

export function WhoWeAre() {
  return (
    <section className="bg-muted/50 py-12 sm:py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <img src={mengoBadge} alt="Badge" className="mx-auto mb-4 h-16 w-16 rounded-full border-4 border-gold object-cover shadow-lg sm:h-24 sm:w-24" />
          <h2 className="font-serif text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">Who We Are</h2>
          <p className="mt-1 text-xs font-medium text-gold italic sm:text-sm">"Akwana Akira Ayomba"</p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg">
            The Mengo Senior School Student Council represents every student's voice. We bridge the gap
            between students and administration — championing welfare, academics, discipline, and development.
          </p>
        </div>

        <div className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-3 sm:mt-12">
          {[
            { icon: Shield, title: "Integrity", desc: "Leading with honesty and transparency." },
            { icon: Users, title: "Representation", desc: "Every student's voice matters." },
            { icon: Award, title: "Excellence", desc: "Highest standards in service." },
          ].map((v) => (
            <div key={v.title} className="rounded-xl border bg-card p-4 text-center shadow-sm sm:p-6">
              <v.icon className="mx-auto mb-2 h-6 w-6 text-gold sm:h-8 sm:w-8" />
              <h3 className="font-serif text-sm font-bold text-card-foreground sm:text-lg">{v.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
