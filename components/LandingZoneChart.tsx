"use client";

import { useData } from "@/lib/data/provider";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { addDays, format } from "date-fns";

interface ProjectionPoint {
    date: string; // "MMM dd"
    totalTickets: number; // Constant horizontal line
    optimistic: number; // +25%
    expected: number; // Current
    pessimistic: number; // -25%
}

export function LandingZoneChart() {
    const { client, teamVelocity, activeWorkJql, buildLabel, storyPointField } = useData();
    const [data, setData] = useState<ProjectionPoint[]>([]);
    const [landingDates, setLandingDates] = useState<{ opt: string, exp: string, pess: string } | null>(null);

    useEffect(() => {
        if (!client) return;

        // Use the configured JQL to fetch Active Scope
        const jql = activeWorkJql || `labels = ${buildLabel} AND statusCategory != Done`;

        client.searchTickets(jql, storyPointField).then(tickets => {
            const totalScopePoints = tickets.reduce((acc, t) => {
                const points = t.points > 0 ? t.points : 1; // Fallback to 1 point if unsized
                return acc + points;
            }, 0);

            // Throughput per Calendar Day = Points per Week / 7
            const DAILY_THROUGHPUT = Math.max(0.1, teamVelocity / 7);

            const projections: ProjectionPoint[] = [];
            const today = new Date();

            // We project out until we hit the total Scope + buffer
            const maxDays = Math.ceil((totalScopePoints / (DAILY_THROUGHPUT * 0.75)) + 14);

            let foundOpt = false, foundExp = false, foundPess = false;
            let dOpt = "", dExp = "", dPess = "";

            for (let i = 0; i <= maxDays; i++) {
                const date = addDays(today, i);
                const dateStr = format(date, "MMM dd");

                // Cumulative Points Completed
                const optimistic = Math.min(totalScopePoints, i * (DAILY_THROUGHPUT * 1.25));
                const expected = Math.min(totalScopePoints, i * DAILY_THROUGHPUT);
                const pessimistic = Math.min(totalScopePoints, i * (DAILY_THROUGHPUT * 0.75));

                if (!foundOpt && optimistic >= totalScopePoints) { dOpt = dateStr; foundOpt = true; }
                if (!foundExp && expected >= totalScopePoints) { dExp = dateStr; foundExp = true; }
                if (!foundPess && pessimistic >= totalScopePoints) { dPess = dateStr; foundPess = true; }

                projections.push({
                    date: dateStr,
                    totalTickets: totalScopePoints,
                    optimistic,
                    expected,
                    pessimistic
                });
            }

            setData(projections);
            setLandingDates({ opt: dOpt, exp: dExp, pess: dPess });
        });
    }, [client, activeWorkJql, teamVelocity, buildLabel]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Projected Landing Zones</CardTitle>
                <CardDescription>
                    When will all {data[0]?.totalTickets.toFixed(1)} story points of scope be completed?
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[350px] w-full min-h-[350px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="date" minTickGap={30} />
                            <YAxis label={{ value: 'Story Points', angle: -90, position: 'insideLeft' }} />
                            <Tooltip />
                            <Legend />

                            {/* Scope Line */}
                            <Line type="step" dataKey="totalTickets" stroke="#64748b" strokeDasharray="5 5" name="Total Scope" dot={false} strokeWidth={2} />

                            {/* Projections */}
                            <Line type="monotone" dataKey="optimistic" stroke="#22c55e" name="+25% Efficiency" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="expected" stroke="#3b82f6" name="Expected Pace" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="pessimistic" stroke="#ef4444" name="-25% Efficiency" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {landingDates && (
                    <div className="grid grid-cols-3 gap-4 mt-6 text-center">
                        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900">
                            <div className="text-sm text-green-600 dark:text-green-400 font-semibold uppercase">Optimistic</div>
                            <div className="text-2xl font-bold text-green-700 dark:text-green-300">{landingDates.opt}</div>
                        </div>
                        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900">
                            <div className="text-sm text-blue-600 dark:text-blue-400 font-semibold uppercase">Expected</div>
                            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{landingDates.exp}</div>
                        </div>
                        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900">
                            <div className="text-sm text-red-600 dark:text-red-400 font-semibold uppercase">Pessimistic</div>
                            <div className="text-2xl font-bold text-red-700 dark:text-red-300">{landingDates.pess}</div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
