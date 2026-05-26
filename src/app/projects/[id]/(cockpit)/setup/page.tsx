import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SetupPage() {
  return (
    <div className="flex flex-col gap-3.5">
      <Card>
        <CardHeader>
          <CardTitle>Setup</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Setup tab ports in Phase 6: quickstart panel, project details,
            learning objectives table, research design.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
