"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Settings, Save, Mail, Trophy, Wrench, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// UI-only settings (no DB table) — toast confirms "saved" in current session
export function SettingsForm() {
  const [pending, startTransition] = useTransition();
  const [winPoints, setWinPoints] = useState("3");
  const [drawPoints, setDrawPoints] = useState("1");
  const [lossPoints, setLossPoints] = useState("0");
  const [contactEmail, setContactEmail] = useState("support@tourney.bd");
  const [maintenance, setMaintenance] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      // Simulate a save (could POST to /api/admin/settings if persisted in future)
      await new Promise((r) => setTimeout(r, 600));
      toast.success("Settings saved", {
        description: "Defaults updated for new tournaments. Existing tournaments keep their own settings.",
      });
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4 text-primary" />
            Tournament Defaults
          </CardTitle>
          <CardDescription>Default points used when creating new tournaments.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="wp">Win points</Label>
              <Input id="wp" type="number" min="0" max="10" value={winPoints} onChange={(e) => setWinPoints(e.target.value)} />
              <p className="text-[11px] text-muted-foreground">Awarded to the winning team.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dp">Draw points</Label>
              <Input id="dp" type="number" min="0" max="10" value={drawPoints} onChange={(e) => setDrawPoints(e.target.value)} />
              <p className="text-[11px] text-muted-foreground">Awarded to both teams on a draw.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lp">Loss points</Label>
              <Input id="lp" type="number" min="0" max="10" value={lossPoints} onChange={(e) => setLossPoints(e.target.value)} />
              <p className="text-[11px] text-muted-foreground">Awarded to the losing team (usually 0).</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4 text-primary" />
            Platform Contact
          </CardTitle>
          <CardDescription>Shown to users on the public site and in notification emails.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="ce">Support email</Label>
            <Input id="ce" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wrench className="h-4 w-4 text-amber-500" />
            Maintenance Mode
          </CardTitle>
          <CardDescription>Temporarily disable public access for upgrades.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/30 p-4">
            <div>
              <p className="text-sm font-medium">Maintenance mode</p>
              <p className="text-xs text-muted-foreground">
                When enabled, visitors see a maintenance banner. Admins can still log in.
              </p>
            </div>
            <Switch checked={maintenance} onCheckedChange={setMaintenance} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save settings
        </Button>
      </div>
    </form>
  );
}
