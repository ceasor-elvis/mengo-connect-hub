import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus } from "lucide-react";

const DUMMY_PROGRAMMES = [
  { id: 1, title: "Inter-House Sports Gala", date: "Apr 5, 2026", description: "Annual sports competition — athletics, football, netball, volleyball.", created_by: "Kato Emmanuel" },
  { id: 2, title: "Career Guidance Day", date: "Apr 12, 2026", description: "Professionals share career insights with S.4 and S.6 students.", created_by: "Ssenoga Peter" },
  { id: 3, title: "Tree Planting Exercise", date: "Apr 19, 2026", description: "200 trees to be planted around the school compound.", created_by: "Kato Emmanuel" },
  { id: 4, title: "Cultural Gala Night", date: "May 3, 2026", description: "Celebrating Uganda's cultures through music, dance, and cuisine.", created_by: "Ssenoga Peter" },
  { id: 5, title: "Debate Championship", date: "May 10, 2026", description: "Inter-school debate finals — top 4 central region schools.", created_by: "Lwanga David" },
  { id: 6, title: "Council Open Day", date: "May 17, 2026", description: "Q&A sessions, suggestion boxes, feedback collection.", created_by: "Kato Emmanuel" },
];

export default function ProgrammesPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-serif text-xl font-bold text-foreground sm:text-2xl">Programmes & Events</h1>
          <p className="text-sm text-muted-foreground">Upcoming and past council programmes.</p>
        </div>
        <Button size="sm"><Plus className="mr-1 h-4 w-4" /> Add Programme</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DUMMY_PROGRAMMES.map((prog) => (
          <Card key={prog.id} className="transition-all hover:shadow-md">
            <CardContent className="p-3 sm:p-4">
              <h3 className="text-sm font-semibold">{prog.title}</h3>
              <div className="flex items-center gap-1.5 text-xs text-gold font-medium mt-1">
                <Calendar className="h-3 w-3" /> {prog.date}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{prog.description}</p>
              <p className="text-[10px] text-muted-foreground mt-2">By <span className="font-medium">{prog.created_by}</span></p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
