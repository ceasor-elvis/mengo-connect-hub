import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Vote, UserCheck, UserX, Settings2, Download } from "lucide-react";
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

  const toggleStatus = (id: number) => {
    setApplicants((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status: a.status === "qualified" ? "disqualified" : "qualified" }
          : a
      )
    );
  };

  const generateBallotPDF = () => {
    const qualifiedApplicants = applicants.filter((a) => a.status === "qualified");
    if (qualifiedApplicants.length === 0) {
      toast.error("No qualified applicants. Run auto-screen first.");
      return;
    }

    const males = qualifiedApplicants.filter((a) => a.gender === "male");
    const females = qualifiedApplicants.filter((a) => a.gender === "female");

    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 15;
      let y = 15;

      // ── School heading ──
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("MENGO SENIOR SCHOOL", pageW / 2, y, { align: "center" });
      y += 7;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Kampala, Uganda", pageW / 2, y, { align: "center" });
      y += 4;
      doc.setFontSize(9);
      doc.text('"Akwana Akira Ayomba"', pageW / 2, y, { align: "center" });
      y += 6;

      // Divider line
      doc.setDrawColor(128, 0, 32);
      doc.setLineWidth(1);
      doc.line(margin, y, pageW - margin, y);
      y += 8;

      // ── Ballot title ──
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("OFFICIAL BALLOT PAPER", pageW / 2, y, { align: "center" });
      y += 7;
      doc.setFontSize(13);
      doc.text(electionTitle.toUpperCase(), pageW / 2, y, { align: "center" });
      y += 6;

      // Instruction
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(80);
      doc.text("Instructions: Tick (\u2713) ONE candidate in each category.", pageW / 2, y, { align: "center" });
      doc.setTextColor(0);
      y += 10;

      // ── Draw category ──
      const drawCategory = (title: string, candidates: Applicant[], startY: number): number => {
        let cy = startY;

        // Check for page overflow
        if (cy > 250) {
          doc.addPage();
          cy = 20;
        }

        // Category header bar
        doc.setFillColor(128, 0, 32);
        doc.rect(margin, cy, pageW - margin * 2, 9, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(255, 255, 255);
        doc.text(title, pageW / 2, cy + 6.5, { align: "center" });
        doc.setTextColor(0);
        cy += 11;

        // Table column headers
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, cy, pageW - margin * 2, 7, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text("No.", margin + 4, cy + 5);
        doc.text("Candidate Name", margin + 18, cy + 5);
        doc.text("Class", margin + 100, cy + 5);
        doc.text("Tick", pageW - margin - 12, cy + 5);
        cy += 8;

        // Candidate rows
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        candidates.forEach((c, idx) => {
          if (cy > 270) { doc.addPage(); cy = 20; }

          // Alternating background
          if (idx % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(margin, cy, pageW - margin * 2, 10, "F");
          }

          // Row bottom border
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.3);
          doc.line(margin, cy + 10, pageW - margin, cy + 10);

          doc.setTextColor(0);
          doc.text(`${idx + 1}.`, margin + 4, cy + 7);
          doc.setFont("helvetica", "bold");
          doc.text(c.name.toUpperCase(), margin + 18, cy + 7);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(100);
          doc.text(c.class, margin + 100, cy + 7);
          doc.setTextColor(0);
          doc.setFontSize(10);

          // Tick box
          const boxX = pageW - margin - 14;
          doc.setDrawColor(128, 0, 32);
          doc.setLineWidth(0.5);
          doc.rect(boxX, cy + 2, 7, 7);

          cy += 10;
        });

        return cy + 6;
      };

      // Draw both categories
      if (females.length > 0) {
        y = drawCategory("FEMALE COUNCILLOR", females, y);
      }
      if (males.length > 0) {
        y = drawCategory("MALE COUNCILLOR", males, y);
      }

      // ── Footer ──
      y += 4;
      doc.setDrawColor(128, 0, 32);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageW - margin, y);
      y += 6;
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text("Electoral Commission \u2014 Mengo Senior School Student Council", pageW / 2, y, { align: "center" });
      y += 4;
      const dateStr = new Date().toLocaleDateString("en-UG", { day: "numeric", month: "long", year: "numeric" });
      doc.text(`Generated on ${dateStr}`, pageW / 2, y, { align: "center" });

      // Save PDF
      const filename = `Ballot_${electionTitle.replace(/\s+/g, "_")}.pdf`;
      doc.save(filename);
      toast.success("Ballot paper PDF downloaded!");
    } catch (err: any) {
      console.error("PDF generation error:", err);
      toast.error("Failed to generate PDF: " + (err.message || "Unknown error"));
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Electoral Commission</h1>
          <p className="mt-1 text-muted-foreground">Manage applications, screening & ballot generation.</p>
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

      {/* Settings panel */}
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
              <Input id="minAvg" type="number" min={0} max={100}
                value={minAverage} onChange={(e) => setMinAverage(Number(e.target.value))} />
              <p className="text-xs text-muted-foreground">
                Applicants below this average will be disqualified during auto-screen.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="electionTitle">Election / Voting Title</Label>
              <Input id="electionTitle" value={electionTitle}
                onChange={(e) => setElectionTitle(e.target.value)}
                placeholder="e.g. S.2 Councillors 2026" />
              <p className="text-xs text-muted-foreground">
                This title appears on the generated ballot paper heading.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4 text-center">
          <p className="text-3xl font-bold text-card-foreground">{applicants.length}</p>
          <p className="text-xs text-muted-foreground">Total Applicants</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-3xl font-bold text-primary">{qualified}</p>
          <p className="text-xs text-muted-foreground">Qualified</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-3xl font-bold text-destructive">{disqualified}</p>
          <p className="text-xs text-muted-foreground">Disqualified</p>
        </CardContent></Card>
      </div>

      {/* Applicants table */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Vote className="h-5 w-5 text-primary" />
              Applicants (Min: {minAverage}%)
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleAutoScreen}>
                Auto-Screen
              </Button>
              <Button size="sm" onClick={generateBallotPDF}>
                <Download className="mr-1 h-3 w-3" /> Ballot PDF
              </Button>
            </div>
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
                  <th className="py-2 text-left font-medium text-muted-foreground">Action</th>
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
                    <td className="py-2.5">
                      {a.status !== "pending" && (
                        <Button variant="ghost" size="sm" onClick={() => toggleStatus(a.id)}>
                          {a.status === "qualified" ? "Disqualify" : "Qualify"}
                        </Button>
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
