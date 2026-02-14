"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useData } from "@/lib/data/provider";
import { DataMode } from "@/lib/data/provider";
import { Settings, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export function SettingsDialog() {
    const { mode, setMode, configureJira, staleThreshold, baselineVelocity, activeWorkJql, futureIdeasJql, updateSettings } = useData();
    const [open, setOpen] = useState(false);

    // Local state for form
    const [host, setHost] = useState("");
    const [email, setEmail] = useState("");
    const [token, setToken] = useState("");
    const [isMock, setIsMock] = useState(mode === DataMode.MOCK);

    // Settings
    const [stale, setStale] = useState(staleThreshold.toString());
    const [activeJql, setActiveJql] = useState(activeWorkJql);
    const [futureJql, setFutureJql] = useState(futureIdeasJql);

    useEffect(() => {
        setIsMock(mode === DataMode.MOCK);
        setStale(staleThreshold.toString());
        setActiveJql(activeWorkJql);
        setFutureJql(futureIdeasJql);

        const savedHost = localStorage.getItem("jira-domain");
        const savedEmail = localStorage.getItem("jira-email");
        if (savedHost) setHost(savedHost);
        if (savedEmail) setEmail(savedEmail);
    }, [mode, open, staleThreshold, activeWorkJql, futureIdeasJql]);

    const handleSave = async () => {
        // Save generic settings
        const newStale = parseInt(stale) || 30;
        updateSettings(newStale, activeJql, futureJql);

        if (isMock) {
            setMode(DataMode.MOCK);
            setOpen(false);
            return;
        }

        if (!host || !email || !token) {
            setMode(DataMode.JIRA);
            setOpen(false);
            return;
        }

        try {
            const response = await fetch("/api/auth/jira", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ host, email, apiToken: token }),
            });

            if (!response.ok) {
                const data = await response.json();
                alert(data.error || "Failed to authenticate with Jira");
                return;
            }

            configureJira();
            setOpen(false);
        } catch (err) {
            console.error("Auth error:", err);
            alert("An error occurred during authentication");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Configuration</DialogTitle>
                    <DialogDescription>
                        Manage data source and estimation settings.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
                    <div className={cn(
                        "flex items-center justify-between space-x-2 border-2 p-4 rounded-md transition-colors",
                        isMock
                            ? "border-red-400 bg-red-50 dark:bg-red-950/20"
                            : "border-green-400 bg-green-50 dark:bg-green-950/20"
                    )}>
                        <div className="flex flex-col space-y-1">
                            <Label htmlFor="mock-mode" className="font-medium">
                                {isMock ? "🔴 Demo Mode (Mock Data)" : "🟢 Live Mode (Jira Data)"}
                            </Label>
                            <span className="text-xs text-muted-foreground">
                                {isMock ? "Using generated data for testing" : "Connected to real Jira instance"}
                            </span>
                        </div>
                        <Switch
                            id="mock-mode"
                            checked={isMock}
                            onCheckedChange={setIsMock}
                            className="data-[state=checked]:bg-black data-[state=unchecked]:bg-black"
                        />
                    </div>

                    <div className="space-y-4 border-t pt-4">
                        <h4 className="font-medium text-sm text-muted-foreground">Estimation & Scope</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="stale">Stale Threshold (Days)</Label>
                                <Input
                                    id="stale"
                                    type="number"
                                    value={stale}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStale(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="velocity">Calculated Vel (Days/Pt)</Label>
                                <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background text-muted-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 items-center">
                                    {baselineVelocity.toFixed(1)}
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="active-jql">Active Work JQL (Burn Down)</Label>
                            <Input
                                id="active-jql"
                                value={activeJql}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setActiveJql(e.target.value)}
                                placeholder="statusCategory != Done"
                            />
                            <p className="text-[10px] text-muted-foreground">Tickets defining the "Total Scope".</p>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="future-jql">Future Ideas JQL</Label>
                            <Input
                                id="future-jql"
                                value={futureJql}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFutureJql(e.target.value)}
                                placeholder="labels = future"
                            />
                            <p className="text-[10px] text-muted-foreground">Tickets excluded from velocity and landing zone.</p>
                        </div>
                    </div>

                    {!isMock && (
                        <div className="space-y-4 border-t pt-4">
                            <h4 className="font-medium text-sm text-muted-foreground">Jira Connection</h4>
                            <div className="grid gap-2">
                                <Label htmlFor="host">Jira Host</Label>
                                <Input
                                    id="host"
                                    placeholder="company.atlassian.net"
                                    value={host}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHost(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    placeholder="me@company.com"
                                    value={email}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="token">API Token</Label>
                                <Input
                                    id="token"
                                    type="password"
                                    placeholder="••••••••••••••••"
                                    value={token}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToken(e.target.value)}
                                />
                                <p className="text-[10px] text-muted-foreground">
                                    Stored in local storage. Create one at id.atlassian.com.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button onClick={handleSave}>Save changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
