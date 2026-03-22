import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Download, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const DUMMY_DOCS = [
  { id: 1, title: "Council Constitution 2025/2026", category: "Constitution", uploaded_by: "Kato Emmanuel", date: "Jan 15, 2026" },
  { id: 2, title: "Term 1 Meeting Minutes", category: "Minutes", uploaded_by: "Achieng Patricia", date: "Feb 10, 2026" },
  { id: 3, title: "Budget Proposal Term 2", category: "Finance", uploaded_by: "Mugisha Ronald", date: "Feb 28, 2026" },
  { id: 4, title: "Student Welfare Report", category: "Reports", uploaded_by: "Nambi Irene", date: "Mar 5, 2026" },
  { id: 5, title: "Health Week Plan", category: "Plans", uploaded_by: "Okello Joseph", date: "Mar 8, 2026" },
  { id: 6, title: "Publicity Calendar Term 2", category: "Plans", uploaded_by: "Ssenoga Peter", date: "Mar 12, 2026" },
  { id: 7, title: "PWD Accessibility Audit", category: "Reports", uploaded_by: "Tumwine Alex", date: "Mar 14, 2026" },
  { id: 8, title: "Women Affairs Programme", category: "Plans", uploaded_by: "Babirye Esther", date: "Mar 18, 2026" },
];

const catColor = (c: string) => {
  const map: Record<string, string> = { Constitution: "default", Minutes: "secondary", Finance: "outline", Reports: "default", Plans: "secondary" };
  return (map[c] || "outline") as any;
};

export default function DocumentsPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Documents Archive</h1>
          <p className="mt-1 text-muted-foreground">All council documents, minutes, and reports.</p>
        </div>
        <Button>
          <Upload className="mr-2 h-4 w-4" /> Upload
        </Button>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search documents..." className="pl-9" />
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {DUMMY_DOCS.map((doc) => (
          <Card key={doc.id} className="transition-all hover:shadow-sm">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-card-foreground">{doc.title}</p>
                  <p className="text-xs text-muted-foreground">{doc.uploaded_by} • {doc.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={catColor(doc.category)}>{doc.category}</Badge>
                <Button variant="ghost" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
