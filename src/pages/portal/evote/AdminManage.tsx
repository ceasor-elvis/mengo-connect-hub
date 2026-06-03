import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Pencil, Trash2, X, Users, FolderOpen, User, Camera, Layers, GitBranch,
  ToggleLeft, ToggleRight
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useStoreSync } from "@/hooks/useApi";
import {
  createCategory, updateCategory, deleteCategory,
  createVotingType, updateVotingType, deleteVotingType,
  addStream, removeStream,
  createCandidate, updateCandidateApi, deleteCandidate,
  fetchVotingTypes, fetchCategories, fetchCandidates, fetchStreams,
  type Category, type Candidate, type VotingType
} from "@/data/api";
import { toast } from "sonner";
import CachedImage from "@/components/CachedImage";

// ── Gradient initials helpers ──────────────────────────────────────────────────
const getInitials = (name: string) => {
  const parts = name.split(' ');
  return parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : name.slice(0, 2);
};
const gradients = [
  'from-blue-600 to-indigo-600',
  'from-emerald-500 to-teal-500',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-500',
];

const AdminManage = () => {
  const { isAuthed } = useAdminAuth("full_admin");
  const store = useStoreSync();

  const [tab, setTab] = useState<"types" | "categories" | "candidates" | "streams">("types");

  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([
          fetchVotingTypes(),
          fetchCategories(),
          fetchCandidates(),
          fetchStreams(),
        ]);
      } catch (err: any) {
        toast.error("Failed to load management data");
      }
    };
    init();
  }, []);

  // Voting Type modal
  const [vtModal, setVtModal] = useState(false);
  const [editVt, setEditVt] = useState<VotingType | null>(null);
  const [vtName, setVtName] = useState("");
  const [vtDesc, setVtDesc] = useState("");
  const [vtActive, setVtActive] = useState(true);
  const [vtConfirm, setVtConfirm] = useState(true);
  const [vtOrgName, setVtOrgName] = useState("");
  const [vtMotto, setVtMotto] = useState("");

  // Category modal
  const [catModal, setCatModal] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catVtId, setCatVtId] = useState("");
  const [catGender, setCatGender] = useState<"" | "male" | "female">("");

  // Candidate modal
  const [candModal, setCandModal] = useState(false);
  const [editCand, setEditCand] = useState<Candidate | null>(null);
  const [candName, setCandName] = useState("");
  const [candMotto, setCandMotto] = useState("");
  const [candCat, setCandCat] = useState("");
  const [candPhoto, setCandPhoto] = useState("");
  const [candPhotoFile, setCandPhotoFile] = useState<File | null>(null);
  const [candClass, setCandClass] = useState("");
  const [candStream, setCandStream] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stream
  const [newStream, setNewStream] = useState("");

  // ── Voting type handlers ──
  const openVtModal = (vt?: VotingType) => {
    setEditVt(vt || null);
    setVtName(vt?.name || "");
    setVtDesc(vt?.description || "");
    setVtActive(vt?.active ?? true);
    setVtConfirm(vt?.confirmPageEnabled ?? true);
    setVtOrgName(vt?.orgName || "");
    setVtMotto(vt?.motto || "");
    setVtModal(true);
  };
  const saveVt = async () => {
    if (!vtName.trim()) return;
    try {
      if (editVt) {
        await updateVotingType(editVt.id, { name: vtName, description: vtDesc, active: vtActive, confirmPageEnabled: vtConfirm, orgName: vtOrgName, motto: vtMotto });
        toast.success(`"${vtName}" updated successfully`);
      } else {
        await createVotingType({ name: vtName, description: vtDesc, active: vtActive, confirmPageEnabled: vtConfirm, orgName: vtOrgName, motto: vtMotto });
        toast.success(`"${vtName}" created successfully`);
      }
      setVtModal(false);
    } catch (err: any) {
      toast.error(`Failed to save voting type: ${err.message || "Unknown error"}`);
    }
  };

  const handleDeleteVt = async (vt: VotingType) => {
    try {
      await deleteVotingType(vt.id);
      toast.success(`"${vt.name}" deleted successfully`);
    } catch (err: any) {
      toast.error(`Failed to delete voting type: ${err.message || "Unknown error"}`);
    }
  };

  // ── Category handlers ──
  const openCatModal = (cat?: Category) => {
    setEditCat(cat || null);
    setCatName(cat?.name || "");
    setCatDesc(cat?.description || "");
    setCatVtId(cat?.votingTypeId || store.votingTypes[0]?.id || "");
    setCatGender(cat?.gender || "");
    setCatModal(true);
  };
  const saveCat = async () => {
    if (!catName.trim() || !catVtId) return;
    try {
      const data: any = { name: catName, description: catDesc, votingTypeId: catVtId, order: editCat?.order ?? store.categories.length + 1 };
      data.gender = catGender || null;
      if (editCat) {
        await updateCategory(editCat.id, data);
        toast.success(`"${catName}" updated successfully`);
      } else {
        await createCategory(data);
        toast.success(`"${catName}" created successfully`);
      }
      setCatModal(false);
    } catch (err: any) {
      toast.error(`Failed to save position: ${err.message || "Unknown error"}`);
    }
  };

  const handleDeleteCat = async (cat: Category) => {
    try {
      await deleteCategory(cat.id);
      toast.success(`"${cat.name}" deleted successfully`);
    } catch (err: any) {
      toast.error(`Failed to delete position: ${err.message || "Unknown error"}`);
    }
  };

  // ── Candidate handlers ──
  const openCandModal = (cand?: Candidate) => {
    setEditCand(cand || null);
    setCandName(cand?.name || "");
    setCandMotto(cand?.motto || "");
    setCandCat(cand?.categoryId || store.categories[0]?.id || "");
    setCandPhoto(cand?.photo || "");
    setCandPhotoFile(null);
    setCandClass(cand?.classLevel || "");
    setCandStream(cand?.stream || "");
    setCandModal(true);
  };
  const saveCand = async () => {
    if (!candName.trim() || !candCat) return;
    try {
      const formData = new FormData();
      formData.append("name", candName);
      formData.append("motto", candMotto);
      formData.append("category_id", candCat);
      if (candClass) formData.append("class_level", candClass);
      if (candStream) formData.append("stream", candStream);

      // Use the actual File object if a new one was uploaded
      if (candPhotoFile) {
        formData.append("photo", candPhotoFile, candPhotoFile.name);
      } else if (candPhoto && !candPhoto.startsWith("blob:")) {
        formData.append("photo_url", candPhoto);
      }

      if (editCand) {
        await updateCandidateApi(editCand.id, formData);
        toast.success(`"${candName}" updated successfully`);
      } else {
        await createCandidate(formData);
        toast.success(`"${candName}" added successfully`);
      }
      setCandModal(false);
    } catch (err: any) {
      toast.error(`Failed to save candidate: ${err.message || "Unknown error"}`);
    }
  };

  const handleDeleteCand = async (cand: Candidate) => {
    try {
      await deleteCandidate(cand.id);
      toast.success(`"${cand.name}" deleted successfully`);
    } catch (err: any) {
      toast.error(`Failed to delete candidate: ${err.message || "Unknown error"}`);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCandPhotoFile(file);
      setCandPhoto(URL.createObjectURL(file));
    }
  };

  const handleAddStream = async (name: string) => {
    try {
      await addStream(name);
      setNewStream("");
      toast.success(`Stream "${name}" added`);
    } catch (err: any) {
      toast.error(`Failed to add stream: ${err.message || "Unknown error"}`);
    }
  };

  const handleRemoveStream = async (name: string) => {
    try {
      await removeStream(name);
      toast.success(`Stream "${name}" removed`);
    } catch (err: any) {
      toast.error(`Failed to remove stream: ${err.message || "Unknown error"}`);
    }
  };

  const selectedCatObj = store.categories.find((c) => c.id === candCat);
  const isCouncillorCat = selectedCatObj?.gender === "male" || selectedCatObj?.gender === "female";

  const tabs = [
    { key: "types" as const, label: "Voting Types", icon: Layers, count: store.votingTypes.length },
    { key: "categories" as const, label: "Categories", icon: FolderOpen, count: store.categories.length },
    { key: "candidates" as const, label: "Candidates", icon: Users, count: store.candidates.length },
    { key: "streams" as const, label: "Streams", icon: GitBranch, count: store.streams.length },
  ];

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
  const itemVariants = { hidden: { opacity: 0, y: 16, scale: 0.97 }, show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } } };

  if (!isAuthed) return null;

  return (
    <AdminLayout title="Manage Election" subtitle="Types, positions, candidates & streams">
      <div className="space-y-6">

        {/* ── Animated Tab Bar ── */}
        <div className="flex gap-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-1.5 shadow-sm overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 flex-shrink-0"
              style={{ color: tab === t.key ? 'hsl(var(--primary))' : 'var(--muted-foreground)' }}
            >
              {tab === t.key && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary/10 rounded-lg"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <t.icon className={`w-4 h-4 ${tab === t.key ? 'text-primary' : 'text-slate-500'}`} />
              <span className={tab === t.key ? "text-primary" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"}>{t.label}</span>
              <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                tab === t.key
                  ? "bg-primary text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
              }`}>{t.count}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ── Voting Types Tab ── */}
          {tab === "types" && (
            <motion.div key="types" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white text-lg">Voting Types</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Independent election types (e.g. Prefects, Councillors)</p>
                </div>
                <button onClick={() => openVtModal()} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all shadow-sm">
                  <Plus className="w-4 h-4" /> Add Type
                </button>
              </div>
              <motion.div className="space-y-4" variants={containerVariants} initial="hidden" animate="show">
                {store.votingTypes.map((vt) => {
                  const catCount = store.categories.filter((c) => c.votingTypeId === vt.id).length;
                  return (
                    <motion.div key={vt.id} variants={itemVariants} className="group bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Layers className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-slate-900 dark:text-white">{vt.name}</h3>
                            {vt.active ? (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">ACTIVE</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">INACTIVE</span>
                            )}
                            {vt.confirmPageEnabled && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">ID VERIFY</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{vt.description} · {catCount} {catCount === 1 ? 'category' : 'categories'}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openVtModal(vt)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 hover:text-slate-900 dark:hover:text-white">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteVt(vt)} className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors text-rose-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
                {store.votingTypes.length === 0 && (
                  <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center text-slate-500 text-sm shadow-sm">
                    No voting types yet. Add one above.
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}

          {/* ── Categories Tab ── */}
          {tab === "categories" && (
            <motion.div key="categories" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white text-lg">Positions / Categories</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Define roles under each voting type. Set gender for councillor sub-categories.</p>
                </div>
                <button onClick={() => openCatModal()} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all shadow-sm">
                  <Plus className="w-4 h-4" /> Add Position
                </button>
              </div>

              {store.votingTypes.map((vt) => {
                const vtCats = store.categories.filter((c) => c.votingTypeId === vt.id);
                return (
                  <div key={vt.id} className="mb-8">
                    <div className="flex items-center gap-3 mb-4 pl-0">
                      <div className="w-1 h-6 rounded-full bg-primary flex-shrink-0" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">{vt.name}</h3>
                      <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">({vtCats.length})</span>
                    </div>
                    <motion.div className="space-y-3 pl-4 border-l-2 border-slate-100 dark:border-slate-800 ml-0.5" variants={containerVariants} initial="hidden" animate="show">
                      {vtCats.map((cat, i) => (
                        <motion.div key={cat.id} variants={itemVariants} className="group bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                              <span className="font-bold text-sm">{i + 1}</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-slate-900 dark:text-white">{cat.name}</h3>
                                {cat.gender && (
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                    cat.gender === "male"
                                      ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20"
                                      : "bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400 border-pink-200 dark:border-pink-500/20"
                                  }`}>
                                    {cat.gender}
                                  </span>
                                )}
                              </div>
                              {cat.description && <p className="text-xs text-slate-500 mt-0.5">{cat.description}</p>}
                            </div>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openCatModal(cat)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 hover:text-slate-900 dark:hover:text-white">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteCat(cat)} className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors text-rose-500">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                      {vtCats.length === 0 && (
                        <p className="text-xs text-slate-500 py-3 italic">No categories under this type.</p>
                      )}
                    </motion.div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* ── Candidates Tab ── */}
          {tab === "candidates" && (
            <motion.div key="candidates" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white text-lg">Candidates</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Manage participants. Councillor candidates include class & stream.</p>
                </div>
                <button onClick={() => openCandModal()} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all shadow-sm">
                  <Plus className="w-4 h-4" /> Add Candidate
                </button>
              </div>

              {store.categories.map((cat) => {
                const catCands = store.candidates.filter((c) => c.categoryId === cat.id);
                if (catCands.length === 0) return null;
                const vtName = store.votingTypes.find((v) => v.id === cat.votingTypeId)?.name || "";
                return (
                  <div key={cat.id} className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-1 h-6 rounded-full bg-primary flex-shrink-0" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">{vtName} › {cat.name}</h3>
                      <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full ml-1">({catCands.length})</span>
                    </div>
                    <motion.div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" variants={containerVariants} initial="hidden" animate="show">
                      {catCands.map((cand, idx) => (
                        <motion.div key={cand.id} variants={itemVariants} className="group bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                          {/* Photo area — 160px */}
                          <div className="relative h-40 overflow-hidden bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                            {cand.photo ? (
                              <CachedImage src={cand.photo} alt={cand.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className={`w-full h-full bg-gradient-to-br ${gradients[idx % gradients.length]} flex items-center justify-center opacity-90`}>
                                <span className="text-white text-4xl font-black tracking-tight select-none">
                                  {getInitials(cand.name).toUpperCase()}
                                </span>
                              </div>
                            )}
                            {/* Hover overlay with edit/delete */}
                            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] transition-all flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                              <button onClick={() => openCandModal(cand)} className="p-3 rounded-xl bg-white text-slate-900 hover:bg-slate-100 transition-colors shadow-lg">
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteCand(cand)} className="p-3 rounded-xl bg-rose-500 text-white hover:bg-rose-600 transition-colors shadow-lg">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          {/* Card bottom */}
                          <div className="p-4">
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">{cand.name}</h4>
                            {cand.motto && (
                              <p className="text-xs text-slate-500 mt-1 italic line-clamp-2">"{cand.motto}"</p>
                            )}
                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                              {cand.classLevel && (
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                                  {cand.classLevel}{cand.stream ? ` - ${cand.stream}` : ""}
                                </span>
                              )}
                              <span className="text-[10px] text-slate-500 font-medium ml-auto bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-100 dark:border-slate-800">
                                {cand.votes} votes
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* ── Streams Tab ── */}
          {tab === "streams" && (
            <motion.div key="streams" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <div className="mb-6">
                <h2 className="font-bold text-slate-900 dark:text-white text-lg">Class Streams</h2>
                <p className="text-sm text-slate-500 mt-0.5">Configure streams used for councillor candidates (e.g. A, B, C)</p>
              </div>

              {/* Class Levels */}
              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-6 mb-5">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4">
                  Class Levels <span className="text-slate-400 font-normal normal-case tracking-normal">(fixed)</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {store.classLevels.map((cl) => (
                    <span key={cl} className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
                      {cl}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-3">Senior 1 through Senior 6 (fixed, not editable)</p>
              </div>

              {/* Streams */}
              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-6">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4">Streams</h3>
                <div className="flex items-center gap-3 mb-6 max-w-sm">
                  <input
                    value={newStream}
                    onChange={(e) => setNewStream(e.target.value.toUpperCase())}
                    placeholder="e.g. A"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    onKeyDown={(e) => { if (e.key === 'Enter' && newStream.trim()) handleAddStream(newStream.trim()); }}
                  />
                  <button
                    onClick={() => { if (newStream.trim()) handleAddStream(newStream.trim()); }}
                    className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {store.streams.length === 0 && (
                    <p className="text-xs text-slate-500 italic">No streams configured yet. Add streams above.</p>
                  )}
                  <AnimatePresence>
                    {store.streams.map((s) => (
                      <motion.div
                        key={s}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold"
                      >
                        {s}
                        <button onClick={() => handleRemoveStream(s)} className="ml-1 hover:text-rose-500 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Voting Type Modal ── */}
      <AnimatePresence>
        {vtModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
            onClick={() => setVtModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full flex flex-col max-h-[90vh] shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{editVt ? "Edit" : "New"} Voting Type</h3>
                <button onClick={() => setVtModal(false)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500"><X className="w-5 h-5" /></button>
              </div>
              <div className="overflow-y-auto px-6 pb-6 pt-5 space-y-5">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 block">Name</label>
                  <input value={vtName} onChange={(e) => setVtName(e.target.value)} placeholder="e.g. Prefects" className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 block">Description</label>
                  <input value={vtDesc} onChange={(e) => setVtDesc(e.target.value)} placeholder="Brief description" className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 block">Organisation Name <span className="text-slate-400 font-normal normal-case">(optional)</span></label>
                  <input value={vtOrgName} onChange={(e) => setVtOrgName(e.target.value)} placeholder="e.g. THE VINE STUDENTS COUNCIL" className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 block">Motto <span className="text-slate-400 font-normal normal-case">(optional)</span></label>
                  <input value={vtMotto} onChange={(e) => setVtMotto(e.target.value)} placeholder="e.g. Integrity · Service · Excellence" className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Active</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Students can vote in this type</p>
                  </div>
                  <button onClick={() => setVtActive(!vtActive)} className="flex items-center">
                    {vtActive ? (
                      <ToggleRight className="w-8 h-8 text-primary" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-slate-400" />
                    )}
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">ID Verification</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Require registration number after code</p>
                  </div>
                  <button onClick={() => setVtConfirm(!vtConfirm)} className="flex items-center">
                    {vtConfirm ? (
                      <ToggleRight className="w-8 h-8 text-primary" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-slate-400" />
                    )}
                  </button>
                </div>
                
                <button onClick={saveVt} className="bg-primary text-white rounded-xl w-full py-3 font-bold text-sm shadow-sm hover:bg-primary/90 transition-colors">
                  {editVt ? "Update" : "Create"} Voting Type
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Category Modal ── */}
      <AnimatePresence>
        {catModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
            onClick={() => setCatModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full flex flex-col max-h-[90vh] shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{editCat ? "Edit" : "New"} Position</h3>
                <button onClick={() => setCatModal(false)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500"><X className="w-5 h-5" /></button>
              </div>
              <div className="overflow-y-auto px-6 pb-6 pt-5 space-y-5">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 block">Name</label>
                  <input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="e.g. President" className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 block">Description</label>
                  <input value={catDesc} onChange={(e) => setCatDesc(e.target.value)} placeholder="Brief description" className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 block">Voting Type</label>
                  <select value={catVtId} onChange={(e) => setCatVtId(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm">
                    {store.votingTypes.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 block">Gender (for councillors)</label>
                  <select value={catGender} onChange={(e) => setCatGender(e.target.value as any)} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm">
                    <option value="">None (regular position)</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <button onClick={saveCat} className="bg-primary text-white rounded-xl w-full py-3 font-bold text-sm shadow-sm hover:bg-primary/90 transition-colors">
                  {editCat ? "Update" : "Create"} Position
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Candidate Modal ── */}
      <AnimatePresence>
        {candModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-auto"
            onClick={() => setCandModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full flex flex-col max-h-[92vh] my-8 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{editCand ? "Edit" : "New"} Candidate</h3>
                <button onClick={() => setCandModal(false)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500"><X className="w-5 h-5" /></button>
              </div>
              <div className="overflow-y-auto px-6 pb-6 pt-5 space-y-4">
                <div className="flex justify-center">
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-1 overflow-hidden bg-slate-50 dark:bg-slate-950 group">
                    {candPhoto ? (
                      <CachedImage src={candPhoto} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <><Camera className="w-6 h-6 text-slate-400 group-hover:text-primary transition-colors" /><span className="text-[10px] text-slate-500">Upload</span></>
                    )}
                  </button>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 block">Full Name</label>
                  <input value={candName} onChange={(e) => setCandName(e.target.value)} placeholder="e.g. John Doe" className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 block">Motto</label>
                  <input value={candMotto} onChange={(e) => setCandMotto(e.target.value)} placeholder="Campaign slogan" className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 block">Position</label>
                  <select value={candCat} onChange={(e) => setCandCat(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm">
                    {store.categories.map((c) => {
                      const vtName = store.votingTypes.find((v) => v.id === c.votingTypeId)?.name || "";
                      return <option key={c.id} value={c.id}>{vtName} › {c.name}</option>;
                    })}
                  </select>
                </div>
                {isCouncillorCat && (
                  <>
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 block">Class Level</label>
                      <select value={candClass} onChange={(e) => setCandClass(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm">
                        <option value="">Select class</option>
                        {store.classLevels.map((cl) => <option key={cl} value={cl}>{cl}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 block">Stream</label>
                      <select value={candStream} onChange={(e) => setCandStream(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm">
                        <option value="">Select stream</option>
                        {store.streams.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </>
                )}
                <button onClick={saveCand} className="bg-primary text-white rounded-xl w-full py-3 font-bold text-sm shadow-sm hover:bg-primary/90 transition-colors mt-2">
                  {editCand ? "Update" : "Create"} Candidate
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default AdminManage;
