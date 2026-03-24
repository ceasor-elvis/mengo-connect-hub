import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Vote, UserCheck, UserX, Settings2, Download, Plus, Users, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";

interface Applicant {
  id: string;
  applicant_name: string;
  class: string;
  stream?: string;
  average_score: number;
  gender: string;
  status: string;
}

const ROLE_LABELS: Record<string, string> = {
  patron: "Patron", chairperson: "Chairperson", vice_chairperson: "Vice Chairperson",
  speaker: "Speaker", deputy_speaker: "Deputy Speaker", general_secretary: "General Secretary",
  assistant_general_secretary: "Asst. Gen. Secretary", secretary_finance: "Secretary Finance",
  secretary_welfare: "Secretary Welfare", secretary_health: "Secretary Health",
  secretary_women_affairs: "Secretary Women Affairs", secretary_publicity: "Secretary Publicity",
  secretary_pwd: "Secretary PWD", electoral_commission: "Electoral Commission",
};

export default function ElectionsPage() {
  const { user, roles, hasAnyRole } = useAuth();
  const isTopHead = hasAnyRole(["patron", "chairperson", "speaker", "electoral_commission"]);

  const [minAverage, setMinAverage] = useState(70);
  const [electionTitle, setElectionTitle] = useState("S.2 Councillors 2026");
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  // Add candidate form
  const [newName, setNewName] = useState("");
  const [newClass, setNewClass] = useState("");
  const [newStream, setNewStream] = useState("");
  const [newGender, setNewGender] = useState("male");
  const [newAverage, setNewAverage] = useState("");

  // EC access delegation
  const [grants, setGrants] = useState<any[]>([]);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [grantUserId, setGrantUserId] = useState("");

  const fetchApplicants = async () => {
    const { data } = await supabase.from("applications").select("*").order("created_at", { ascending: false });
    setApplicants(data || []);
    setLoading(false);
  };

  const fetchGrants = async () => {
    const { data } = await (supabase as any).from("ec_access_grants").select("*");
    setGrants(data || []);
  };

  const fetchProfiles = async () => {
    const { data } = await supabase.from("profiles").select("id, user_id, full_name");
    setAllProfiles(data || []);
  };

  useEffect(() => {
    fetchApplicants();
    if (isTopHead) { fetchGrants(); fetchProfiles(); }
  }, []);

  const qualified = applicants.filter((a) => a.status === "qualified").length;
  const disqualified = applicants.filter((a) => a.status === "disqualified").length;

  const handleAddCandidate = async () => {
    if (!newName || !newClass || !newGender || !newAverage) {
      toast.error("Fill all required fields"); return;
    }
    const { error } = await supabase.from("applications").insert({
      applicant_name: newName,
      class: newClass,
      stream: newStream || null,
      gender: newGender,
      average_score: Number(newAverage),
      status: "pending",
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Candidate added!");
    setAddOpen(false);
    setNewName(""); setNewClass(""); setNewStream(""); setNewGender("male"); setNewAverage("");
    fetchApplicants();
  };

  const handleAutoScreen = async () => {
    const updates = applicants.map(a => ({
      ...a,
      status: a.average_score >= minAverage ? "qualified" : "disqualified",
    }));
    for (const a of updates) {
      await supabase.from("applications").update({ status: a.status }).eq("id", a.id);
    }
    toast.success(`Screened at ${minAverage}% minimum`);
    fetchApplicants();
  };

  const toggleStatus = async (id: string, current: string) => {
    const next = current === "qualified" ? "disqualified" : "qualified";
    await supabase.from("applications").update({ status: next }).eq("id", id);
    fetchApplicants();
  };

  const grantAccess = async () => {
    if (!grantUserId || !user) return;
    const { error } = await (supabase as any).from("ec_access_grants").insert({
      granted_to: grantUserId,
      granted_by: user.id,
    } as any);
    if (error) toast.error(error.message);
    else { toast.success("Access granted!"); fetchGrants(); setGrantUserId(""); }
  };

  const revokeAccess = async (id: string) => {
    await supabase.from("ec_access_grants").delete().eq("id", id);
    toast.success("Access revoked");
    fetchGrants();
  };

  const generateBallotPDF = () => {
    const qual = applicants.filter((a) => a.status === "qualified");
    if (!qual.length) { toast.error("No qualified applicants"); return; }
    const males = qual.filter((a) => a.gender === "male");
    const females = qual.filter((a) => a.gender === "female");

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const m = 15;
    let y = 15;

    doc.setFont("helvetica", "bold"); doc.setFontSize(20);
    doc.text("MENGO SENIOR SCHOOL", pageW / 2, y, { align: "center" });
    y += 7; doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text("Kampala, Uganda", pageW / 2, y, { align: "center" });
    y += 4; doc.setFontSize(9);
    doc.text('"Akwana Akira Ayomba"', pageW / 2, y, { align: "center" });
    y += 6;
    doc.setDrawColor(128, 0, 32); doc.setLineWidth(1);
    doc.line(m, y, pageW - m, y); y += 8;
    doc.setFont("helvetica", "bold"); doc.setFontSize(16);
    doc.text("OFFICIAL BALLOT PAPER", pageW / 2, y, { align: "center" });
    y += 7; doc.setFontSize(13);
    doc.text(electionTitle.toUpperCase(), pageW / 2, y, { align: "center" });
    y += 6; doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text("Instructions: Tick (\u2713) ONE candidate in each category.", pageW / 2, y, { align: "center" });
    doc.setTextColor(0); y += 10;

    const drawCat = (title: string, cands: Applicant[], startY: number) => {
      let cy = startY;
      if (cy > 250) { doc.addPage(); cy = 20; }
      doc.setFillColor(128, 0, 32);
      doc.rect(m, cy, pageW - m * 2, 9, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(12);
      doc.setTextColor(255); doc.text(title, pageW / 2, cy + 6.5, { align: "center" });
      doc.setTextColor(0); cy += 11;
      doc.setFillColor(240, 240, 240);
      doc.rect(m, cy, pageW - m * 2, 7, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(9);
      doc.text("No.", m + 4, cy + 5); doc.text("Candidate Name", m + 18, cy + 5);
      doc.text("Class", m + 90, cy + 5); doc.text("Stream", m + 120, cy + 5);
      doc.text("Tick", pageW - m - 12, cy + 5); cy += 8;
      doc.setFont("helvetica", "normal"); doc.setFontSize(10);
      cands.forEach((c, idx) => {
        if (cy > 270) { doc.addPage(); cy = 20; }
        if (idx % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(m, cy, pageW - m * 2, 10, "F"); }
        doc.setDrawColor(200); doc.setLineWidth(0.3); doc.line(m, cy + 10, pageW - m, cy + 10);
        doc.setTextColor(0); doc.text(`${idx + 1}.`, m + 4, cy + 7);
        doc.setFont("helvetica", "bold"); doc.text(c.applicant_name.toUpperCase(), m + 18, cy + 7);
        doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(100);
        doc.text(c.class, m + 90, cy + 7);
        doc.text((c as any).stream || "", m + 120, cy + 7);
        doc.setTextColor(0); doc.setFontSize(10);
        doc.setDrawColor(128, 0, 32); doc.setLineWidth(0.5);
        doc.rect(pageW - m - 14, cy + 2, 7, 7); cy += 10;
      });
      return cy + 6;
    };

    if (females.length) y = drawCat("FEMALE COUNCILLOR", females, y);
    if (males.length) y = drawCat("MALE COUNCILLOR", males, y);

    y += 4; doc.setDrawColor(128, 0, 32); doc.setLineWidth(0.5);
    doc.line(m, y, pageW - m, y); y += 6;
    doc.setFontSize(8); doc.setTextColor(100);
    doc.text("Electoral Commission — Mengo Senior School Student Council", pageW / 2, y, { align: "center" });
    y += 4;
    doc.text(`Generated on ${new Date().toLocaleDateString("en-UG", { day: "numeric", month: "long", year: "numeric" })}`, pageW / 2, y, { align: "center" });
    doc.save(`Ballot_${electionTitle.replace(/\s+/g, "_")}.pdf`);
    toast.success("Ballot PDF downloaded!");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-serif text-xl font-bold text-foreground sm:text-2xl">Electoral Commission</h1>
          <p className="text-sm text-muted-foreground">Manage candidates, screening & ballots.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isTopHead && (
            <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
              <Settings2 className="mr-1 h-4 w-4" /> Settings
            </Button>
          )}
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-1 h-4 w-4" /> Add Candidate</Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader><DialogTitle>Add Candidate</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <div><Label>Full Name *</Label><Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Nakamya Faith" /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Class *</Label><Input value={newClass} onChange={e => setNewClass(e.target.value)} placeholder="S.2" /></div>
                  <div><Label>Stream</Label><Input value={newStream} onChange={e => setNewStream(e.target.value)} placeholder="North" /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Gender *</Label>
                    <Select value={newGender} onValueChange={setNewGender}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Average (%) *</Label><Input type="number" min={0} max={100} value={newAverage} onChange={e => setNewAverage(e.target.value)} /></div>
                </div>
                <Button onClick={handleAddCandidate} className="w-full">Add Candidate</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button size="sm" variant="outline" onClick={generateBallotPDF}>
            <Download className="mr-1 h-4 w-4" /> Ballot PDF
          </Button>
        </div>
      </div>

      {/* Settings */}
      {showSettings && isTopHead && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2"><Settings2 className="h-4 w-4 text-primary" /> Screening & Access Settings</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Min Screening Average (%)</Label>
                <Input type="number" min={0} max={100} value={minAverage} onChange={e => setMinAverage(Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Election Title</Label>
                <Input value={electionTitle} onChange={e => setElectionTitle(e.target.value)} />
              </div>
            </div>
            <Button size="sm" onClick={handleAutoScreen}><UserCheck className="mr-1 h-4 w-4" /> Auto-Screen All</Button>

            {/* EC Access Delegation */}
            <div className="border-t pt-3 mt-3">
              <h4 className="text-sm font-semibold flex items-center gap-2 mb-2"><ShieldCheck className="h-4 w-4 text-primary" /> EC Access Delegation</h4>
              <p className="text-xs text-muted-foreground mb-2">Grant other councillors access to the Elections module.</p>
              <div className="flex gap-2 flex-wrap">
                <Select value={grantUserId} onValueChange={setGrantUserId}>
                  <SelectTrigger className="w-48"><SelectValue placeholder="Select councillor" /></SelectTrigger>
                  <SelectContent>
                    {allProfiles.filter(p => !grants.some(g => g.granted_to === p.user_id)).map(p => (
                      <SelectItem key={p.user_id} value={p.user_id}>{p.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={grantAccess} disabled={!grantUserId}>Grant Access</Button>
              </div>
              {grants.length > 0 && (
                <div className="mt-2 space-y-1">
                  {grants.map(g => {
                    const p = allProfiles.find(pr => pr.user_id === g.granted_to);
                    return (
                      <div key={g.id} className="flex items-center justify-between rounded bg-background px-3 py-1.5 text-sm">
                        <span>{p?.full_name || "Unknown"}</span>
                        <Button size="sm" variant="ghost" className="text-destructive h-7 text-xs" onClick={() => revokeAccess(g.id)}>Revoke</Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold sm:text-3xl">{applicants.length}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">Applicants</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold text-primary sm:text-3xl">{qualified}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">Qualified</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold text-destructive sm:text-3xl">{disqualified}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">Disqualified</p>
        </CardContent></Card>
      </div>

      {/* Applicants */}
      <Card>
        <CardHeader className="pb-2 px-3 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Vote className="h-4 w-4 text-primary" />
            Candidates (Min: {minAverage}%)
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm min-w-[480px]">
              <thead>
                <tr className="border-b">
                  <th className="py-2 px-2 text-left font-medium text-muted-foreground">Name</th>
                  <th className="py-2 px-2 text-left font-medium text-muted-foreground">Class</th>
                  <th className="py-2 px-2 text-left font-medium text-muted-foreground hidden sm:table-cell">Stream</th>
                  <th className="py-2 px-2 text-left font-medium text-muted-foreground">Gender</th>
                  <th className="py-2 px-2 text-left font-medium text-muted-foreground">Avg</th>
                  <th className="py-2 px-2 text-left font-medium text-muted-foreground">Status</th>
                  <th className="py-2 px-2 text-left font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">Loading…</td></tr>
                ) : applicants.length === 0 ? (
                  <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No candidates yet. Add one above.</td></tr>
                ) : applicants.map((a) => (
                  <tr key={a.id} className="border-b last:border-0">
                    <td className="py-2 px-2 font-medium">{a.applicant_name}</td>
                    <td className="py-2 px-2 text-muted-foreground">{a.class}</td>
                    <td className="py-2 px-2 text-muted-foreground hidden sm:table-cell">{(a as any).stream || "—"}</td>
                    <td className="py-2 px-2 capitalize text-muted-foreground">{a.gender}</td>
                    <td className="py-2 px-2">
                      <span className={`font-bold ${a.average_score >= minAverage ? "text-primary" : "text-destructive"}`}>
                        {a.average_score}%
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <Badge variant={a.status === "qualified" ? "default" : a.status === "disqualified" ? "destructive" : "secondary"} className="text-[10px] sm:text-xs">
                        {a.status}
                      </Badge>
                    </td>
                    <td className="py-2 px-2">
                      {a.status !== "pending" && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => toggleStatus(a.id, a.status)}>
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
