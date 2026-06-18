import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, RotateCcw, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ElectionControlPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pendingResetType, setPendingResetType] = useState<"screening" | "evote" | null>(null);

  // Screening States
  const [clearApps, setClearApps] = useState(false);
  const [clearStreams, setClearStreams] = useState(false);
  const [clearLocks, setClearLocks] = useState(false);

  // E-Voting States
  const [clearEvoteResults, setClearEvoteResults] = useState(false);
  const [clearEvoteCodes, setClearEvoteCodes] = useState(false);
  const [clearEvoteAll, setClearEvoteAll] = useState(false);

  // Scoped E-Voting & Category Preservation States
  const [votingTypes, setVotingTypes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedVotingTypeId, setSelectedVotingTypeId] = useState<string>("global");
  const [excludeCategoryIds, setExcludeCategoryIds] = useState<string[]>([]);

  const fetchData = async () => {
    try {
      const [vtRes, catRes] = await Promise.all([
        api.get("/voting-types"),
        api.get("/categories")
      ]);
      setVotingTypes(vtRes.data || []);
      setCategories(catRes.data || []);
    } catch (e) {
      console.error("Failed to load control page data", e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter categories shown to the user based on selected voting type
  const filteredCategories = selectedVotingTypeId === "global"
    ? categories
    : categories.filter(c => c.voting_type_id === selectedVotingTypeId);

  const handleResetRequest = (type: "screening" | "evote") => {
    const isScreening = type === "screening";
    const hasSelections = isScreening
      ? clearApps || clearStreams || clearLocks
      : clearEvoteResults || clearEvoteCodes || clearEvoteAll;

    if (!hasSelections) {
      toast.warning("Please select at least one option to clear.");
      return;
    }
    setPendingResetType(type);
  };

  const handleReset = async (type: "screening" | "evote") => {
    const isScreening = type === "screening";
    setPendingResetType(null);

    setLoading(true);
    try {
      const payload = isScreening
        ? {
            clear_screening_apps: clearApps,
            clear_screening_streams: clearStreams,
            clear_screening_locks: clearLocks,
          }
        : {
            clear_evote_results: clearEvoteResults,
            clear_evote_codes: clearEvoteCodes,
            clear_evote_all: clearEvoteAll,
            voting_type_id: selectedVotingTypeId === "global" ? null : selectedVotingTypeId,
            exclude_category_ids: excludeCategoryIds,
          };

      const { data } = await api.post("/election/reset", payload);
      toast.success(data.detail || "Data reset successfully!");

      // Refresh data
      fetchData();

      // Reset checkboxes
      if (isScreening) {
        setClearApps(false);
        setClearStreams(false);
        setClearLocks(false);
      } else {
        setClearEvoteResults(false);
        setClearEvoteCodes(false);
        setClearEvoteAll(false);
        setExcludeCategoryIds([]);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to reset election data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="space-y-1">
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Election Control Center
          </h1>
          <p className="text-sm text-muted-foreground">
            Perform post-election cleanup, delete generated codes, or completely reset the voting systems.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/portal/elections")}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to EC
        </Button>
      </div>

      <div className="p-4 bg-destructive/10 rounded-xl border border-destructive/20 flex gap-3 text-destructive">
        <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-bold uppercase tracking-wider">Warning: Destructive Actions</p>
          <p className="text-xs opacity-90 leading-relaxed">
            The controls on this page delete live database records. Make sure you have exported all PDF reports, qualified candidate lists, and voting sheets before initiating a reset.
          </p>
        </div>
      </div>

      {/* Grid of portal controls */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Card 1: Screening Controls */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base font-bold">Screening Board Cleanup</CardTitle>
            <CardDescription className="text-xs">
              Clear application logs and screening parameters in the main council portal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Checkbox 
                  id="clearApps" 
                  checked={clearApps} 
                  onCheckedChange={(checked) => setClearApps(!!checked)} 
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="clearApps" className="text-xs font-semibold cursor-pointer">
                    Clear Candidate Applications
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    Removes all candidate screening profiles and scores. <span className="font-semibold text-primary/80">(Class streams remain intact)</span>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Checkbox 
                  id="clearLocks" 
                  checked={clearLocks} 
                  onCheckedChange={(checked) => setClearLocks(!!checked)} 
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="clearLocks" className="text-xs font-semibold cursor-pointer">
                    Release Access Locks
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    Unlocks all evaluation categories for EC members.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Checkbox 
                  id="clearStreams" 
                  checked={clearStreams} 
                  onCheckedChange={(checked) => setClearStreams(!!checked)} 
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="clearStreams" className="text-xs font-semibold cursor-pointer text-destructive">
                    Reset Candidate Streams
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    Deletes all predefined class stream options. <span className="font-semibold text-muted-foreground/80">(Leave unchecked to preserve streams)</span>
                  </p>
                </div>
              </div>
            </div>

            <Button 
              variant="destructive" 
              className="w-full text-xs font-bold" 
              onClick={() => handleResetRequest("screening")}
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-1.5 h-4 w-4" />}
              Clear Selected Screening Data
            </Button>
          </CardContent>
        </Card>

        {/* Card 2: E-Voting Controls */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base font-bold">E-Voting Portal Reset</CardTitle>
            <CardDescription className="text-xs">
              Clear cast votes, codes, and candidates from the digital e-voting system.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Scope Selection */}
            <div className="space-y-2 pb-2 border-b border-border/60">
              <Label htmlFor="votingTypeSelect" className="text-xs font-semibold">
                Election Scope
              </Label>
              <Select
                value={selectedVotingTypeId}
                onValueChange={(val) => {
                  setSelectedVotingTypeId(val);
                  setExcludeCategoryIds([]); // Reset exclusion list when scope changes
                }}
              >
                <SelectTrigger id="votingTypeSelect" className="w-full text-xs h-9">
                  <SelectValue placeholder="Select scope..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global" className="text-xs">
                    All Elections (Global Reset)
                  </SelectItem>
                  {votingTypes.map((vt) => (
                    <SelectItem key={vt.id} value={vt.id} className="text-xs">
                      {vt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Checkbox 
                  id="clearEvoteResults" 
                  checked={clearEvoteResults} 
                  onCheckedChange={(checked) => {
                    setClearEvoteResults(!!checked);
                    if (checked) setClearEvoteAll(false); // mutually exclusive with full reset
                  }} 
                  disabled={clearEvoteAll}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="clearEvoteResults" className="text-xs font-semibold cursor-pointer">
                    Reset Candidate Votes
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    Deletes cast votes and all candidate listings. <span className="font-semibold text-primary/80">(Voting categories remain intact)</span>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Checkbox 
                  id="clearEvoteCodes" 
                  checked={clearEvoteCodes} 
                  onCheckedChange={(checked) => setClearEvoteCodes(!!checked)} 
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="clearEvoteCodes" className="text-xs font-semibold cursor-pointer">
                    Wipe Voting Codes
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    Removes all generated coupons and class keys.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 border-t pt-2">
                <Checkbox 
                  id="clearEvoteAll" 
                  checked={clearEvoteAll} 
                  onCheckedChange={(checked) => {
                    setClearEvoteAll(!!checked);
                    if (checked) {
                      setClearEvoteResults(false);
                    }
                  }} 
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="clearEvoteAll" className="text-xs font-semibold text-destructive cursor-pointer">
                    Complete E-Voting Wipe
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    Deletes categories, voting types, candidates, votes, and pauses the server.
                  </p>
                </div>
              </div>
            </div>

            {/* Category Preservation UI */}
            {(clearEvoteResults || clearEvoteAll) && filteredCategories.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-border/60">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold text-foreground">
                    Preserve Categories (Keep)
                  </Label>
                  <p className="text-[10px] text-muted-foreground leading-normal">
                    Select any categories you want to keep intact. Their candidate listings and structure will not be deleted.
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 border border-dashed border-border/80 rounded-lg bg-muted/30">
                  {filteredCategories.map((cat) => {
                    const isPreserved = excludeCategoryIds.includes(cat.id);
                    const votingTypeLabel = votingTypes.find(vt => vt.id === cat.voting_type_id)?.name || "General";
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          if (isPreserved) {
                            setExcludeCategoryIds(excludeCategoryIds.filter(id => id !== cat.id));
                          } else {
                            setExcludeCategoryIds([...excludeCategoryIds, cat.id]);
                          }
                        }}
                        className={`text-[10px] px-2.5 py-1 rounded-full border transition-all duration-200 text-left flex flex-col gap-0.5 cursor-pointer ${
                          isPreserved
                            ? "bg-primary/10 border-primary text-primary font-semibold ring-2 ring-primary/20"
                            : "bg-background border-border text-muted-foreground hover:border-muted-foreground/50 hover:bg-muted/40"
                        }`}
                      >
                        <span>{cat.name}</span>
                        {selectedVotingTypeId === "global" && (
                          <span className="text-[8px] opacity-75 font-normal">({votingTypeLabel})</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <Button 
              variant="destructive" 
              className="w-full text-xs font-bold" 
              onClick={() => handleResetRequest("evote")}
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-1.5 h-4 w-4" />}
              Clear Selected E-Voting Data
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation AlertDialog */}
      <AlertDialog open={pendingResetType !== null} onOpenChange={(open) => { if (!open) setPendingResetType(null); }}>
        <AlertDialogContent className="rounded-3xl border-border/40 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-xl text-rose-600">⚠️ Irreversible Action</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              {pendingResetType === "screening"
                ? "Are you absolutely sure you want to delete the selected screening data? This action is irreversible!"
                : "Are you absolutely sure you want to delete the selected e-voting portal data? Votes and candidates will be lost permanently!"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl h-11 font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl h-11 font-bold bg-rose-600 hover:bg-rose-700 text-white"
              onClick={() => pendingResetType && handleReset(pendingResetType)}
            >
              Yes, Clear Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

