import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Vote, FileText, UserCheck, UserX } from "lucide-react";

const DUMMY_APPLICANTS = [
  { id: 1, name: "Mugwanya Paul", class: "S.5 South", average: 82, status: "qualified" },
  { id: 2, name: "Nalongo Faith", class: "S.5 North", average: 75, status: "qualified" },
  { id: 3, name: "Bbosa Martin", class: "S.5 East", average: 68, status: "disqualified" },
  { id: 4, name: "Nakabugo Diana", class: "S.5 West", average: 91, status: "qualified" },
  { id: 5, name: "Wasswa Timothy", class: "S.5 South", average: 64, status: "disqualified" },
  { id: 6, name: "Kabanda Mercy", class: "S.5 North", average: 78, status: "qualified" },
  { id: 7, name: "Okiror Samuel", class: "S.5 East", average: 88, status: "qualified" },
  { id: 8, name: "Nalubega Rose", class: "S.5 West", average: 72, status: "qualified" },
];

export default function ElectionsPage() {
  const qualified = DUMMY_APPLICANTS.filter(a => a.status === "qualified").length;
  const disqualified = DUMMY_APPLICANTS.filter(a => a.status === "disqualified").length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Electoral Commission</h1>
          <p className="mt-1 text-muted-foreground">Manage applications, screening, and ballot generation.</p>
        </div>
        <Button>
          <FileText className="mr-2 h-4 w-4" /> Generate Ballot
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-card-foreground">{DUMMY_APPLICANTS.length}</p>
            <p className="text-xs text-muted-foreground">Total Applicants</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary">{qualified}</p>
            <p className="text-xs text-muted-foreground">Qualified</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-destructive">{disqualified}</p>
            <p className="text-xs text-muted-foreground">Disqualified</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Vote className="h-5 w-5 text-primary" />
              Applicants (Min. Average: 70%)
            </CardTitle>
            <Button variant="outline" size="sm">Auto-Screen</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left font-medium text-muted-foreground">Name</th>
                  <th className="py-2 text-left font-medium text-muted-foreground">Class</th>
                  <th className="py-2 text-left font-medium text-muted-foreground">Average</th>
                  <th className="py-2 text-left font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {DUMMY_APPLICANTS.map((a) => (
                  <tr key={a.id} className="border-b last:border-0">
                    <td className="py-2.5 font-medium text-card-foreground">{a.name}</td>
                    <td className="py-2.5 text-muted-foreground">{a.class}</td>
                    <td className="py-2.5">
                      <span className={`font-bold ${a.average >= 70 ? "text-primary" : "text-destructive"}`}>
                        {a.average}%
                      </span>
                    </td>
                    <td className="py-2.5">
                      <Badge variant={a.status === "qualified" ? "default" : "destructive"} className="gap-1">
                        {a.status === "qualified" ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                        {a.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
