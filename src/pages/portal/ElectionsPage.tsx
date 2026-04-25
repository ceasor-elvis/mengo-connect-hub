import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Download, ShieldCheck, Settings2, UserCheck, Vote, Trash2, Pencil, Lock, Upload, FileText } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import mengoBadge from "@/assets/mengo-badge.jpg";
import { unsaLogoB64 } from "@/assets/unsaBase64";
import DocumentViewer from "@/components/portal/DocumentViewer";

const generateAutoComment = (smart: number, conf: number, qapp: number, total: number) => {
  if (total >= 25) return "Exceptionally good";
  if (total >= 22) return "Quite Good";
  if (total >= 18) return "Passed";
  if (total >= 15) return conf < 5 ? "Timid but knowledgeable" : "Not bad";
  if (total < 15) return "Lacks confidence and quite ignorant";
  return "Average";
};


interface Applicant {
  id: string;
  applicant_name: string;
  applicant_class: string;
  stream?: string;
  average_score: number;
  smart_score?: number;
  conf_score?: number;
  qapp_score?: number;
  comment?: string;
  gender: string;
  status: string;
  position: string;
}

export default function ElectionsPage() {
  const { user, hasPermission } = useAuth();
  const [autoProgress, setAutoProgress] = useState(false);
  const [orgName, setOrgName] = useState("VINE STUDENTS' COUNCIL");
  const isTopHead = hasPermission("manage_elections");
  const canUnlock = hasPermission("manage_permissions");

  const [minAverage, setMinAverage] = useState(15);
  const [electionTitle, setElectionTitle] = useState("S.2 Councillors 2026");
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportType, setExportType] = useState<"qualified" | "ballot" | "screening" | "criteria">("qualified");
  const [exportFooterText, setExportFooterText] = useState("ANOINTED TO BEAR FRUIT");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Excel Upload
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadClass, setUploadClass] = useState("");
  const [uploadStream, setUploadStream] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Add candidate form
  const [newName, setNewName] = useState("");
  const [newClass, setNewClass] = useState("");
  const [newStream, setNewStream] = useState("");
  const [newGender, setNewGender] = useState("male");
  const [newSmart, setNewSmart] = useState("");
  const [newConf, setNewConf] = useState("");
  const [newQapp, setNewQapp] = useState("");
  const [newPosition, setNewPosition] = useState("Councillor");
  const [newComment, setNewComment] = useState("");

  // Filtering
  const [filterSearch, setFilterSearch] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [filterStream, setFilterStream] = useState("all");
  const [filterGender, setFilterGender] = useState("all");
  const [computedAverage, setComputedAverage] = useState<number | null>(null);

  // Edit Candidate
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editClass, setEditClass] = useState("");
  const [editStream, setEditStream] = useState("");
  const [editGender, setEditGender] = useState("male");
  const [editSmart, setEditSmart] = useState("");
  const [editConf, setEditConf] = useState("");
  const [editQapp, setEditQapp] = useState("");
  const [editPosition, setEditPosition] = useState("");
  const [editComment, setEditComment] = useState("");

  // EC access delegation
  const [activeLocks, setActiveLocks] = useState<any[]>([]);

  // Predefined streams
  const canManageStreams = hasPermission("manage_elections");
  const [streams, setStreams] = useState<any[]>([]);
  const [addStreamOpen, setAddStreamOpen] = useState(false);
  const [newStreamName, setNewStreamName] = useState("");
  const [addingStream, setAddingStream] = useState(false);

  const filterId = `${filterClass}-${filterStream}`.toLowerCase();
  const isLocked = activeLocks.some(l => l.filter_id === filterId);

  const isCandidateLocked = (applicant: Applicant) => {
    const classId = applicant.applicant_class?.toLowerCase();
    const streamId = applicant.stream?.toLowerCase() || 'all';
    const specificId = `${classId}-${streamId}`;
    const classAllId = `${classId}-all`;
    const allAllId = 'all-all';
    
    return activeLocks.some(l => 
        l.filter_id === specificId || 
        l.filter_id === classAllId || 
        l.filter_id === allAllId
    );
  };

  const fetchApplicants = async () => {
    try {
      const { data } = await api.get("/applications/");
      const entries = Array.isArray(data) ? data : data.results || [];
      setApplicants(entries);
    } catch(e) { console.error("Failed to load applicants", e); }
    finally { setLoading(false); }
  };


  const fetchLocks = async () => {
    try {
      const { data } = await api.get("/ec-access-locks/");
      setActiveLocks(Array.isArray(data) ? data : data.results || []);
    } catch(e) { console.error(e); }
  };

  const fetchStreams = async () => {
    try {
      const { data } = await api.get("/streams/");
      setStreams(Array.isArray(data) ? data : (data.results || []));
    } catch(e) { console.error(e); }
  };

  useEffect(() => {
    fetchApplicants();
    fetchLocks();
    fetchStreams();
  }, []);

  useEffect(() => {
    const cls = filterClass !== "all" ? filterClass : "General";
    const strm = filterStream !== "all" ? filterStream : "";
    setElectionTitle(`${cls} ${strm} Councillors ${new Date().getFullYear()}`.replace(/\s+/g, " ").trim());
  }, [filterClass, filterStream]);

  const filteredApplicants = applicants.filter((a) => {
    let match = true;
    if (filterSearch && !a.applicant_name.toLowerCase().includes(filterSearch.toLowerCase())) match = false;
    if (filterClass !== "all" && a.applicant_class?.toLowerCase() !== filterClass.toLowerCase()) match = false;
    if (filterStream !== "all" && a.stream?.toLowerCase() !== filterStream.toLowerCase()) match = false;
    if (filterGender !== "all" && a.gender?.toLowerCase() !== filterGender) match = false;
    return match;
  });

  const uniqueClasses = Array.from(new Set(applicants.map(a => a.applicant_class).filter(Boolean)));
  const uniqueStreams = Array.from(new Set(applicants.map(a => a.stream).filter(Boolean)));

  const qualified = filteredApplicants.filter((a) => a.status === "qualified").length;
  const disqualified = filteredApplicants.filter((a) => a.status === "disqualified").length;

  // New Dashboard Stats
  const hasFiltered = filteredApplicants.length > 0;
  const avgTotal = hasFiltered ? filteredApplicants.reduce((sum, a) => sum + a.average_score, 0) / filteredApplicants.length : 0;
  const avgPerc = (avgTotal / 30) * 100;
  const highest = hasFiltered ? Math.max(...filteredApplicants.map(a => a.average_score)) : 0;
  const lowest = hasFiltered ? Math.min(...filteredApplicants.map(a => a.average_score)) : 0;

  const handleAddStream = async () => {
    if (!newStreamName) return;
    setAddingStream(true);
    try {
      await api.post("/streams/", { name: newStreamName });
      toast.success("Stream added!");
      setNewStreamName("");
      setAddStreamOpen(false);
      fetchStreams();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to add stream");
    } finally {
      setAddingStream(false);
    }
  };

  const handleStreamSelect = (val: string, setter: (val: string) => void) => {
    if (val === "add_new") {
      if (canManageStreams) setAddStreamOpen(true);
      else toast.error("Unauthorized to add streams.");
      return;
    }
    setter(val);
  };

  const handleSetThresholdFromAvg = () => {
    if (filteredApplicants.length === 0) {
      toast.error("No candidates in current filter");
      return;
    }
    setMinAverage(Math.round(avgTotal));
    toast.success(`Threshold updated to Average: ${avgTotal.toFixed(1)}/30`);
  };

  const handleAddCandidate = async () => {
    if (!newName || !newClass || !newGender || !newSmart || !newConf || !newQapp) {
      toast.error("Fill all required fields"); return;
    }
    const smart = Number(newSmart);
    const conf = Number(newConf);
    const qapp = Number(newQapp);

    if (smart > 10 || conf > 10 || qapp > 10 || smart < 0 || conf < 0 || qapp < 0) {
      toast.error("Scores must be between 0 and 10");
      return;
    }

    const totalScore = smart + conf + qapp;
    try {
      await api.post("/applications/", {
        applicant_name: newName,
        applicant_class: newClass,
        stream: (newStream && newStream !== "none") ? newStream : null,
        gender: newGender,
        smart_score: Number(newSmart),
        conf_score: Number(newConf),
        qapp_score: Number(newQapp),
        comment: newComment || generateAutoComment(Number(newSmart), Number(newConf), Number(newQapp), totalScore),
        average_score: totalScore,
        position: newPosition,
        status: "pending",
      });
      toast.success("Candidate added!");
      setAddOpen(false);
      setNewName(""); setNewClass(""); setNewStream(""); 
      setNewGender("male"); setNewSmart(""); setNewConf(""); setNewQapp(""); setNewComment("");
      fetchApplicants();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to add candidate");
    }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!uploadClass) {
      toast.error("Please specify a target class before selecting a file.");
      e.target.value = "";
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          toast.error("No valid data found in Excel sheet");
          return;
        }

        let success = 0;
        let fails = 0;

        for (const row of data as any[]) {
          const name = row["Name"] || row["Applicant Name"] || row["student name"] || row["name"] || row["applicant"];
          if (!name) continue;
          
          // Parse gender
          let gender = "male";
          const g = (row["Gender"] || row["gender"])?.toString().toLowerCase();
          if (g && (g.startsWith("f") || g === "female")) gender = "female";
          
          // Parse numbers
          const parseNum = (val: any) => {
            const n = !isNaN(Number(val)) ? Number(val) : 0;
            return Math.min(10, Math.max(0, n));
          };
          const smart = parseNum(row["Smart"] || row["Smart /10"] || row["smart"]);
          const conf = parseNum(row["Conf"] || row["Conf /10"] || row["conf"]);
          const qapp = parseNum(row["Q.App"] || row["Q.App /10"] || row["qapp"]);
          const total = smart + conf + qapp;

          try {
            await api.post("/applications/", {
              applicant_name: name,
              applicant_class: uploadClass,
              stream: uploadStream === "none" ? null : uploadStream,
              gender,
              smart_score: smart,
              conf_score: conf,
              qapp_score: qapp,
              average_score: total,
              position: row["Position"] || "Councillor",
              comment: generateAutoComment(smart, conf, qapp, total),
              status: "pending",
            });
            success++;
          } catch (err) {
            fails++;
          }
        }
        
        toast.success(`Excel upload complete. Imported ${success} candidates. (Failures: ${fails})`);
        setUploadOpen(false);
        setUploadClass(""); setUploadStream(""); 
        fetchApplicants();
      } catch (err) {
        toast.error("Failed to parse Excel file");
      } finally {
        setIsUploading(false);
        e.target.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  const openEditModal = (a: any) => {
    setEditingId(a.id);
    setEditName(a.applicant_name);
    setEditClass(a.applicant_class || "");
    setEditStream(a.stream || "");
    setEditGender(a.gender || "male");
    setEditSmart(a.smart_score?.toString() || "");
    setEditConf(a.conf_score?.toString() || "");
    setEditQapp(a.qapp_score?.toString() || "");
    setEditPosition(a.position || "Councillor");
    setEditComment(a.comment || "");
  };

  const saveEditCandidate = async () => {
    if (!editingId) return;
    const smart = Number(editSmart || 0);
    const conf = Number(editConf || 0);
    const qapp = Number(editQapp || 0);

    if (smart > 10 || conf > 10 || qapp > 10 || smart < 0 || conf < 0 || qapp < 0) {
      toast.error("Scores must be between 0 and 10");
      return;
    }

    const average_score = smart + conf + qapp;

    try {
      await api.patch(`/applications/${editingId}/`, {
        applicant_name: editName,
        applicant_class: editClass,
        stream: (editStream && editStream !== "none") ? editStream : null,
        gender: editGender,
        smart_score: smart,
        conf_score: conf,
        qapp_score: qapp,
        average_score,
        position: editPosition,
        comment: editComment || generateAutoComment(smart, conf, qapp, average_score)
      });
      toast.success("Candidate updated!");
      setEditingId(null);
      fetchApplicants();
    } catch(e) {
      toast.error("Failed to update candidate");
    }
  };

  const handleDeleteCandidate = async (id: string) => {
    if (!confirm("Are you sure you want to completely remove this candidate?")) return;
    try {
      await api.delete(`/applications/${id}/`);
      toast.success("Candidate removed");
      fetchApplicants();
    } catch (e) {
      toast.error("Failed to delete candidate");
    }
  };

  const handleAutoScreen = async () => {
    try {
      await api.post("/applications/auto-screen/", { 
        min_average: minAverage,
        applicant_class: filterClass,
        stream: filterStream,
        gender: filterGender
      });
      toast.success(`Screened using min target of ${minAverage}/30`);
      fetchApplicants();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to autoscreen");
    }
  };

  const updateStatus = async (id: string, next: string) => {
    try {
      await api.patch(`/applications/${id}/`, { status: next });
      fetchApplicants();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to update status");
    }
  };


  const getDynamicTitle = () => {
    let parts = [];
    if (filterClass !== "all") parts.push(filterClass);
    if (filterStream !== "all") parts.push(filterStream);
    if (filterGender !== "all") parts.push(filterGender);
    
    if (parts.length > 0) {
       return `${parts.join(" ")} - ${electionTitle}`.toUpperCase();
    }
    return electionTitle.toUpperCase();
  };

  const lockFilter = async () => {
    try {
      await api.post("/ec-access-locks/", { 
        filter_id: filterId, 
        filter_label: (filterClass === "all" ? "All Classes" : filterClass) + " " + (filterStream === "all" ? "" : filterStream)
      });
      toast.success("Screening criteria locked for all officials.");
      fetchLocks();
    } catch (e) { toast.error("Failed to lock filter"); }
  };

  const unlockFilter = async () => {
    const lock = activeLocks.find(l => l.filter_id === filterId);
    if (!lock) return;
    try {
      await api.delete(`/ec-access-locks/${lock.id}/`);
      toast.success("Screening configuration unlocked.");
      fetchLocks();
    } catch (e) { toast.error("Failed to unlock filter"); }
  };

  const unlockSpecific = async (lockId: string) => {
    try {
      await api.delete(`/ec-access-locks/${lockId}/`);
      toast.success("Category unlocked.");
      fetchLocks();
    } catch (e) { toast.error("Failed to unlock"); }
  };

  const addImageToDoc = (doc: jsPDF, src: string, x: number, y: number, w: number, h: number, format: string) => {
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.src = src;
      img.crossOrigin = "Anonymous";
      img.onload = () => { doc.addImage(img, format, x, y, w, h); resolve(); };
      img.onerror = () => resolve();
    });
  };

  const generateCriteriaPDF = async () => {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    let y = 20;

    await Promise.all([
      addImageToDoc(doc, mengoBadge, 15, 10, 20, 20, "JPEG"),
      addImageToDoc(doc, unsaLogoB64, pageW - 35, 10, 20, 20, "PNG")
    ]);

    doc.setFont("helvetica", "bold"); doc.setFontSize(14);
    doc.text("MENGO SENIOR SCHOOL", pageW / 2, y, { align: "center" });
    y += 6; doc.setFontSize(12);
    doc.text(orgName.toUpperCase(), pageW / 2, y, { align: "center" });
    y += 10; doc.setFontSize(11);
    doc.text("OFFICIAL SCREENING CRITERIA RECORD", pageW / 2, y, { align: "center" });
    y += 15;

    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    doc.text(`Election: ${getDynamicTitle()}`, 20, y); y += 8;
    doc.text(`Filter Applied: ${filterId}`, 20, y); y += 8;
    doc.text(`Threshold Set: ${minAverage}/30`, 20, y); y += 8;
    doc.text(`Date Logged: ${new Date().toLocaleString()}`, 20, y); y += 20;

    doc.text("Approved By: __________________________", 20, y);
    y += 10;
    doc.text("EC Chairperson Signature: __________________", 20, y);

    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    setIsExportOpen(false);
    toast.success("Criteria log preview generated!");
  };

  const generateQualifiedPDF = async () => {
    const qual = filteredApplicants.filter((a) => a.status === "qualified");
    if (!qual.length) { toast.error("No qualified applicants in current filter"); return; }
    
    const sorted = [...qual].sort((a, b) => {
      if (a.applicant_class !== b.applicant_class) return (a.applicant_class || "").localeCompare(b.applicant_class || "");
      if (a.stream !== b.stream) return (a.stream || "").localeCompare(b.stream || "");
      return a.applicant_name.localeCompare(b.applicant_name);
    });

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    let y = 15;

    await Promise.all([
      addImageToDoc(doc, mengoBadge, 15, 10, 20, 20, "JPEG"),
      addImageToDoc(doc, unsaLogoB64, pageW - 35, 10, 20, 20, "PNG")
    ]);

    doc.setFont("helvetica", "bold"); doc.setFontSize(14);
    doc.text("MENGO SENIOR SCHOOL", pageW / 2, y, { align: "center" });
    y += 6; doc.setFontSize(12);
    doc.text(orgName.toUpperCase(), pageW / 2, y, { align: "center" });
    y += 6; doc.setFontSize(11);
    doc.text("QUALIFIED CANDIDATES LIST", pageW / 2, y, { align: "center" });
    y += 6; doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    doc.text(`Election: ${getDynamicTitle()}`, pageW / 2, y, { align: "center" });
    y += 8;

    const m = 15;
    doc.setFillColor(41, 128, 185);
    doc.rect(m, y, pageW - m * 2, 8, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(255, 255, 255);
    
    doc.text("No.", m + 3, y + 5);
    doc.text("Name", m + 20, y + 5);
    doc.text("Class", m + 90, y + 5);
    doc.text("Stream", m + 130, y + 5);
    doc.text("Gender", m + 170, y + 5);
    
    doc.setTextColor(0, 0, 0);
    y += 8;

    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    sorted.forEach((c, idx) => {
      if (y > 280) { doc.addPage(); y = 20; }
      if (idx % 2 === 0) { doc.setFillColor(245, 245, 245); doc.rect(m, y, pageW - m * 2, 8, "F"); }
      
      doc.text(`${idx + 1}`, m + 3, y + 5);
      doc.text(c.applicant_name, m + 20, y + 5);
      doc.text(c.applicant_class || '', m + 90, y + 5);
      doc.text(c.stream || '', m + 130, y + 5);
      doc.text(c.gender.charAt(0).toUpperCase() + c.gender.slice(1), m + 170, y + 5);
      
      y += 8;
    });

    doc.setTextColor(150, 0, 0); doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    doc.text(exportFooterText, pageW / 2, 285, { align: "center" });

    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    setIsExportOpen(false);
    toast.success("Qualified list preview generated!");
  };

  const generateBallotPDF = async () => {
    const qual = filteredApplicants.filter((a) => a.status === "qualified");
    if (!qual.length) { toast.error("No qualified applicants in current filter"); return; }
    const males = qual.filter((a) => a.gender === "male");
    const females = qual.filter((a) => a.gender === "female");

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const m = 15;
    
    const ballotsPerPage = 3;
    const ballotHeight = (pageH - 20) / ballotsPerPage;

    const maxRows = Math.max(males.length, females.length);
    
    for (let currentBallot = 0; currentBallot < ballotsPerPage; currentBallot++) {
      const topY = 10 + (currentBallot * ballotHeight);
      let y = topY;
      
      if (currentBallot > 0) {
        doc.setLineDashPattern([3, 3], 0);
        doc.setDrawColor(150);
        doc.line(10, topY - 3, pageW - 10, topY - 3);
        doc.setLineDashPattern([], 0);
      }

      await Promise.all([
        addImageToDoc(doc, mengoBadge, 15, y, 16, 16, "JPEG"),
        addImageToDoc(doc, unsaLogoB64, pageW - 28, y, 16, 16, "PNG")
      ]);

      y += 4;
      doc.setFont("helvetica", "bold"); doc.setFontSize(14);
      doc.text("MENGO SENIOR SCHOOL", pageW / 2, y, { align: "center" });
      y += 5; doc.setFontSize(11);
      doc.text(orgName.toUpperCase(), pageW / 2, y, { align: "center" });
      y += 5; doc.setFontSize(11);
      doc.text("VINE STUDENTS' COUNCIL ELECTIONS", pageW / 2, y, { align: "center" });
      y += 5;
      doc.setFontSize(9);
      if (filterClass !== "all") {
        doc.text(`${filterClass} ${filterStream !== "all" ? filterStream : ""}`.trim().toUpperCase(), pageW / 2, y, { align: "center" });
      }
      y += 5;
      
      const midX = pageW / 2;
      doc.setFontSize(10);
      doc.text("MALES", m + (midX - m) / 2, y, { align: "center" });
      doc.text("FEMALES", midX + (pageW - m - midX) / 2, y, { align: "center" });
      y += 2;
      
      doc.setFillColor(230, 230, 230);
      doc.rect(m, y, midX - m, 6, "F");
      doc.rect(midX, y, pageW - m - midX, 6, "F");
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.rect(m, y, midX - m, 6);
      doc.rect(midX, y, pageW - m - midX, 6);
      
      doc.setFontSize(8);
      doc.text("VOTE FOR ONLY ONE CANDIDATE", m + (midX - m) / 2, y + 4, { align: "center" });
      doc.text("VOTE FOR ONLY ONE CANDIDATE", midX + (pageW - m - midX) / 2, y + 4, { align: "center" });
      y += 6;
      
      const tickBoxW = 10;
      
      for (let i = 0; i < maxRows; i++) {
        const rowH = 6;
        const male = males[i];
        const female = females[i];
        
        doc.setLineWidth(0.3);
        doc.rect(m, y, midX - m - tickBoxW, rowH);
        doc.rect(midX - tickBoxW, y, tickBoxW, rowH);
        if (male) {
           doc.setFont("helvetica", "bold"); doc.setFontSize(8);
           doc.text(`${i + 1}.`, m + 2, y + 4);
           doc.text(male.applicant_name.toUpperCase(), m + 8, y + 4);
        }
        
        doc.rect(midX, y, pageW - m - midX - tickBoxW, rowH);
        doc.rect(pageW - m - tickBoxW, y, tickBoxW, rowH);
        if (female) {
           doc.setFont("helvetica", "bold"); doc.setFontSize(8);
           doc.text(`${i + 1}.`, midX + 2, y + 4);
           doc.text(female.applicant_name.toUpperCase(), midX + 8, y + 4);
        }
        y += rowH;
      }
      doc.rect(m, y, pageW - m * 2, 12);
    }

    doc.setPage(doc.getNumberOfPages());
    doc.setTextColor(150, 0, 0); doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    doc.text(exportFooterText, pageW / 2, 285, { align: "center" });

    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    setIsExportOpen(false);
    toast.success("Ballot preview generated!");
  };

  const generateScreeningReportPDF = async () => {
    const qual = filteredApplicants;
    if (!qual.length) { toast.error("No candidates in current filter"); return; }
    
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    let y = 15;

    await Promise.all([
      addImageToDoc(doc, mengoBadge, 15, 10, 25, 25, "JPEG"),
      addImageToDoc(doc, unsaLogoB64, pageW - 40, 10, 25, 25, "PNG")
    ]);

    doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    doc.text("MENGO SENIOR SCHOOL", pageW / 2, y, { align: "center" });
    y += 5;
    doc.text(orgName.toUpperCase(), pageW / 2, y, { align: "center" });
    y += 6; doc.setFontSize(11);
    doc.text("SCREENING EVALUATION TOOL", pageW / 2, y, { align: "center" });
    y += 6; doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    doc.text(`Election: ${getDynamicTitle()}    Threshold: ${minAverage}/30`, pageW / 2, y, { align: "center" });
    y += 8;

    const m = 15;
    doc.setFillColor(41, 128, 185);
    doc.rect(m, y, pageW - m * 2, 8, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(255, 255, 255);
    
    doc.text("No.", m + 3, y + 5);
    doc.text("Name", m + 15, y + 5);
    doc.text("Class/Stream", m + 60, y + 5);
    doc.text("Smart /10", m + 100, y + 5);
    doc.text("Conf /10", m + 120, y + 5);
    doc.text("Q.App /10", m + 140, y + 5);
    doc.text("Total /30", m + 160, y + 5);
    doc.text("%", m + 180, y + 5);
    doc.text("Qualifies", m + 195, y + 5);
    doc.text("Comment", m + 215, y + 5);
    
    doc.setTextColor(0, 0, 0);
    y += 8;

    doc.setFont("helvetica", "normal"); doc.setFontSize(8);
    qual.forEach((c, idx) => {
      if (y > 190) { doc.addPage(); y = 20; }
      if (idx % 2 === 0) { doc.setFillColor(245, 245, 245); doc.rect(m, y, pageW - m * 2, 8, "F"); }
      
      const pct = ((c.average_score / 30) * 100).toFixed(1) + "%";
      const qualifies = c.average_score >= minAverage ? "YES" : "NO";
      
      doc.text(`${idx + 1}`, m + 3, y + 5);
      doc.text(c.applicant_name, m + 15, y + 5);
      doc.text(`${c.applicant_class} ${c.stream || ''}`, m + 60, y + 5);
      doc.text(`${c.smart_score || '-'}`, m + 103, y + 5);
      doc.text(`${c.conf_score || '-'}`, m + 123, y + 5);
      doc.text(`${c.qapp_score || '-'}`, m + 143, y + 5);
      doc.text(`${c.average_score}`, m + 163, y + 5);
      doc.text(pct, m + 180, y + 5);
      doc.text(qualifies, m + 195, y + 5);
      if (c.comment) { doc.text(c.comment.substring(0, 40), m + 215, y + 5); }
      
      y += 8;
    });

    doc.setTextColor(150, 0, 0); doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    doc.text(exportFooterText, pageW / 2, 200, { align: "center" });

    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    setIsExportOpen(false);
    toast.success("Screening report preview generated!");
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
            <div className="flex flex-wrap gap-2">
              {canManageStreams && (
                <Dialog open={addStreamOpen} onOpenChange={setAddStreamOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="mr-1 h-4 w-4" /> Add Stream
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>Add New Stream</DialogTitle></DialogHeader>
                    <div className="space-y-3 pt-2">
                      <div>
                        <Label>Stream Name</Label>
                        <Input value={newStreamName} onChange={e => setNewStreamName(e.target.value)} placeholder="e.g. NORTH" />
                      </div>
                      <Button onClick={handleAddStream} className="w-full" disabled={addingStream}>
                        {addingStream ? "Saving..." : "Save Stream"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              {isLocked ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-destructive/10 text-destructive border border-destructive/20 select-none">
                  <Lock className="h-4 w-4 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Locked</span>
                  {canUnlock && (
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] hover:bg-destructive/10" onClick={unlockFilter}>
                      Unlock
                    </Button>
                  )}
                </div>
              ) : (
                <Button variant="outline" size="sm" className="border-primary/20" onClick={lockFilter} disabled={!isTopHead}>
                  <Lock className="mr-1 h-4 w-4" /> Lock Filter
                </Button>
              )}
              {activeLocks.length > 0 && isTopHead && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="secondary" size="sm" className="relative">
                      <ShieldCheck className="mr-1 h-4 w-4" /> 
                      Locks Summary
                      <Badge className="ml-1 h-4 min-w-[16px] px-1 bg-primary text-[9px] flex items-center justify-center">
                        {activeLocks.length}
                      </Badge>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5" /> Active Locks Summary
                      </DialogTitle>
                      <DialogDescription>
                        The following categories are currently locked for screening evaluation.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 mt-4 max-h-[40vh] overflow-y-auto pr-2">
                      {activeLocks.map((l) => (
                        <div key={l.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold">{l.filter_label || l.filter_id}</span>
                            <span className="text-[10px] text-muted-foreground uppercase font-medium">{l.filter_id}</span>
                          </div>
                          {canUnlock && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-3"
                              onClick={() => unlockSpecific(l.id)}
                            >
                              Unlock
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              <Button variant="outline" size="sm" onClick={generateCriteriaPDF}>
                <FileText className="mr-1 h-4 w-4" /> Log Criteria
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
                <Settings2 className="mr-1 h-4 w-4" /> Settings
              </Button>
            </div>
          )}
          {isTopHead && !isLocked && (
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="mr-1 h-4 w-4" /> Add Candidate</Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader><DialogTitle>Add Candidate</DialogTitle></DialogHeader>
                <div className="space-y-3 pt-2">
                  <div><Label>Full Name *</Label><Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Nakamya Faith" /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Class *</Label>
                      <Select value={newClass} onValueChange={setNewClass}>
                        <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                        <SelectContent>
                          {["S.1", "S.2", "S.3", "S.4", "S.5", "S.6"].map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Stream</Label>
                      <Select value={newStream} onValueChange={(val) => handleStreamSelect(val, setNewStream)}>
                        <SelectTrigger><SelectValue placeholder="Select Stream" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {streams.map((s) => (
                            <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                          ))}
                          {canManageStreams && <SelectItem value="add_new" className="text-primary font-medium">+ Add New Stream</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
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
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div><Label>Smart /10</Label><Input type="number" min={0} max={10} value={newSmart} onChange={e => setNewSmart(e.target.value)} /></div>
                    <div><Label>Conf /10</Label><Input type="number" min={0} max={10} value={newConf} onChange={e => setNewConf(e.target.value)} /></div>
                    <div><Label>Q.App /10</Label><Input type="number" min={0} max={10} value={newQapp} onChange={e => setNewQapp(e.target.value)} /></div>
                  </div>
                  <div><Label>Position *</Label><Input value={newPosition} onChange={e => setNewPosition(e.target.value)} placeholder="e.g. Councillor" /></div>
                  <div><Label>Comment</Label><Input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Optional comment" /></div>
                  <Button onClick={handleAddCandidate} className="w-full">Add Candidate</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {isTopHead && !isLocked && (
            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline"><Upload className="mr-1 h-4 w-4" /> Upload Excel</Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader><DialogTitle>Bulk Upload Candidates</DialogTitle></DialogHeader>
                <div className="space-y-3 pt-2">
                  <p className="text-xs text-muted-foreground">
                    Select the Class and Stream first, then choose an Excel file (.xlsx). Extract uses columns: "Name", "Gender", "Smart", "Conf", "Q.App".
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Class *</Label>
                      <Select value={uploadClass} onValueChange={setUploadClass}>
                        <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                        <SelectContent>
                          {["S.1", "S.2", "S.3", "S.4", "S.5", "S.6"].map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Stream</Label>
                      <Select value={uploadStream} onValueChange={(val) => handleStreamSelect(val, setUploadStream)}>
                        <SelectTrigger><SelectValue placeholder="Select Stream" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {streams.map((s) => (
                            <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                          ))}
                          {canManageStreams && <SelectItem value="add_new" className="text-primary font-medium">+ Add New Stream</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Excel File</Label>
                    <Input 
                      type="file" 
                      accept=".xlsx, .xls, .csv" 
                      onChange={handleExcelUpload} 
                      disabled={isUploading}
                      className="cursor-pointer"
                    />
                  </div>
                  {isUploading && <p className="text-xs text-primary animate-pulse">Processing file and uploading candidates...</p>}
                </div>
              </DialogContent>
            </Dialog>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => { setExportType("qualified"); setIsExportOpen(true); }} className="w-full">
              <FileText className="mr-1 h-4 w-4" /> Qualified List
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setExportType("ballot"); setIsExportOpen(true); }} className="w-full">
              <Download className="mr-1 h-4 w-4" /> Generate Ballot
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setExportType("screening"); setIsExportOpen(true); }} className="w-full">
              <FileText className="mr-1 h-4 w-4" /> Full Screening
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export Election Report</DialogTitle>
            <DialogDescription>Customize your report footer before downloading.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="footerText">Document Footer Slogan</Label>
              <Input 
                id="footerText" 
                value={exportFooterText} 
                onChange={e => setExportFooterText(e.target.value)} 
                placeholder="e.g. ANOINTED TO BEAR FRUIT"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (exportType === "qualified") generateQualifiedPDF();
              else if (exportType === "ballot") generateBallotPDF();
              else if (exportType === "screening") generateScreeningReportPDF();
              else if (exportType === "criteria") generateCriteriaPDF();
            }}>View Preview</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingId} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Edit Candidate</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div><Label>Full Name *</Label><Input value={editName} onChange={e => setEditName(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Class *</Label>
                <Select value={editClass} onValueChange={setEditClass}>
                  <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                  <SelectContent>
                    {["S.1", "S.2", "S.3", "S.4", "S.5", "S.6"].map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Stream</Label>
                <Select value={editStream} onValueChange={(val) => handleStreamSelect(val, setEditStream)}>
                  <SelectTrigger><SelectValue placeholder="Select Stream" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {streams.map((s) => (
                      <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                    ))}
                    {canManageStreams && <SelectItem value="add_new" className="text-primary font-medium">+ Add New Stream</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Gender *</Label>
                <Select value={editGender} onValueChange={setEditGender}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div><Label>Smart /10</Label><Input type="number" min={0} max={10} value={editSmart} onChange={e => setEditSmart(e.target.value)} /></div>
              <div><Label>Conf /10</Label><Input type="number" min={0} max={10} value={editConf} onChange={e => setEditConf(e.target.value)} /></div>
              <div><Label>Q.App /10</Label><Input type="number" min={0} max={10} value={editQapp} onChange={e => setEditQapp(e.target.value)} /></div>
            </div>
            <div><Label>Position *</Label><Input value={editPosition} onChange={e => setEditPosition(e.target.value)} /></div>
            <div><Label>Comment</Label><Input value={editComment} onChange={e => setEditComment(e.target.value)} /></div>
            <DialogFooter className="mt-4">
              <Button onClick={saveEditCandidate} className="w-full">Save Changes</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <Card className="bg-muted/30 border-primary/10">
        <CardContent className="p-3 sm:p-4 grid gap-3 sm:grid-cols-4 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Search Name</Label>
            <Input size={1} placeholder="e.g. John" value={filterSearch} onChange={e => setFilterSearch(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Class</Label>
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger><SelectValue placeholder="All Classes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {["S.1", "S.2", "S.3", "S.4", "S.5", "S.6"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Stream</Label>
            <Select value={filterStream} onValueChange={setFilterStream}>
              <SelectTrigger><SelectValue placeholder="All Streams" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Streams</SelectItem>
                {streams.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Gender</Label>
            <Select value={filterGender} onValueChange={setFilterGender}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-4 flex justify-between items-center border-t border-primary/10 pt-3 mt-1">
             <div className="text-sm font-medium text-muted-foreground italic">
               Filtered for focus. Total candidates: {filteredApplicants.length}
             </div>
          </div>

          {isTopHead && (
            <div className="mt-4 pt-4 border-t border-stone-200">
              <Label className="text-[10px] font-bold text-stone-500 uppercase">Document Branding</Label>
              <div className="mt-1.5 flex gap-2">
                <Input 
                  value={orgName} 
                  onChange={e => setOrgName(e.target.value)} 
                  placeholder="e.g. VINE STUDENTS' COUNCIL"
                  className="h-8 text-xs bg-stone-50 border-stone-300"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filter Statistics Dashboard + Settings — shown only when Settings is toggled */}
      {showSettings && (
        <>
          <div className="bg-[#f2ebe9] dark:bg-stone-900 p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4 animate-in slide-in-from-top-2 fade-in duration-300">
            <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
              <Settings2 className="h-5 w-5" />
              <h3 className="font-bold text-sm uppercase tracking-wide">
                Filter Statistics — Class: {filterClass.toUpperCase()} • Stream: {filterStream.toUpperCase()} • Gender: {filterGender.toUpperCase()}
              </h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "Total Candidates", value: filteredApplicants.length },
                { label: "Avg Total /30", value: avgTotal.toFixed(1) },
                { label: "Avg Percentage", value: `${avgPerc.toFixed(1)}%` },
                { label: "Highest", value: highest },
                { label: "Lowest", value: lowest },
                { label: "Qualified", value: `${qualified}/${filteredApplicants.length}` }
              ].map((stat, i) => (
                <div key={i} className="bg-white dark:bg-stone-800 p-3 flex flex-col items-center justify-center rounded-xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-xl font-bold text-stone-900 dark:text-white">{stat.value}</p>
                  <p className="text-[10px] text-stone-500 uppercase font-medium mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-end justify-between gap-4 pt-2 border-t border-stone-200/50">
              <div className="space-y-3">
                <p className="text-xs text-stone-500 font-medium tracking-tight">Set threshold based on average</p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="bg-[#d4a035] hover:bg-[#c08e2a] text-white border-none text-xs" 
                    onClick={handleSetThresholdFromAvg}
                  >
                    Use Average ({avgPerc.toFixed(0)}%)
                  </Button>
                  <div className="w-20">
                    <Input 
                      type="number" 
                      className="bg-white dark:bg-stone-800 border-stone-200 h-9 text-xs font-bold text-center" 
                      value={minAverage} 
                      onChange={e => setMinAverage(Number(e.target.value))} 
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {isLocked ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-destructive font-bold animate-pulse text-[10px] uppercase tracking-tighter">
                      <Lock className="h-3 w-3" /> System Locked (Official Use Only)
                    </div>
                    {canUnlock && (
                      <Button variant="outline" size="sm" className="h-7 text-[10px] border-destructive/30 text-destructive hover:bg-destructive/5" onClick={unlockFilter}>
                        Unlock Configuration
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button size="sm" className="h-7 text-[10px]" onClick={lockFilter} disabled={!isTopHead}>
                    <Lock className="mr-1 h-3 w-3" /> Lock Criteria
                  </Button>
                )}
                  <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => { setExportType("criteria"); setIsExportOpen(true); }}>
                    <FileText className="mr-1 h-3 w-3" /> Log Criteria
                  </Button>
                <Button 
                  variant="outline" 
                  className="border-stone-300 text-xs px-6 font-bold hover:bg-white" 
                  onClick={handleAutoScreen}
                  disabled={isLocked}
                >
                  Auto-Screen with {((minAverage / 30) * 100).toFixed(0)}%
                </Button>
              </div>
            </div>
          </div>

          {/* Screening & Access Settings */}
          {isTopHead && (
            <Card className="border-primary/30 bg-primary/5 animate-in slide-in-from-top-2 fade-in duration-300">
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold text-sm flex items-center gap-2"><Settings2 className="h-4 w-4 text-primary" /> Screening & Access Settings</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Min Screening Total (/30)</Label>
                    <Input type="number" min={0} max={30} value={minAverage} onChange={e => setMinAverage(Number(e.target.value))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Election Title</Label>
                    <Input value={electionTitle} onChange={e => setElectionTitle(e.target.value)} />
                  </div>
                </div>
                <Button size="sm" onClick={handleAutoScreen} disabled={isLocked}><UserCheck className="mr-1 h-4 w-4" /> Auto-Screen All</Button>

              </CardContent>
            </Card>
          )}
        </>
      )}


      {/* Applicants */}
      <Card>
        <CardHeader className="pb-2 px-3 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Vote className="h-4 w-4 text-primary" />
            Candidates (Min: {minAverage}/30)
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
                  <th className="py-2 px-2 text-left font-medium text-muted-foreground hidden lg:table-cell">Gender</th>
                  <th className="py-2 px-2 text-left font-medium text-muted-foreground hidden xl:table-cell">Position</th>
                  <th className="py-2 px-2 text-left font-medium text-muted-foreground" title="Smartness">Smt</th>
                  <th className="py-2 px-2 text-left font-medium text-muted-foreground" title="Confidence">Cnf</th>
                  <th className="py-2 px-2 text-left font-medium text-muted-foreground" title="Quick at Application">Q.A</th>
                  <th className="py-2 px-2 text-left font-medium text-muted-foreground text-primary">Tot /30</th>
                  <th className="py-2 px-2 text-left font-medium text-muted-foreground hidden 2xl:table-cell">Comment</th>
                  <th className="py-2 px-2 text-left font-medium text-muted-foreground">Status</th>
                  <th className="py-2 px-2 text-left font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={10} className="py-8 text-center text-muted-foreground">Loading…</td></tr>
                ) : filteredApplicants.length === 0 ? (
                  <tr><td colSpan={10} className="py-8 text-center text-muted-foreground">No candidates match filters.</td></tr>
                ) : filteredApplicants.map((a) => (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-2 px-2 font-medium">{a.applicant_name}</td>
                    <td className="py-2 px-2 text-muted-foreground">{a.applicant_class}</td>
                    <td className="py-2 px-2 text-muted-foreground hidden lg:table-cell">{(a as any).stream || "—"}</td>
                    <td className="py-2 px-2 capitalize text-muted-foreground hidden sm:table-cell">{a.gender}</td>
                    <td className="py-2 px-2 text-muted-foreground hidden xl:table-cell">{a.position}</td>
                    <td className="py-2 px-2 text-muted-foreground">{a.smart_score || "—"}</td>
                    <td className="py-2 px-2 text-muted-foreground">{a.conf_score || "—"}</td>
                    <td className="py-2 px-2 text-muted-foreground">{a.qapp_score || "—"}</td>
                    <td className="py-2 px-2">
                      <span className={`font-bold ${a.average_score >= minAverage ? "text-primary" : "text-destructive"}`}>
                        {a.average_score}
                      </span>
                    </td>
                    <td className="py-2 px-2 hidden 2xl:table-cell">
                      {a.comment ? <span className="text-[10px] text-muted-foreground truncate max-w-[150px] block" title={a.comment}>{a.comment}</span> : "—"}
                    </td>
                    <td className="py-2 px-2">
                      <Badge variant={a.status === "qualified" ? "default" : a.status === "disqualified" ? "destructive" : "secondary"} className="text-[10px] sm:text-xs">
                        {a.status}
                      </Badge>
                    </td>
                    <td className="py-2 px-2 flex flex-wrap gap-1 min-w-[140px]">
                      {isTopHead && !isCandidateLocked(a) && (
                        <>
                          {a.status === "pending" ? (
                            <>
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] sm:text-xs text-primary hover:bg-primary/10" onClick={() => updateStatus(a.id, "qualified")}>
                                Qualify
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] sm:text-xs text-destructive hover:bg-destructive/10" onClick={() => updateStatus(a.id, "disqualified")}>
                                Disqualify
                              </Button>
                            </>
                          ) : (
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] sm:text-xs" onClick={() => updateStatus(a.id, a.status === "qualified" ? "disqualified" : "qualified")}>
                              {a.status === "qualified" ? "Disqualify" : "Qualify"}
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Edit" onClick={() => openEditModal(a)}>
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive" title="Delete" onClick={() => handleDeleteCandidate(a.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {isCandidateLocked(a) && <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/20 h-6">Locked</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <DocumentViewer 
        isOpen={!!previewUrl} 
        onClose={() => { if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }} 
        fileUrl={previewUrl} 
        title={`Election Document Preview`} 
        type="pdf"
      />
    </div>
  );
}
