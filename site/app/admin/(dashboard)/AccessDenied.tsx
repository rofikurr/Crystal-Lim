import { ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function AccessDenied({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
          <ShieldAlert className="size-10 text-destructive" />
          <h1 className="text-xl font-bold">Akses terbatas</h1>
          <p className="text-sm text-muted-foreground">{message}</p>
        </CardContent>
      </Card>
    </div>
  );
}
