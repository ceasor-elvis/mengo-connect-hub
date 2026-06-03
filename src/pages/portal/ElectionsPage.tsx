import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Download, ShieldCheck, Settings2, UserCheck, Vote, Trash2, Pencil, Lock, Upload, FileText, Send, RotateCcw, LayoutGrid, List, Award, TrendingUp, UserMinus, Sparkles } from "lucide-react";
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

const getGradient = (name: string) => {
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gradients = [
    "from-primary to-primary/80",
    "from-accent to-accent/80",
    "from-indigo-600 to-indigo-400",
    "from-emerald-600 to-emerald-400",
    "from-teal-600 to-teal-400",
    "from-slate-700 to-slate-500"
  ];
  return gradients[hash % gradients.length];
};

const getInitials = (name: string) => {
  if (!name) return "??";
  return name.split(" ").slice(0, 2).map(p => p[0]).join("").toUpperCase();
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
  const navigate = useNavigate();
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
  const [isTransferring, setIsTransferring] = useState(false);

  const [roles, setRoles] = useState<any[]>([]);
  const [isCustomPosition, setIsCustomPosition] = useState(false);
  const [customPosition, setCustomPosition] = useState("");
  const [isEditCustomPosition, setIsEditCustomPosition] = useState(false);
  const [editCustomPosition, setEditCustomPosition] = useState("");

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [votingTypes, setVotingTypes] = useState<any[]>([]);
  const [selectedVotingTypeId, setSelectedVotingTypeId] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const fetchRoles = async () => {
    try {
      const { data } = await api.get("/users/all-roles/");
      setRoles(data);
      if (data.length > 0) {
        setNewPosition(data[0].role);
      }
    } catch (e) {
      console.error("Failed to fetch roles", e);
    }
  };

  const fetchVotingTypes = async () => {
    try {
      const { data } = await api.get("/voting-types");
      setVotingTypes(data);
      if (data.length > 0) {
        setSelectedVotingTypeId(data[0].id);
      }
    } catch (e) {
      console.error("Failed to fetch voting types", e);
    }
  };

  const fetchCategoriesForType = async (typeId: string) => {
    if (!typeId) return;
    try {
      const { data } = await api.get(`/categories?voting_type_id=${typeId}`);
      setCategories(data);
      setSelectedCategoryId("auto");
      setIsNewCategory(false);
    } catch (e) {
      console.error("Failed to fetch categories", e);
    }
  };

  useEffect(() => {
    if (selectedVotingTypeId) {
      fetchCategoriesForType(selectedVotingTypeId);
    }
  }, [selectedVotingTypeId]);

  const openTransferModal = () => {
    fetchVotingTypes();
    setIsTransferModalOpen(true);
  };

  const handleTransferToEvote = async () => {
    const qualifiedInFilter = filteredApplicants.filter(a => a.status === "qualified");
    if (qualifiedInFilter.length === 0) {
      toast.error("No qualified candidates in the current filter to transfer.");
      return;
    }

    setIsTransferring(true);
    try {
      const payload = {
        voting_type_id: selectedVotingTypeId,
        candidate_ids: qualifiedInFilter.map(a => a.id),
        category_id: isNewCategory || selectedCategoryId === "auto" ? null : (selectedCategoryId || null),
        category_name: isNewCategory ? newCategoryName : null,
      };

      const { data } = await api.post("/election/transfer-qualified", payload);
      toast.success(data.detail || "Successfully transferred candidates to e-voting!");
      setIsTransferModalOpen(false);
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to transfer candidates to e-voting.");
    } finally {
      setIsTransferring(false);
    }
  };

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
    fetchRoles();
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
    const positionToSend = isCustomPosition ? customPosition : newPosition;
    if (!positionToSend) {
      toast.error("Please specify a position");
      return;
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
        position: positionToSend,
        status: "pending",
      });
      toast.success("Candidate added!");
      setAddOpen(false);
      setNewName(""); setNewClass(""); setNewStream(""); 
      setNewGender("male"); setNewSmart(""); setNewConf(""); setNewQapp(""); setNewComment("");
      setCustomPosition("");
      setIsCustomPosition(false);
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
    setEditComment(a.comment || "");

    const positionExists = roles.some(r => r.role === a.position);
    if (positionExists) {
      setEditPosition(a.position || "");
      setIsEditCustomPosition(false);
      setEditCustomPosition("");
    } else {
      setEditPosition("custom");
      setIsEditCustomPosition(true);
      setEditCustomPosition(a.position || "");
    }
  };

  const saveEditCandidate = async () => {
    if (!editingId) return;
    const positionToSend = isEditCustomPosition ? editCustomPosition : editPosition;
    if (!positionToSend) {
      toast.error("Please specify a position");
      return;
    }
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
        position: positionToSend,
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
    <div className="space-y-6">
      {/* Header Panel with Premium Gradient Border & Shadow */}
      <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/40 p-6 backdrop-blur-md shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="absolute top-0 left-0 h-1.5 w-full bg-hero-gradient" />
        <div className="space-y-1">
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-accent animate-pulse" />
            Electoral Commission Board
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium max-w-lg">
            Evaluate, screen, and manage candidates for {orgName}. Access configurations, lock parameters, and print secure ballot sheets.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
          {isTopHead && (
            <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
              {canManageStreams && (
                <Dialog open={addStreamOpen} onOpenChange={setAddStreamOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 text-xs font-semibold hover:bg-muted/50 transition-colors">
                      <Plus className="mr-1.5 h-3.5 w-3.5 text-primary" /> Add Stream
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>Add New Stream</DialogTitle></DialogHeader>
                    <div className="space-y-3 pt-2">
                      <div>
                        <Label>Stream Name</Label>
                        <Input value={newStreamName} onChange={e => setNewStreamName(e.target.value)} placeholder="e.g. NORTH" />
                      </div>
                      <Button onClick={handleAddStream} className="w-full font-bold" disabled={addingStream}>
                        {addingStream ? "Saving..." : "Save Stream"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              {isLocked ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 select-none text-[10px] font-bold uppercase tracking-wider">
                  <Lock className="h-3.5 w-3.5 animate-pulse" />
                  <span>Locked</span>
                  {canUnlock && (
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] hover:bg-destructive/15 text-destructive ml-1" onClick={unlockFilter}>
                      Unlock
                    </Button>
                  )}
                </div>
              ) : (
                <Button variant="outline" size="sm" className="h-9 text-xs font-semibold border-primary/20 hover:bg-primary/5" onClick={lockFilter} disabled={!isTopHead}>
                  <Lock className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" /> Lock Criteria
                </Button>
              )}
              {activeLocks.length > 0 && isTopHead && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="secondary" size="sm" className="h-9 text-xs font-semibold relative">
                      <ShieldCheck className="mr-1.5 h-3.5 w-3.5 text-emerald-500" /> 
                      Locks Summary
                      <Badge className="ml-1.5 h-4 min-w-[16px] px-1 bg-primary text-[9px] flex items-center justify-center font-bold">
                        {activeLocks.length}
                      </Badge>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5 text-primary" /> Active Locks Summary
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
              <Button variant="outline" size="sm" className="h-9 text-xs font-semibold" onClick={generateCriteriaPDF}>
                <FileText className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" /> Log Criteria
              </Button>
              <Button variant="outline" size="sm" className="h-9 text-xs font-semibold" onClick={() => setShowSettings(!showSettings)}>
                <Settings2 className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" /> Config
              </Button>
              {isTopHead && (
                <Button variant="outline" size="sm" className="h-9 text-xs font-semibold hover:bg-destructive/5 border-destructive/20 text-destructive hover:text-destructive" onClick={() => navigate("/portal/elections/control")}>
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset & Controls
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Statistics Dashboard Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        {[
          { label: "Total Candidates", value: filteredApplicants.length, icon: UserCheck, color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20" },
          { label: "Avg Total /30", value: avgTotal.toFixed(1), icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20" },
          { label: "Avg Percentage", value: `${avgPerc.toFixed(1)}%`, icon: Sparkles, color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20" },
          { label: "Highest Score", value: highest, icon: Award, color: "text-indigo-500", bg: "bg-indigo-500/10 border-indigo-500/20" },
          { label: "Lowest Score", value: lowest, icon: UserMinus, color: "text-rose-500", bg: "bg-rose-500/10 border-rose-500/20" },
          { label: "Qualified Count", value: `${qualified}/${filteredApplicants.length}`, icon: Vote, color: "text-primary", bg: "bg-primary/10 border-primary/20" }
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="border border-border/50 bg-card/50 backdrop-blur-md shadow-md hover:-translate-y-1 hover:shadow-lg hover:border-primary/25 transition-all duration-300">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <div className={`p-2 rounded-xl ${stat.bg} mb-2`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{stat.value}</span>
                <span className="text-[9px] sm:text-[10px] text-muted-foreground uppercase font-semibold mt-1 tracking-wider">{stat.label}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Advanced Settings & Branding Panel */}
      {showSettings && (
        <Card className="border border-primary/20 bg-primary/5 shadow-inner overflow-hidden animate-in slide-in-from-top-3 fade-in duration-300">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-primary font-bold">
              <Settings2 className="h-5 w-5" />
              <h3 className="text-sm font-bold uppercase tracking-wider">Screening & Evaluation Configurations</h3>
            </div>
            
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Minimum Target Score (/30)</Label>
                <div className="flex gap-2">
                  <Input type="number" min={0} max={30} value={minAverage} onChange={e => setMinAverage(Number(e.target.value))} className="bg-background max-w-[120px]" />
                  <Button variant="outline" size="sm" onClick={handleSetThresholdFromAvg} className="h-10 text-xs">
                    Use Class Avg ({avgTotal.toFixed(0)})
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Election Session Title</Label>
                <Input value={electionTitle} onChange={e => setElectionTitle(e.target.value)} className="bg-background" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Document Branding Header</Label>
                <Input value={orgName} onChange={e => setOrgName(e.target.value)} className="bg-background" />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-primary/10">
              <p className="text-xs text-muted-foreground italic">
                Auto-screening moves applicants with a total score of at least <strong className="text-foreground">{minAverage}/30</strong> to 'qualified' status.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setExportType("criteria"); setIsExportOpen(true); }} className="text-xs">
                  <FileText className="mr-1 h-3.5 w-3.5" /> Log Criteria
                </Button>
                <Button size="sm" onClick={handleAutoScreen} disabled={isLocked} className="text-xs font-bold">
                  <UserCheck className="mr-1 h-3.5 w-3.5" /> Apply Auto-Screen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interactive Filters Panel */}
      <Card className="border border-border/40 bg-card/60 backdrop-blur-md shadow-lg">
        <CardContent className="p-4 sm:p-6 grid gap-4 sm:grid-cols-4 items-end">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Search Candidate</Label>
            <Input placeholder="Search name..." value={filterSearch} onChange={e => setFilterSearch(e.target.value)} className="h-9 bg-background/50" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Target Class</Label>
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="h-9 bg-background/50"><SelectValue placeholder="All Classes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {["S.1", "S.2", "S.3", "S.4", "S.5", "S.6"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Stream Option</Label>
            <Select value={filterStream} onValueChange={setFilterStream}>
              <SelectTrigger className="h-9 bg-background/50"><SelectValue placeholder="All Streams" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Streams</SelectItem>
                {streams.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Gender Filter</Label>
            <Select value={filterGender} onValueChange={setFilterGender}>
              <SelectTrigger className="h-9 bg-background/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Roster Layout & Workspace */}
      <div className="space-y-4">
        {/* Workspace Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/40 p-3 rounded-xl border border-border/30">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Vote className="h-4 w-4 text-primary" /> Evaluation Roster
            </h2>
            <Badge variant="secondary" className="px-2 py-0.5 text-xs font-semibold">
              {filteredApplicants.length} Candidates
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center rounded-lg border border-border/80 bg-background p-0.5">
              <Button 
                variant={viewMode === "grid" ? "secondary" : "ghost"} 
                size="sm" 
                className="h-7 px-2.5 text-xs gap-1 font-semibold cursor-pointer" 
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-3.5 w-3.5" /> Grid
              </Button>
              <Button 
                variant={viewMode === "table" ? "secondary" : "ghost"} 
                size="sm" 
                className="h-7 px-2.5 text-xs gap-1 font-semibold cursor-pointer" 
                onClick={() => setViewMode("table")}
              >
                <List className="h-3.5 w-3.5" /> List
              </Button>
            </div>

            {/* Quick Actions Panel */}
            {isTopHead && !isLocked && (
              <div className="flex items-center gap-1.5">
                <Dialog open={addOpen} onOpenChange={setAddOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-8 text-xs font-bold bg-primary hover:bg-primary/95 text-primary-foreground shadow-sm">
                      <Plus className="mr-1 h-3.5 w-3.5" /> Add Candidate
                    </Button>
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
                      <div className="space-y-1">
                        <Label>Position *</Label>
                        {isCustomPosition ? (
                          <div className="flex gap-2">
                            <Input value={customPosition} onChange={e => setCustomPosition(e.target.value)} placeholder="Enter custom position" />
                            <Button type="button" variant="outline" size="sm" onClick={() => { setIsCustomPosition(false); if(roles.length > 0) setNewPosition(roles[0].role); }}>Select</Button>
                          </div>
                        ) : (
                          <Select value={newPosition} onValueChange={(val) => {
                            if (val === "custom") {
                              setIsCustomPosition(true);
                              setCustomPosition("");
                            } else {
                              setNewPosition(val);
                            }
                          }}>
                            <SelectTrigger><SelectValue placeholder="Select Position" /></SelectTrigger>
                            <SelectContent>
                              {roles.map((r) => (
                                <SelectItem key={r.role} value={r.role}>
                                  {r.role.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                                </SelectItem>
                              ))}
                              <SelectItem value="custom" className="text-primary font-medium">+ Custom Position...</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      <div><Label>Comment</Label><Input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Optional comment" /></div>
                      <Button onClick={handleAddCandidate} className="w-full">Add Candidate</Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="h-8 text-xs font-semibold">
                      <Upload className="mr-1 h-3.5 w-3.5" /> Upload Excel
                    </Button>
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
              </div>
            )}
          </div>
        </div>

        {/* candidate grid / cards view (Grid Mode) */}
        {viewMode === "grid" ? (
          filteredApplicants.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-2xl bg-card/25 border-border/80">
              <UserCheck className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-semibold text-muted-foreground">No candidates match the active filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredApplicants.map((a) => {
                const initials = getInitials(a.applicant_name || "");
                const gradient = getGradient(a.applicant_name || "");
                const scorePercentage = (a.average_score / 30) * 100;
                
                return (
                  <Card key={a.id} className="relative overflow-hidden border border-border/50 bg-card/60 backdrop-blur-md shadow-md hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group">
                    {/* Qualification indicator top-bar */}
                    <div className={`absolute top-0 left-0 h-1 w-full ${
                      a.status === "qualified" 
                        ? "bg-green-500" 
                        : a.status === "disqualified" 
                        ? "bg-red-500" 
                        : "bg-amber-500"
                    }`} />

                    {/* Card Actions overlay at top right */}
                    {isTopHead && !isCandidateLocked(a) && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-background/90 backdrop-blur-sm p-1 rounded-lg border shadow-sm z-10">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-muted" onClick={() => openEditModal(a)}>
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-destructive/10 text-destructive" onClick={() => handleDeleteCandidate(a.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}

                    {isCandidateLocked(a) && (
                      <div className="absolute top-3 right-3 z-10">
                        <Badge variant="outline" className="bg-destructive/15 text-destructive border-destructive/25 text-[9px] font-bold uppercase tracking-wider py-0.5 px-1.5 flex items-center gap-1">
                          <Lock className="h-2.5 w-2.5" /> Locked
                        </Badge>
                      </div>
                    )}

                    <CardContent className="p-5 space-y-4">
                      {/* Top Row: Avatar & Profile */}
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center text-white text-sm font-bold shadow-md bg-gradient-to-br ${gradient}`}>
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-foreground text-sm truncate leading-tight">{a.applicant_name}</h4>
                          <span className="text-[10px] font-bold text-primary uppercase tracking-wider mt-0.5 block">{a.position}</span>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            <Badge variant="outline" className="text-[9px] font-medium bg-muted/50 py-0 px-1.5 border-border/60">
                              {a.applicant_class}
                            </Badge>
                            {a.stream && (
                              <Badge variant="outline" className="text-[9px] font-medium bg-muted/50 py-0 px-1.5 border-border/60">
                                {a.stream}
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-[9px] font-medium bg-muted/50 py-0 px-1.5 capitalize border-border/60">
                              {a.gender}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Middle Row: Score Breakdown bars */}
                      <div className="space-y-2 border-y border-border/50 py-3 my-2">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] font-semibold text-muted-foreground">
                            <span>Smartness</span>
                            <span>{a.smart_score || 0}/10</span>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${(a.smart_score || 0) * 10}%` }} />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] font-semibold text-muted-foreground">
                            <span>Confidence</span>
                            <span>{a.conf_score || 0}/10</span>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-accent" style={{ width: `${(a.conf_score || 0) * 10}%` }} />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] font-semibold text-muted-foreground">
                            <span>Quick Application (Q.A)</span>
                            <span>{a.qapp_score || 0}/10</span>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500" style={{ width: `${(a.qapp_score || 0) * 10}%` }} />
                          </div>
                        </div>
                      </div>

                      {/* Comment section */}
                      {a.comment && (
                        <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40 text-[10px] text-muted-foreground italic leading-relaxed">
                          "{a.comment}"
                        </div>
                      )}

                      {/* Bottom Footer: Stats summary + Decision action bar */}
                      <div className="flex items-center justify-between gap-2 border-t border-border/30 pt-3">
                        <div className="flex flex-col">
                          <span className="text-[9px] uppercase font-bold text-muted-foreground">Total Score</span>
                          <span className={`text-base font-extrabold ${a.average_score >= minAverage ? "text-primary" : "text-destructive"}`}>
                            {a.average_score} <span className="text-[10px] font-medium text-muted-foreground">({scorePercentage.toFixed(0)}%)</span>
                          </span>
                        </div>

                        {/* Decision Buttons */}
                        {isTopHead && !isCandidateLocked(a) ? (
                          <div className="flex gap-1.5">
                            {a.status === "pending" ? (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-8 px-3 text-[10px] font-bold border-green-500/30 text-green-500 hover:bg-green-500/10 hover:text-green-500" 
                                  onClick={() => updateStatus(a.id, "qualified")}
                                >
                                  Qualify
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-8 px-3 text-[10px] font-bold border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-500" 
                                  onClick={() => updateStatus(a.id, "disqualified")}
                                >
                                  Disqualify
                                </Button>
                              </>
                            ) : (
                              <Button 
                                variant={a.status === "qualified" ? "destructive" : "default"} 
                                size="sm" 
                                className="h-8 px-3 text-[10px] font-bold" 
                                onClick={() => updateStatus(a.id, a.status === "qualified" ? "disqualified" : "qualified")}
                              >
                                {a.status === "qualified" ? "Disqualify" : "Qualify"}
                              </Button>
                            )}
                          </div>
                        ) : (
                          <Badge variant={a.status === "qualified" ? "default" : a.status === "disqualified" ? "destructive" : "secondary"} className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                            {a.status}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )
        ) : (
          /* Redesigned Premium Table list view (Table Mode) */
          <Card className="border border-border/50 shadow-md bg-card/60 backdrop-blur-md overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm min-w-[500px]">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground">
                      <th className="py-3 px-4 text-left font-bold uppercase tracking-wider text-[10px]">Candidate Details</th>
                      <th className="py-3 px-2 text-left font-bold uppercase tracking-wider text-[10px] hidden sm:table-cell">Gender</th>
                      <th className="py-3 px-2 text-left font-bold uppercase tracking-wider text-[10px] hidden xl:table-cell">Target Position</th>
                      <th className="py-3 px-2 text-center font-bold uppercase tracking-wider text-[10px]">Smt</th>
                      <th className="py-3 px-2 text-center font-bold uppercase tracking-wider text-[10px]">Cnf</th>
                      <th className="py-3 px-2 text-center font-bold uppercase tracking-wider text-[10px]">Q.A</th>
                      <th className="py-3 px-3 text-center font-bold uppercase tracking-wider text-[10px] text-primary">Total</th>
                      <th className="py-3 px-3 text-left font-bold uppercase tracking-wider text-[10px] hidden xl:table-cell">Evaluator Comment</th>
                      <th className="py-3 px-4 text-center font-bold uppercase tracking-wider text-[10px]">Status</th>
                      <th className="py-3 px-4 text-right font-bold uppercase tracking-wider text-[10px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {loading ? (
                      <tr><td colSpan={10} className="py-12 text-center text-muted-foreground font-semibold">Loading Candidates...</td></tr>
                    ) : filteredApplicants.length === 0 ? (
                      <tr><td colSpan={10} className="py-12 text-center text-muted-foreground font-semibold">No candidates match the active filters.</td></tr>
                    ) : filteredApplicants.map((a) => (
                      <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold bg-gradient-to-br ${getGradient(a.applicant_name || "")}`}>
                              {getInitials(a.applicant_name || "")}
                            </div>
                            <div>
                              <span className="font-bold text-foreground block">{a.applicant_name}</span>
                              <div className="flex gap-1.5 mt-0.5">
                                <span className="text-[9px] font-semibold text-muted-foreground">{a.applicant_class}</span>
                                {a.stream && <span className="text-[9px] font-semibold text-muted-foreground">• {a.stream}</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 capitalize text-muted-foreground hidden sm:table-cell">{a.gender}</td>
                        <td className="py-3 px-2 text-muted-foreground font-semibold hidden xl:table-cell">{a.position}</td>
                        <td className="py-3 px-2 text-center text-muted-foreground font-mono">{a.smart_score || 0}</td>
                        <td className="py-3 px-2 text-center text-muted-foreground font-mono">{a.conf_score || 0}</td>
                        <td className="py-3 px-2 text-center text-muted-foreground font-mono">{a.qapp_score || 0}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`font-extrabold font-mono text-sm ${a.average_score >= minAverage ? "text-primary" : "text-destructive"}`}>
                            {a.average_score}
                          </span>
                        </td>
                        <td className="py-3 px-3 hidden xl:table-cell text-muted-foreground italic text-[11px] max-w-[200px] truncate" title={a.comment || ""}>
                          {a.comment ? `"${a.comment}"` : "—"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={a.status === "qualified" ? "default" : a.status === "disqualified" ? "destructive" : "secondary"} className="text-[10px] uppercase font-bold tracking-wider py-0.5 px-2">
                            {a.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end items-center gap-1">
                            {isTopHead && !isCandidateLocked(a) ? (
                              <>
                                <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] font-semibold" onClick={() => updateStatus(a.id, a.status === "qualified" ? "disqualified" : "qualified")}>
                                  {a.status === "qualified" ? "Disqualify" : "Qualify"}
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditModal(a)}>
                                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDeleteCandidate(a.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            ) : isCandidateLocked(a) ? (
                              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[9px] uppercase tracking-tighter">Locked</Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">None</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Export Options Toolbar */}
      <Card className="border border-border/40 bg-card/40 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">Report & Transfer Center</h4>
          <p className="text-[10px] text-muted-foreground leading-normal">
            Generate printable ballot papers, qualify reports, or sync screened candidates directly to the e-voting database.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center justify-end w-full sm:w-auto">
          <Button variant="outline" size="sm" className="h-9 text-xs font-semibold" onClick={() => { setExportType("qualified"); setIsExportOpen(true); }}>
            <FileText className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" /> Qualified List
          </Button>
          <Button variant="outline" size="sm" className="h-9 text-xs font-semibold" onClick={() => { setExportType("ballot"); setIsExportOpen(true); }}>
            <Download className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" /> Generate Ballot
          </Button>
          <Button variant="outline" size="sm" className="h-9 text-xs font-semibold" onClick={() => { setExportType("screening"); setIsExportOpen(true); }}>
            <FileText className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" /> Full Screening
          </Button>
          {isTopHead && (
            <Button variant="default" size="sm" className="h-9 text-xs font-bold bg-primary hover:bg-primary/95 text-primary-foreground shadow-sm" onClick={openTransferModal}>
              <Send className="mr-1.5 h-3.5 w-3.5" /> Transfer to E-Voting
            </Button>
          )}
        </div>
      </Card>

      {/* Modals & Dialogs */}
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

      <Dialog open={isTransferModalOpen} onOpenChange={setIsTransferModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Transfer Qualified Candidates to E-Voting</DialogTitle>
            <DialogDescription>
              Select the target e-voting election type and category.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Voting Type (Election)</Label>
              <Select value={selectedVotingTypeId} onValueChange={setSelectedVotingTypeId}>
                <SelectTrigger><SelectValue placeholder="Select Election" /></SelectTrigger>
                <SelectContent>
                  {votingTypes.map((vt) => (
                    <SelectItem key={vt.id} value={vt.id}>{vt.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Target Voting Category</Label>
              {isNewCategory ? (
                <div className="flex gap-2 mt-1">
                  <Input 
                    value={newCategoryName} 
                    onChange={e => setNewCategoryName(e.target.value)} 
                    placeholder="Enter new category name (e.g. S.4A Class Monitor)" 
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsNewCategory(false)}>Select Existing</Button>
                </div>
              ) : (
                <Select value={selectedCategoryId} onValueChange={(val) => {
                  if (val === "new") {
                    setIsNewCategory(true);
                    setNewCategoryName("");
                  } else {
                    setSelectedCategoryId(val);
                  }
                }}>
                  <SelectTrigger><SelectValue placeholder="Select existing or create new" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Automatic (By Candidate's Position)</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                    <SelectItem value="new" className="text-primary font-medium">+ Create New Category...</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTransferModalOpen(false)}>Cancel</Button>
            <Button onClick={handleTransferToEvote} disabled={isTransferring}>
              {isTransferring ? "Transferring..." : "Start Transfer"}
            </Button>
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
            <div className="space-y-1">
              <Label>Position *</Label>
              {isEditCustomPosition ? (
                <div className="flex gap-2">
                  <Input value={editCustomPosition} onChange={e => setEditCustomPosition(e.target.value)} placeholder="Enter custom position" />
                  <Button type="button" variant="outline" size="sm" onClick={() => { setIsEditCustomPosition(false); if(roles.length > 0) setEditPosition(roles[0].role); }}>Select</Button>
                </div>
              ) : (
                <Select value={editPosition} onValueChange={(val) => {
                  if (val === "custom") {
                    setIsEditCustomPosition(true);
                    setEditCustomPosition("");
                  } else {
                    setEditPosition(val);
                  }
                }}>
                  <SelectTrigger><SelectValue placeholder="Select Position" /></SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.role} value={r.role}>
                        {r.role.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom" className="text-primary font-medium">+ Custom Position...</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            <div><Label>Comment</Label><Input value={editComment} onChange={e => setEditComment(e.target.value)} /></div>
            <DialogFooter className="mt-4">
              <Button onClick={saveEditCandidate} className="w-full font-bold">Save Changes</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <DocumentViewer 
        isOpen={!!previewUrl} 
        onClose={() => { if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }} 
        fileUrl={previewUrl} 
        title="Election Document Preview" 
        type="pdf"
      />
    </div>
  );
}
