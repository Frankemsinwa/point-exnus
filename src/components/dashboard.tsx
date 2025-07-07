"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="flex justify-center items-center min-h-[60vh]">
        <Card className="w-full max-w-md text-center">
            <CardHeader>
                <div className="mx-auto bg-accent/20 text-accent p-3 rounded-full w-fit">
                    <Lock className="h-8 w-8" />
                </div>
                <CardTitle>Dashboard Locked</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    This content was previously only available to users who had connected their wallet.
                </p>
            </CardContent>
        </Card>
    </div>
  );
}
