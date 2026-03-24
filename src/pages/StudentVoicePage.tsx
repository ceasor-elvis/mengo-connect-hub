import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Send, CheckCircle, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function StudentVoicePage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    studentName: "",
    studentClass: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.category) {
      toast.error("Please fill in all required fields");
      return;
    }
    setLoading(true);

    try {
      let file_url: string | null = null;

      // Upload file if provided
      if (file) {
        const ext = file.name.split(".").pop();
        const filePath = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("student-voice-files")
          .upload(filePath, file);
        if (uploadErr) throw uploadErr;

        const { data: urlData } = supabase.storage
          .from("student-voice-files")
          .getPublicUrl(filePath);
        file_url = urlData.publicUrl;
      }

      const { error } = await supabase.from("student_voices").insert({
        title: form.title,
        description: form.description,
        category: form.category,
        submitted_by: form.studentName || null,
        submitted_class: form.studentClass || null,
        file_url,
      });

      if (error) throw error;

      setSubmitted(true);
      toast.success("Your submission has been received!");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle className="h-10 w-10 text-primary" />
        </div>
        <h2 className="mt-6 font-serif text-3xl font-bold text-foreground">Thank You!</h2>
        <p className="mt-3 max-w-md text-muted-foreground">
          Your submission has been received and will be reviewed by the Student Council.
        </p>
        <Button className="mt-8" onClick={() => {
          setSubmitted(false);
          setFile(null);
          setForm({ title: "", description: "", category: "", studentName: "", studentClass: "" });
        }}>
          Submit Another
        </Button>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="container mx-auto max-w-2xl px-4">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <MessageSquare className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-foreground md:text-4xl">Student Voice</h1>
          <p className="mt-3 text-muted-foreground">
            Share your ideas, projects, or complaints with the Student Council. Your voice matters!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border bg-card p-6 shadow-sm md:p-8">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Give your submission a clear title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="projects">Projects</SelectItem>
                <SelectItem value="ideas">Ideas</SelectItem>
                <SelectItem value="complaints">Complaints</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe your submission in detail..."
              rows={5}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {/* File upload */}
          <div className="space-y-2">
            <Label>Attach File (optional — image or PDF)</Label>
            <div className="flex items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-4 py-3 text-sm text-muted-foreground hover:bg-muted transition-colors flex-1">
                <Upload className="h-4 w-4" />
                {file ? file.name : "Choose file…"}
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
              {file && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setFile(null)}>
                  Remove
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name (optional)</Label>
              <Input
                id="name"
                placeholder="e.g. John Mukasa"
                value={form.studentName}
                onChange={(e) => setForm({ ...form, studentName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="class">Class (optional)</Label>
              <Input
                id="class"
                placeholder="e.g. S.4 West"
                value={form.studentClass}
                onChange={(e) => setForm({ ...form, studentClass: e.target.value })}
              />
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            <Send className="mr-2 h-4 w-4" />
            {loading ? "Submitting..." : "Submit Your Voice"}
          </Button>
        </form>
      </div>
    </div>
  );
}
