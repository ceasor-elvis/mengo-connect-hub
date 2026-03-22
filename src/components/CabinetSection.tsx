import { Users, Award, Shield } from "lucide-react";
import mengoBadge from "@/assets/mengo-badge.jpg";

const CABINET_MEMBERS = [
  { name: "Ssekandi Brian", position: "Chairperson", initials: "SB" },
  { name: "Nakato Grace", position: "Vice Chairperson", initials: "NG" },
  { name: "Lwanga David", position: "Speaker", initials: "LD" },
  { name: "Namutebi Sarah", position: "Deputy Speaker", initials: "NS" },
  { name: "Kato Emmanuel", position: "General Secretary", initials: "KE" },
  { name: "Achieng Patricia", position: "Asst. General Secretary", initials: "AP" },
  { name: "Mugisha Ronald", position: "Secretary Finance", initials: "MR" },
  { name: "Nambi Irene", position: "Secretary Welfare", initials: "NI" },
  { name: "Okello Joseph", position: "Secretary Health", initials: "OJ" },
  { name: "Babirye Esther", position: "Secretary Women Affairs", initials: "BE" },
  { name: "Ssenoga Peter", position: "Secretary Publicity", initials: "SP" },
  { name: "Tumwine Alex", position: "Secretary PWDs", initials: "TA" },
  { name: "Mr. Kasozi John", position: "Patron", initials: "KJ" },
  { name: "Mukasa Henry", position: "Electoral Commission", initials: "MH" },
];

export function CabinetGrid() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-7 w-7 text-primary" />
          </div>
          <h2 className="font-serif text-3xl font-bold text-foreground md:text-4xl">
            The Cabinet
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Meet the leaders driving positive change across Mengo Senior School.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {CABINET_MEMBERS.map((m) => (
            <div
              key={m.position}
              className="group flex flex-col items-center rounded-xl border bg-card p-4 text-center shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
            >
              <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                {m.initials}
              </div>
              <p className="text-sm font-semibold text-card-foreground">{m.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{m.position}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function WhoWeAre() {
  return (
    <section className="bg-muted/50 py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <img src={mengoBadge} alt="Mengo Senior School Badge" className="mx-auto mb-6 h-24 w-24 rounded-full border-4 border-gold object-cover shadow-lg" />
          <h2 className="font-serif text-3xl font-bold text-foreground md:text-4xl">
            Who We Are
          </h2>
          <p className="mt-2 text-sm font-medium text-gold italic">"Akwana Akira Ayomba"</p>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            The Mengo Senior School Student Council is the elected body representing the voice of every
            student. We bridge the gap between the student body and the school administration, championing
            welfare, academic excellence, discipline, and holistic development. Our council is composed of
            14 dedicated officers who serve with integrity, accountability, and a passion for positive change.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-3">
          {[
            { icon: Shield, title: "Integrity", desc: "Leading by example with honesty and transparency in all we do." },
            { icon: Users, title: "Representation", desc: "Every student's voice matters. We listen, advocate, and act." },
            { icon: Award, title: "Excellence", desc: "Striving for the highest standards in academics and service." },
          ].map((v) => (
            <div key={v.title} className="rounded-xl border bg-card p-6 text-center shadow-sm">
              <v.icon className="mx-auto mb-3 h-8 w-8 text-gold" />
              <h3 className="font-serif text-lg font-bold text-card-foreground">{v.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
