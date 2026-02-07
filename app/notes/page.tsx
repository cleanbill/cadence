"use client";

import { useData } from "@/lib/data/provider";
import { JiraTicket } from "@/lib/data/api-client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb } from "lucide-react";

export default function NotesPage() {
    const { client } = useData();
    const [ideas, setIdeas] = useState<JiraTicket[]>([]);

    useEffect(() => {
        if (!client) return;
        client.searchTickets("labels in (idea, future)").then(tickets => {
            const ideaTickets = tickets.filter(t => t.labels.includes("idea") || t.labels.includes("future"));
            setIdeas(ideaTickets);
        });
    }, [client]);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Future Ideas & Notes</h1>
                <p className="text-muted-foreground">Backlog items tagged as ideas</p>
            </div>

            <div className="grid gap-6">
                {ideas.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        No ideas found. Tag tickets with "idea" or "future" to see them here.
                    </div>
                ) : (
                    ideas.map(ticket => (
                        <Card key={ticket.id} className="relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400" />
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        <Lightbulb className="h-5 w-5 text-yellow-500" />
                                        {ticket.summary}
                                    </CardTitle>
                                    <Badge variant="outline">{ticket.key}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground leading-relaxed">
                                    This is a placeholder for the ticket description.
                                </p>
                                <div className="mt-4 flex gap-2">
                                    {ticket.labels.map(l => (
                                        <Badge key={l} variant="secondary" className="text-xs">#{l}</Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
