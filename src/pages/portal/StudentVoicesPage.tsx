import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, CheckCircle, Clock, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const DUMMY_VOICES = [
  { id: 1, title: "Extend Library Opening Hours", category: "Ideas", description: "The library should remain open until 9pm during exam periods to give students more study time.", status: "pending", submitted_by: "Anonymous", submitted_class: "S.4 East", date: "Mar 20, 2026" },
  { id: 2, title: "Broken Desks in S.3 East", category: "Complaints", description: "At least 8 desks in S.3 East are broken and unusable. Students are forced to share.", status: "approved", submitted_by: "Mutesi Alice", submitted_class: "S.3 East", date: "Mar 19, 2026" },
  { id: 3, title: "Science Fair Proposal", category: "Projects", description: "Organize a school-wide science fair where students showcase experiments and innovations.", status: "pending", submitted_by: "Kamya Isaac", submitted_class: "S.5 North", date: "Mar 18, 2026" },
  { id: 4, title: "Water Supply Issues in Girls' Dormitory", category: "Complaints", description: "The water tank for the girls' dormitory runs out by 6pm daily. Need a larger tank or backup.", status: "approved", submitted_by: "Nakanwagi Prossy", submitted_class: "S.4 West", date: "Mar 17, 2026" },
  { id: 5, title: "Music Club Revival", category: "Ideas", description: "The music club has been dormant. We should get instruments and a patron to restart it.", status: "rejected", submitted_by: "Anonymous", submitted_class: null, date: "Mar 16, 2026" },
  { id: 6, title: "Mentorship Programme for S.1", category: "Projects", description: "Senior students should mentor new S.1 students to help them adjust to boarding school life.", status: "pending", submitted_by: "Ouma Brian", submitted_class: "S.6 Arts", date: "Mar 15, 2026" },
];

const statusVariant = (s: string) => s === "approved" ? "default" : s === "rejected" ? "destructive" : "secondary";

export default function StudentVoicesPage() {
  return (
    <div>
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Student Voices</h1>
        <p className="mt-1 text-muted-foreground">Review and evaluate submissions from the student body.</p>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search submissions..." className="pl-9" />
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {DUMMY_VOICES.map((v) => (
          <Card key={v.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{v.category}</Badge>
                  <CardTitle className="text-base">{v.title}</CardTitle>
                </div>
                <Badge variant={statusVariant(v.status)}>
                  {v.status === "approved" ? <CheckCircle className="mr-1 h-3 w-3" /> : <Clock className="mr-1 h-3 w-3" />}
                  {v.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{v.description}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                By {v.submitted_by}{v.submitted_class ? ` (${v.submitted_class})` : ""} • {v.date}
              </p>
              {v.status === "pending" && (
                <div className="mt-3 flex gap-2">
                  <Button size="sm">Approve</Button>
                  <Button size="sm" variant="outline">Reject</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
