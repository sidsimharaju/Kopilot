import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AnalysisPage() {
  return (
    <div className="flex flex-col gap-3.5">
      <Card>
        <CardHeader>
          <CardTitle>Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Analysis tab ports in Phase 8: per-participant findings cards,
            synthesis, and report generation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
