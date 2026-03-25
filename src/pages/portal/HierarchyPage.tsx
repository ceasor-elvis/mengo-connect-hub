import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import HierarchyTree from "@/components/portal/HierarchyTree";

export default function HierarchyPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-serif text-xl font-bold sm:text-2xl flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" /> Council Hierarchy
        </h1>
        <p className="text-xs text-muted-foreground">Organizational structure of the Mengo Senior Council</p>
      </div>

      <Card>
        <CardHeader className="pb-2 px-3 sm:px-6">
          <CardTitle className="text-sm">Cabinet Structure</CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <HierarchyTree />
        </CardContent>
      </Card>
    </div>
  );
}
