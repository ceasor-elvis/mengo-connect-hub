import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

const DUMMY_ROTA = [
  {
    week: "Week 11 (Mar 16–22, 2026)",
    duties: [
      { day: "Monday", task: "Morning Assembly Coordination", assigned: "Ssekandi Brian" },
      { day: "Monday", task: "Dining Hall Supervision", assigned: "Nambi Irene" },
      { day: "Tuesday", task: "Compound Cleanliness Check", assigned: "Okello Joseph" },
      { day: "Tuesday", task: "Library Oversight", assigned: "Achieng Patricia" },
      { day: "Wednesday", task: "Sports Grounds Inspection", assigned: "Lwanga David" },
      { day: "Wednesday", task: "Sick Bay Visit", assigned: "Okello Joseph" },
      { day: "Thursday", task: "Dormitory Inspection", assigned: "Babirye Esther" },
      { day: "Thursday", task: "Assembly Address", assigned: "Nakato Grace" },
      { day: "Friday", task: "Weekly Report Compilation", assigned: "Kato Emmanuel" },
      { day: "Friday", task: "Suggestion Box Collection", assigned: "Achieng Patricia" },
    ],
  },
  {
    week: "Week 12 (Mar 23–29, 2026)",
    duties: [
      { day: "Monday", task: "Morning Assembly Coordination", assigned: "Nakato Grace" },
      { day: "Monday", task: "Dining Hall Supervision", assigned: "Mugisha Ronald" },
      { day: "Tuesday", task: "Compound Cleanliness Check", assigned: "Tumwine Alex" },
      { day: "Tuesday", task: "Library Oversight", assigned: "Kato Emmanuel" },
      { day: "Wednesday", task: "Sports Grounds Inspection", assigned: "Ssenoga Peter" },
      { day: "Thursday", task: "Dormitory Inspection", assigned: "Nambi Irene" },
      { day: "Friday", task: "Weekly Report Compilation", assigned: "Achieng Patricia" },
    ],
  },
];

const dayColors: Record<string, string> = {
  Monday: "default",
  Tuesday: "secondary",
  Wednesday: "outline",
  Thursday: "default",
  Friday: "secondary",
};

export default function RotaPage() {
  return (
    <div>
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Working Rota</h1>
        <p className="mt-1 text-muted-foreground">Weekly duty assignments for all councillors.</p>
      </div>

      <div className="mt-6 space-y-6">
        {DUMMY_ROTA.map((rota) => (
          <Card key={rota.week}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-5 w-5 text-primary" />
                {rota.week}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 text-left font-medium text-muted-foreground">Day</th>
                      <th className="py-2 text-left font-medium text-muted-foreground">Task</th>
                      <th className="py-2 text-left font-medium text-muted-foreground">Assigned To</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rota.duties.map((d, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2.5">
                          <Badge variant={(dayColors[d.day] as any) || "outline"}>{d.day}</Badge>
                        </td>
                        <td className="py-2.5 text-card-foreground">{d.task}</td>
                        <td className="py-2.5 font-medium text-card-foreground">{d.assigned}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
