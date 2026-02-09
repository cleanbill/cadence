"use client";

import { useData } from "@/lib/data/provider";
import { JiraTicket } from "@/lib/data/api-client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Archive, Clock, AlertTriangle, ArrowRight } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";

const STALE_THRESHOLD_DAYS = 30;

export default function FlaggedPage() {
    const { client } = useData();
    const [staleTickets, setStaleTickets] = useState<JiraTicket[]>([]);
    const [jiraHost, setJiraHost] = useState<string | null>(null);

    useEffect(() => {
        const host = localStorage.getItem("cadence_jira_host");
        setJiraHost(host);
    }, []);

    useEffect(() => {
        if (!client) return;
        client.searchTickets("status != Done").then(tickets => {
            const stale = tickets.filter(t =>
                differenceInDays(new Date(), parseISO(t.updated)) > STALE_THRESHOLD_DAYS
            );
            setStaleTickets(stale);
        });
    }, [client]);

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-amber-600 flex items-center gap-3">
                    <AlertTriangle className="h-8 w-8" />
                    Flagged / Stale Tickets
                </h1>
                <p className="text-muted-foreground">
                    Tickets that haven't been updated in over {STALE_THRESHOLD_DAYS} days. Review them for archival or re-prioritization.
                </p>
            </div>

            <div className="grid gap-4">
                {staleTickets.length === 0 ? (
                    <Card className="bg-muted/50 border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <Clock className="h-12 w-12 mb-4 opacity-20" />
                            <p>No stale tickets found. Good hygiene!</p>
                        </CardContent>
                    </Card>
                ) : (
                    staleTickets.map(ticket => (
                        <Card key={ticket.id} className="flex flex-row items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    {jiraHost ? (
                                        <a
                                            href={`https://${jiraHost}/browse/${ticket.key}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs font-mono text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                            {ticket.key}
                                        </a>
                                    ) : (
                                        <Badge variant="outline" className="text-xs">{ticket.key}</Badge>
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                        Last updated: {differenceInDays(new Date(), parseISO(ticket.updated))} days ago
                                    </span>
                                </div>
                                <h4 className="font-semibold">{ticket.summary}</h4>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        {ticket.assignee && <img src={ticket.assignee.avatarUrl} className="w-4 h-4 rounded-full" />}
                                        {ticket.assignee?.displayName || "Unassigned"}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
                                    <Archive className="h-4 w-4 mr-2" />
                                    Archive
                                </Button>
                                <Button variant="ghost" size="sm">
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
