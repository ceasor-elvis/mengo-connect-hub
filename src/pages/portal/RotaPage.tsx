import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

const DUMMY_ROTA = [
  {
    week: "Week 11 (Mar 16–22)",
    duties: [
      { day: "Mon", task: "Assembly Coordination", assigned: "Ssekandi Brian" },
      { day: "Mon", task: "Dining Supervision", assigned: "Nambi Irene" },
      { day: "Tue", task: "Compound Cleanliness", assigned: "Okello Joseph" },
      { day: "Tue", task: "Library Oversight", assigned: "Achieng Patricia" },
      { day: "Wed", task: "Sports Inspection", assigned: "Lwanga David" },
      { day: "Wed", task: "Sick Bay Visit", assigned: "Okello Joseph" },
      { day: "Thu", task: "Dormitory Inspection", assigned: "Babirye Esther" },
      { day: "Thu", task: "Assembly Address", assigned: "Nakato Grace" },
      { day: "Fri", task: "Weekly Report", assigned: "Kato Emmanuel" },
      { day: "Fri", task: "Suggestion Box", assigned: "Achieng Patricia" },
    ],
  },
  {
    week: "Week 12 (Mar 23–29)",
    duties: [
      { day: "Mon", task: "Assembly Coordination", assigned: "Nakato Grace" },
      { day: "Mon", task: "Dining Supervision", assigned: "Mugisha Ronald" },
      { day: "Tue", task: "Compound Cleanliness", assigned: "Tumwine Alex" },
      { day: "Tue", task: "Library Oversight", assigned: "Kato Emmanuel" },
      { day: "Wed", task: "Sports Inspection", assigned: "Ssenoga Peter" },
      { day: "Thu", task: "Dormitory Inspection", assigned: "Nambi Irene" },
      { day: "Fri", task: "Weekly Report", assigned: "Achieng Patricia" },
    ],
  },
];

const dayVariant: Record<string, "default" | "secondary" | "outline"> = {
  Mon: "default", Tue: "secondary", Wed: "outline", Thu: "default", Fri: "secondary",
};

export default function RotaPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-serif text-xl font-bold text-foreground sm:text-2xl">Working Rota</h1>
        <p className="text-sm text-muted-foreground">Weekly duty assignments.</p>
      </div>

      {DUMMY_ROTA.map((rota) => (
        <Card key={rota.week}>
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-primary" /> {rota.week}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 sm:px-6">
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm min-w-[360px]">
                <thead>
                  <tr className="border-b">
                    <th className="py-1.5 px-2 text-left font-medium text-muted-foreground w-14">Day</th>
                    <th className="py-1.5 px-2 text-left font-medium text-muted-foreground">Task</th>
                    <th className="py-1.5 px-2 text-left font-medium text-muted-foreground">Assigned</th>
                  </tr>
                </thead>
                <tbody>
                  {rota.duties.map((d, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-1.5 px-2">
                        <Badge variant={dayVariant[d.day] || "outline"} className="text-[10px]">{d.day}</Badge>
                      </td>
                      <td className="py-1.5 px-2">{d.task}</td>
                      <td className="py-1.5 px-2 font-medium">{d.assigned}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
