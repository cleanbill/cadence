"use client";

import { useData } from "@/lib/data/provider";
import { JiraTicket } from "@/lib/data/api-client";
import { useEffect, useState } from "react";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { Clock, AlertTriangle, Layers } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";

export function BacklogView() {
    const { client, staleThreshold, activeWorkJql, storyPointField } = useData();
    const [tickets, setTickets] = useState<JiraTicket[]>([]);
    const [jiraHost, setJiraHost] = useState<string | null>(null);

    useEffect(() => {
        const host = localStorage.getItem("cadence_jira_host");
        setJiraHost(host);
    }, []);

    useEffect(() => {
        if (client) {
            const jql = activeWorkJql || "project = CAD";
            client.searchTickets(jql, storyPointField).then(results => {
                setTickets(results);
            }).catch(err => {
                console.error("BacklogView: Fetch failed", err);
            });
        }
    }, [client, activeWorkJql, storyPointField]);

    const totalSprintPoints = tickets.reduce((acc, t) => acc + (t.points || 0), 0);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
                <Badge variant="outline" className="text-sm px-3 py-1 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900 flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Backlog Scope: {totalSprintPoints} Points
                </Badge>
            </div>

            <div className="rounded-md border bg-card text-card-foreground shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b bg-muted/50 transition-colors">
                            <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground w-[100px]">Status</th>
                            <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground w-[120px]">Key</th>
                            <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Summary</th>
                            <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground w-[100px]">Points</th>
                        </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                        {tickets.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-muted-foreground italic">
                                    No tickets found in current scope.
                                </td>
                            </tr>
                        ) : (
                            tickets.map((ticket) => {
                                const isStale = differenceInDays(new Date(), parseISO(ticket.updated)) > staleThreshold;
                                const inSprint = ticket.statusCategory === "In Progress";
                                const jiraUrl = jiraHost ? `https://${jiraHost}/browse/${ticket.key}` : null;

                                return (
                                    <tr
                                        key={ticket.id}
                                        className={cn(
                                            "border-b transition-colors hover:bg-muted/50",
                                            inSprint && "bg-blue-50/30 dark:bg-blue-950/10 border-l-4 border-l-blue-500"
                                        )}
                                    >
                                        <td className="p-4 align-middle">
                                            <Badge
                                                variant={ticket.statusCategory === "Done" ? "default" : (ticket.statusCategory === "In Progress" ? "secondary" : "outline")}
                                                className={cn(
                                                    "whitespace-nowrap",
                                                    ticket.statusCategory === "In Progress" && "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200"
                                                )}
                                            >
                                                {ticket.status}
                                            </Badge>
                                        </td>
                                        <td className="p-4 align-middle font-mono text-xs">
                                            {jiraUrl ? (
                                                <a
                                                    href={jiraUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 dark:text-blue-400 hover:underline"
                                                >
                                                    {ticket.key}
                                                </a>
                                            ) : (
                                                <span className="text-muted-foreground">{ticket.key}</span>
                                            )}
                                        </td>
                                        <td className="p-4 align-middle">
                                            <div className="flex flex-col gap-1">
                                                <span className={cn("font-medium", isStale && "text-muted-foreground")}>
                                                    {ticket.summary}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    {isStale && (
                                                        <span className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 rounded border border-amber-100 dark:border-amber-900">
                                                            <Clock className="h-3 w-3" />
                                                            Stale
                                                        </span>
                                                    )}
                                                    {ticket.assignee && (
                                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wider">
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img src={ticket.assignee.avatarUrl} alt="" className="w-3.5 h-3.5 rounded-full" />
                                                            {ticket.assignee.displayName}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle text-right">
                                            {ticket.points > 0 ? (
                                                <span className="font-semibold text-blue-600 dark:text-blue-400">{ticket.points}</span>
                                            ) : (
                                                <span className="text-muted-foreground italic text-xs">Unestimated</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
