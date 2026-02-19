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
    const { mode, setMode, configureJira, staleThreshold, teamVelocity, activeWorkJql, futureIdeasJql, buildLabel, storyPointField, jiraBoardId, teamName, teamMembers, updateSettings } = useData();
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
    const [bLabel, setBLabel] = useState(buildLabel);
    const [vel, setVel] = useState(teamVelocity.toString());
    const [pointField, setPointField] = useState(storyPointField);
    const [boardId, setBoardId] = useState(jiraBoardId);

    // Team
    const [tName, setTName] = useState(teamName);
    const [tMembers, setTMembers] = useState(teamMembers);
    const [newMemberName, setNewMemberName] = useState("");
    const [newMemberRole, setNewMemberRole] = useState("");

    useEffect(() => {
        setIsMock(mode === DataMode.MOCK);
        setStale(staleThreshold.toString());
        setActiveJql(activeWorkJql);
        setFutureJql(futureIdeasJql);
        setBLabel(buildLabel);
        setVel(teamVelocity.toString());
        setPointField(storyPointField);
        setBoardId(jiraBoardId);
        setTName(teamName);
        setTMembers(teamMembers);

        const savedHost = localStorage.getItem("jira-domain");
        const savedEmail = localStorage.getItem("jira-email");
        if (savedHost) setHost(savedHost);
        if (savedEmail) setEmail(savedEmail);
    }, [mode, open, staleThreshold, activeWorkJql, futureIdeasJql, buildLabel, teamName, teamMembers, jiraBoardId]);

    const handleSave = async () => {
        // Save generic settings
        const newStale = parseInt(stale) || 30;
        const newVel = parseFloat(vel) || teamVelocity;
        updateSettings(newStale, activeJql, futureJql, bLabel, pointField, boardId, tName, tMembers, newVel);

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
                        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Team Definition</h4>
                        <div className="grid gap-2">
                            <Label htmlFor="team-name">Team Name</Label>
                            <Input
                                id="team-name"
                                value={tName}
                                onChange={(e) => setTName(e.target.value)}
                                placeholder="Core Team"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Team Members</Label>
                            <div className="border rounded-md divide-y overflow-hidden bg-zinc-50/50 dark:bg-zinc-900/50">
                                {tMembers.length === 0 && (
                                    <div className="p-4 text-center text-xs text-muted-foreground italic">No members defined.</div>
                                )}
                                {tMembers.map((member) => (
                                    <div key={member.id} className="flex items-center justify-between p-2 px-4 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{member.name}</span>
                                            <span className="text-[10px] text-muted-foreground uppercase">{member.role}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                                            onClick={() => setTMembers(tMembers.filter(m => m.id !== member.id))}
                                        >
                                            ×
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Input
                                    placeholder="Name"
                                    className="h-9 text-sm"
                                    value={newMemberName}
                                    onChange={(e) => setNewMemberName(e.target.value)}
                                />
                                <Input
                                    placeholder="Role"
                                    className="h-9 text-sm w-32"
                                    value={newMemberRole}
                                    onChange={(e) => setNewMemberRole(e.target.value)}
                                />
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="h-9"
                                    onClick={() => {
                                        if (!newMemberName) return;
                                        setTMembers([...tMembers, {
                                            id: Math.random().toString(36).substr(2, 9),
                                            name: newMemberName,
                                            role: newMemberRole || "Engineer"
                                        }]);
                                        setNewMemberName("");
                                        setNewMemberRole("");
                                    }}
                                >
                                    Add
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 border-t pt-4">
                        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Estimation & Scope</h4>
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
                                <Label htmlFor="velocity">Team Vel (Pts/Week)</Label>
                                <Input
                                    id="velocity"
                                    type="number"
                                    step="0.1"
                                    value={vel}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVel(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="build-label">Build Label (Target Scope)</Label>
                            <Input
                                id="build-label"
                                value={bLabel}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBLabel(e.target.value)}
                                placeholder="build"
                            />
                            <p className="text-[10px] text-muted-foreground">The specific label used to identify scope for landing projections.</p>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="point-field">Story Point Field (Jira ID)</Label>
                            <Input
                                id="point-field"
                                value={pointField}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPointField(e.target.value)}
                                placeholder="customfield_10014"
                            />
                            <p className="text-[10px] text-muted-foreground">The custom field key used in your Jira instance (e.g. customfield_10014).</p>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="board-id">Jira Board ID (Agile Fallback)</Label>
                            <Input
                                id="board-id"
                                value={boardId}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBoardId(e.target.value)}
                                placeholder="123"
                            />
                            <p className="text-[10px] text-muted-foreground">Used as a fallback for missing scope points via the Agile API.</p>
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
