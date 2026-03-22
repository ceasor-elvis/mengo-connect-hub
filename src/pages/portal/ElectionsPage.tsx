import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Vote, FileText, UserCheck, UserX, Settings2, Download } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface Applicant {
  id: number;
  name: string;
  class: string;
  average: number;
  gender: "male" | "female";
  status: "pending" | "qualified" | "disqualified";
}

const INITIAL_APPLICANTS: Applicant[] = [
  { id: 1, name: "Mugwanya Paul", class: "S.2 South", average: 82, gender: "male", status: "pending" },
  { id: 2, name: "Nalongo Faith", class: "S.2 North", average: 75, gender: "female", status: "pending" },
  { id: 3, name: "Bbosa Martin", class: "S.2 East", average: 68, gender: "male", status: "pending" },
  { id: 4, name: "Nakabugo Diana", class: "S.2 West", average: 91, gender: "female", status: "pending" },
  { id: 5, name: "Wasswa Timothy", class: "S.2 South", average: 64, gender: "male", status: "pending" },
  { id: 6, name: "Kabanda Mercy", class: "S.2 North", average: 78, gender: "female", status: "pending" },
  { id: 7, name: "Okiror Samuel", class: "S.2 East", average: 88, gender: "male", status: "pending" },
  { id: 8, name: "Nalubega Rose", class: "S.2 West", average: 72, gender: "female", status: "pending" },
  { id: 9, name: "Kizza Derrick", class: "S.2 South", average: 80, gender: "male", status: "pending" },
  { id: 10, name: "Namusisi Gloria", class: "S.2 North", average: 85, gender: "female", status: "pending" },
];

