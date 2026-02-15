"use client";

import { useData } from "@/lib/data/provider";
import { JiraTicket } from "@/lib/data/api-client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { differenceInDays, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Clock, AlertTriangle } from "lucide-react";

const STALE_THRESHOLD_DAYS = 30; // Configurable
const POINTS_TO_DAYS = 0.5; // 1 Point = 4 hours = 0.5 Days (assuming 8h day)

function TicketCard({ ticket, jiraHost, staleThreshold }: { ticket: JiraTicket, jiraHost: string | null, staleThreshold: number }) {
    const isStale = differenceInDays(new Date(), parseISO(ticket.updated)) > staleThreshold;

    // Construct Jira URL if host is available
    const jiraUrl = jiraHost ? `https://${jiraHost}/browse/${ticket.key}` : null;

    return (
        <Card className={cn(
            "mb-3 hover:shadow-md transition-shadow",
            isStale && "opacity-70 border-dashed border-amber-300 bg-amber-50/10"
        )}>
            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                    {jiraUrl ? (
                        <a
                            href={jiraUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-mono text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            {ticket.key}
                        </a>
                    ) : (
                        <div className="text-xs font-mono text-muted-foreground">{ticket.key}</div>
                    )}
                    {isStale && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                </div>
                <div className="font-medium text-sm mb-3">
                    {ticket.summary}
                </div>

                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {ticket.points > 0 ? `${ticket.points} pts` : <span className="text-muted-foreground font-normal italic">Unestimated</span>}
                    </div>

                    {ticket.assignee && (
                        <div className="flex items-center gap-1">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={ticket.assignee.avatarUrl} alt={ticket.assignee.displayName} className="w-5 h-5 rounded-full" />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

function Column({ title, tickets, jiraHost, staleThreshold }: { title: string, tickets: JiraTicket[], jiraHost: string | null, staleThreshold: number }) {
    const totalPoints = tickets.reduce((acc, t) => acc + (t.points || 0), 0);

    return (
        <div className="flex-1 min-w-[250px] bg-muted/40 rounded-lg p-3">
            <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="font-semibold">{title}</h3>
                <Badge variant="secondary">{totalPoints} pts</Badge>
            </div>
            <div className="flex flex-col gap-2">
                {tickets.map(t => <TicketCard key={t.id} ticket={t} jiraHost={jiraHost} staleThreshold={staleThreshold} />)}
            </div>
        </div>
    )
}

export function TimeBoard() {
    const { client, teamVelocity, activeWorkJql, staleThreshold, storyPointField } = useData();
    const [tickets, setTickets] = useState<JiraTicket[]>([]);
    const [jiraHost, setJiraHost] = useState<string | null>(null);

    useEffect(() => {
        // Get Jira host from localStorage
        const host = localStorage.getItem("cadence_jira_host");
        setJiraHost(host);
    }, []);

    useEffect(() => {
        if (client) {
            const jql = activeWorkJql || "project = CAD";
            console.log("TimeBoard: Fetching tickets with JQL:", jql);
            client.searchTickets(jql, storyPointField).then(results => {
                console.log("TimeBoard: Got tickets:", results.length);
                setTickets(results);
            }).catch(err => {
                console.error("TimeBoard: Fetch failed", err);
            });
        }
    }, [client, activeWorkJql]);

    const todo = tickets.filter(t => t.status === "To Do");
    const inProgress = tickets.filter(t => t.status === "In Progress");
    const review = tickets.filter(t => t.status === "Code Review");
    const done = tickets.filter(t => t.status === "Done");

    const totalSprintPoints = tickets.reduce((acc, t) => acc + (t.points || 0), 0);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
                <Badge variant="outline" className="text-sm px-3 py-1 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900">
                    Total: {totalSprintPoints} Points
                </Badge>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4">
                <Column title="To Do" tickets={todo} jiraHost={jiraHost} staleThreshold={staleThreshold} />
                <Column title="In Progress" tickets={inProgress} jiraHost={jiraHost} staleThreshold={staleThreshold} />
                <Column title="Code Review" tickets={review} jiraHost={jiraHost} staleThreshold={staleThreshold} />
                <Column title="Done" tickets={done} jiraHost={jiraHost} staleThreshold={staleThreshold} />
            </div>
        </div>
    );
}
