import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Plus } from "lucide-react";

const DUMMY_PROGRAMMES = [
  { id: 1, title: "Inter-House Sports Gala", date: "Apr 5, 2026", description: "Annual sports competition between all four houses. Events include athletics, football, netball, and volleyball.", created_by: "Kato Emmanuel" },
  { id: 2, title: "Career Guidance Day", date: "Apr 12, 2026", description: "Professionals from various fields will share career insights with S.4 and S.6 students.", created_by: "Ssenoga Peter" },
  { id: 3, title: "Tree Planting Exercise", date: "Apr 19, 2026", description: "Environmental conservation activity. 200 trees to be planted around the school compound.", created_by: "Kato Emmanuel" },
  { id: 4, title: "Cultural Gala Night", date: "May 3, 2026", description: "Celebrating Uganda's diverse cultures through music, dance, drama, and traditional cuisine.", created_by: "Ssenoga Peter" },
  { id: 5, title: "Debate Championship Finals", date: "May 10, 2026", description: "Inter-school debate finals featuring top 4 schools from the central region.", created_by: "Lwanga David" },
  { id: 6, title: "Council Open Day", date: "May 17, 2026", description: "Students interact directly with council members. Q&A sessions, suggestion boxes, and feedback collection.", created_by: "Kato Emmanuel" },
];

export default function ProgrammesPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Programmes & Events</h1>
          <p className="mt-1 text-muted-foreground">Upcoming and past council programmes.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Programme
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DUMMY_PROGRAMMES.map((prog) => (
          <Card key={prog.id} className="transition-all hover:shadow-md hover:-translate-y-0.5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{prog.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-gold font-medium mb-2">
                <Calendar className="h-4 w-4" />
                {prog.date}
              </div>
              <p className="text-sm text-muted-foreground">{prog.description}</p>
              <p className="mt-3 text-xs text-muted-foreground">By <span className="font-medium text-card-foreground">{prog.created_by}</span></p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