export default function ElectionsPage() {
  const [minAverage, setMinAverage] = useState(70);
  const [electionTitle, setElectionTitle] = useState("S.2 Councillors 2026");
  const [applicants, setApplicants] = useState<Applicant[]>(INITIAL_APPLICANTS);
  const [showSettings, setShowSettings] = useState(false);

  const qualified = applicants.filter((a) => a.status === "qualified").length;
  const disqualified = applicants.filter((a) => a.status === "disqualified").length;

  const handleAutoScreen = () => {
    setApplicants((prev) =>
      prev.map((a) => ({
        ...a,
        status: a.average >= minAverage ? "qualified" : "disqualified",
      }))
    );
    toast.success(`Screened all applicants at ${minAverage}% minimum average`);
  };

  const generateBallotPDF = () => {
    const qualifiedApplicants = applicants.filter((a) => a.status === "qualified");
    if (qualifiedApplicants.length === 0) {
      toast.error("No qualified applicants. Run auto-screen first.");
      return;
    }

    const males = qualifiedApplicants.filter((a) => a.gender === "male");
    const females = qualifiedApplicants.filter((a) => a.gender === "female");

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;

    // ── Header ──
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("MENGO SENIOR SCHOOL", pageWidth / 2, y, { align: "center" });
    y += 8;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Kampala, Uganda", pageWidth / 2, y, { align: "center" });
    y += 10;

    // Divider
    doc.setDrawColor(139, 28, 53); // maroon
    doc.setLineWidth(0.8);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Election title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("BALLOT PAPER", pageWidth / 2, y, { align: "center" });
    y += 8;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(electionTitle.toUpperCase(), pageWidth / 2, y, { align: "center" });
    y += 6;

    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text("Tick (✓) ONE candidate in each category", pageWidth / 2, y, { align: "center" });
    doc.setTextColor(0);
    y += 12;

    // ── Helper to draw a category table ──
    const drawCategory = (title: string, candidates: Applicant[], startY: number): number => {
      let cy = startY;

      // Category header
      doc.setFillColor(139, 28, 53); // maroon
      doc.rect(margin, cy, pageWidth - margin * 2, 8, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(255);
      doc.text(title, pageWidth / 2, cy + 5.5, { align: "center" });
      doc.setTextColor(0);
      cy += 10;

      // Table header
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, cy, pageWidth - margin * 2, 7, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("No.", margin + 3, cy + 5);
      doc.text("Candidate Name", margin + 15, cy + 5);
      doc.text("Class", margin + 90, cy + 5);
      doc.text("Tick (✓)", pageWidth - margin - 18, cy + 5);
      cy += 7;

      // Rows
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      candidates.forEach((candidate, idx) => {
        // Alternating row bg
        if (idx % 2 === 1) {
          doc.setFillColor(252, 252, 252);
          doc.rect(margin, cy, pageWidth - margin * 2, 10, "F");
        }

        // Row border
        doc.setDrawColor(220);
        doc.line(margin, cy + 10, pageWidth - margin, cy + 10);

        doc.setTextColor(0);
        doc.text(`${idx + 1}.`, margin + 3, cy + 7);
        doc.text(candidate.name, margin + 15, cy + 7);
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(candidate.class, margin + 90, cy + 7);
        doc.setTextColor(0);
        doc.setFontSize(10);

        // Tick box
        const boxX = pageWidth - margin - 14;
        doc.setDrawColor(139, 28, 53);
        doc.setLineWidth(0.4);
        doc.rect(boxX, cy + 2, 7, 7);

        cy += 10;
      });

      return cy + 8;
    };

    // Draw categories
    if (females.length > 0) {
      y = drawCategory("FEMALE COUNCILLOR", females, y);
    }
    if (males.length > 0) {
      y = drawCategory("MALE COUNCILLOR", males, y);
    }

    // Footer
    y += 5;
    doc.setDrawColor(139, 28, 53);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text("Electoral Commission — Mengo Senior School Student Council", pageWidth / 2, y, { align: "center" });
    y += 5;
    doc.text(`Generated on ${new Date().toLocaleDateString("en-UG", { day: "numeric", month: "long", year: "numeric" })}`, pageWidth / 2, y, { align: "center" });

    // Save
    doc.save(`Ballot_${electionTitle.replace(/\s+/g, "_")}.pdf`);
    toast.success("Ballot paper PDF downloaded!");
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Electoral Commission</h1>
          <p className="mt-1 text-muted-foreground">Manage applications, screening, and ballot generation.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowSettings(!showSettings)}>
            <Settings2 className="mr-2 h-4 w-4" /> Settings
          </Button>
          <Button onClick={generateBallotPDF}>
            <Download className="mr-2 h-4 w-4" /> Generate Ballot
          </Button>
        </div>
      </div>

      {/* ── Settings Panel ── */}
      {showSettings && (
        <Card className="mt-4 border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-primary" /> Screening & Ballot Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="minAvg">Minimum Screening Average (%)</Label>
              <Input
                id="minAvg"
                type="number"
                min={0}
                max={100}
                value={minAverage}
                onChange={(e) => setMinAverage(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Applicants below this average will be disqualified during auto-screen.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="electionTitle">Election / Voting Title</Label>
              <Input
                id="electionTitle"
                value={electionTitle}
                onChange={(e) => setElectionTitle(e.target.value)}
                placeholder="e.g. S.2 Councillors 2026"
              />
              <p className="text-xs text-muted-foreground">
                This title appears on the generated ballot paper.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Stats ── */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-card-foreground">{applicants.length}</p>
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

      {/* ── Applicants Table ── */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Vote className="h-5 w-5 text-primary" />
              Applicants (Min. Average: {minAverage}%)
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleAutoScreen}>
              Auto-Screen
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left font-medium text-muted-foreground">Name</th>
                  <th className="py-2 text-left font-medium text-muted-foreground">Class</th>
                  <th className="py-2 text-left font-medium text-muted-foreground">Gender</th>
                  <th className="py-2 text-left font-medium text-muted-foreground">Average</th>
                  <th className="py-2 text-left font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {applicants.map((a) => (
                  <tr key={a.id} className="border-b last:border-0">
                    <td className="py-2.5 font-medium text-card-foreground">{a.name}</td>
                    <td className="py-2.5 text-muted-foreground">{a.class}</td>
                    <td className="py-2.5 capitalize text-muted-foreground">{a.gender}</td>
                    <td className="py-2.5">
                      <span className={`font-bold ${a.average >= minAverage ? "text-primary" : "text-destructive"}`}>
                        {a.average}%
                      </span>
                    </td>
                    <td className="py-2.5">
                      {a.status === "pending" ? (
                        <Badge variant="secondary">pending</Badge>
                      ) : (
                        <Badge variant={a.status === "qualified" ? "default" : "destructive"} className="gap-1">
                          {a.status === "qualified" ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                          {a.status}
                        </Badge>
                      )}
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
