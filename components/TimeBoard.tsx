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

function TicketCard({ ticket, velocity, jiraHost }: { ticket: JiraTicket, velocity: number, jiraHost: string | null }) {
    const isStale = differenceInDays(new Date(), parseISO(ticket.updated)) > STALE_THRESHOLD_DAYS;
    const days = ticket.points * velocity;

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
                        <Clock className="h-3 w-3" />
                        {days > 0 ? `${days.toFixed(1)}d` : "-"}
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

function Column({ title, tickets, velocity, jiraHost }: { title: string, tickets: JiraTicket[], velocity: number, jiraHost: string | null }) {
    const totalDays = tickets.reduce((acc, t) => acc + (t.points * velocity), 0);

    return (
        <div className="flex-1 min-w-[250px] bg-muted/40 rounded-lg p-3">
            <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="font-semibold">{title}</h3>
                <Badge variant="secondary">{Math.ceil(totalDays)}d</Badge>
            </div>
            <div className="flex flex-col">
                {tickets.map(t => <TicketCard key={t.id} ticket={t} velocity={velocity} jiraHost={jiraHost} />)}
            </div>
        </div>
    )
}

export function TimeBoard() {
    const { client, baselineVelocity, activeWorkJql } = useData();
    const [tickets, setTickets] = useState<JiraTicket[]>([]);
    const [jiraHost, setJiraHost] = useState<string | null>(null);

    useEffect(() => {
        // Get Jira host from localStorage
        const host = localStorage.getItem("cadence_jira_host");
        setJiraHost(host);
    }, []);

    useEffect(() => {
        if (client) {
            // We want to show the board. If activeWorkJql is strict, it might hide things.
            // But let's respect the "Future Ideas" exclusion at least.
            // If activeWorkJql excludes "Done", we won't see done tickets.
            // Let's rely on the user's JQL for now.
            const jql = activeWorkJql || "project = CAD";
            client.searchTickets(jql).then(setTickets);
        }
    }, [client, activeWorkJql]);

    const todo = tickets.filter(t => t.status === "To Do");
    const inProgress = tickets.filter(t => t.status === "In Progress");
    const review = tickets.filter(t => t.status === "Code Review");
    const done = tickets.filter(t => t.status === "Done");

    return (
        <div className="flex gap-4 overflow-x-auto pb-4">
            <Column title="To Do" tickets={todo} velocity={baselineVelocity} jiraHost={jiraHost} />
            <Column title="In Progress" tickets={inProgress} velocity={baselineVelocity} jiraHost={jiraHost} />
            <Column title="Code Review" tickets={review} velocity={baselineVelocity} jiraHost={jiraHost} />
            <Column title="Done" tickets={done} velocity={baselineVelocity} jiraHost={jiraHost} />
        </div>
    );
}
