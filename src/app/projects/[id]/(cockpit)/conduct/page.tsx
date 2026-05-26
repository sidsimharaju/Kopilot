import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ConductPage() {
  return (
    <div className="flex flex-col gap-3.5">
      <Card>
        <CardHeader>
          <CardTitle>Conduct</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Conduct tab ports in Phase 7: per-cohort source cards and Manage
            session table.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
