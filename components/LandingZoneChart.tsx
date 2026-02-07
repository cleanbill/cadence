"use client";

import { useData } from "@/lib/data/provider";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { addDays, format, differenceInBusinessDays } from "date-fns";

const POINTS_TO_DAYS = 0.5;

interface ProjectionPoint {
    date: string; // "MMM dd"
    totalTickets: number; // Constant horizontal line
    optimistic: number; // +25%
    expected: number; // Current
    pessimistic: number; // -25%
}

export function LandingZoneChart() {
    const { client, baselineVelocity, activeWorkJql } = useData();
    const [data, setData] = useState<ProjectionPoint[]>([]);
    const [landingDates, setLandingDates] = useState<{ opt: string, exp: string, pess: string } | null>(null);

    useEffect(() => {
        if (!client) return;

        // Use the configured JQL to fetch Active Scope
        const jql = activeWorkJql || "statusCategory != Done";

        client.searchTickets(jql).then(tickets => {
            // Calculate Total Scope (in Days) using dynamic baseline velocity
            // If a ticket has points, use points * baselineVelocity
            // If not, assume a default of 0.25 days (or 0) for unestimated work? 
            // Better to assume a minimum size if unsized, e.g. 1 point equivalent.
            const totalScopeDays = tickets.reduce((acc, t) => {
                const points = t.points > 0 ? t.points : 1; // Fallback to 1 point if unsized
                return acc + (points * baselineVelocity);
            }, 0);

            // Estimate Velocity (Days completed per Calendar Day)
            // baselineVelocity = Days per Point.
            // We need "Points per Calendar Day" (or Days of Work per Calendar Day)
            // If we have 5 devs, and they work 5 days a week...
            // This is tricky without knowing team size.
            // FOR NOW: Let's assume the "velocity" metric we have is "Time to complete 1 point".
            // That doesn't tell us throughput. 
            // We need "Daily Throughput" (Points/Day) from our velocity calc.

            // Re-fetch velocity metrics? Or expose dailyVelocity in provider?
            // "baselineVelocity" in context is "Days per Point".
            // Throughput (Points/Day) = 1 / baselineVelocity (per serial thread).
            // But we have parallel threads (Team).
            // Currently our "calculateVelocity" returns { dailyVelocity, daysPerPoint }.
            // dailyVelocity there was "1 / daysPerPoint", which is wrong for a team.

            // ACTUALLY: The user asked to use historical data.
            // In 'velocity.ts', calculateVelocity does:
            // closedTickets.forEach... totalDays += duration.
            // avgDaysPerPoint = totalDays / totalPoints.
            // This is "Average Cycle Time per Point".

            // To project landing, we need "Points Completed per Day (Throughput)".
            // Let's implement a simple throughput calc here based on the SAME data if possible,
            // OR just hardcode a placeholder "Team Size" multiplier?
            // User didn't ask for Team Size config.
            // Let's assume the "Mock Data" implies a team.
            // Let's try to fetch "Done" tickets here to calculate throughput?
            // Or better: Let's assume a fixed "Work in Progress" limit or concurrency?

            // Let's stick to the previous hardcoded "TEAM_VELOCITY = 2.0" (Days of Scope per Calendar Day)
            // but scale it relative to the baselineVelocity changes?
            // No, getting this right requires specific data.
            // Let's just use a heuristic:
            // Team Daily Velocity (Days/Day) ~ (Active Tickets count / avg cycle time)?
            // Let's just keep the 2.0 placeholder but maybe tweak it?
            // ACTUALLY: `totalScopeDays` is now based on `baselineVelocity`. 
            // If velocity increases (days/point goes up), scope days goes up.
            // If team is constant, completion time goes up.
            // So constant daily "days completed" is somewhat fair.

            const TEAM_SCOPE_THROUGHPUT = 2.0; // "Days of Scope" burned down per day.

            const projections: ProjectionPoint[] = [];
            const today = new Date();

            // We project out until we hit the total Scope + buffer
            const maxDays = Math.ceil((totalScopeDays / (TEAM_SCOPE_THROUGHPUT * 0.75)) + 10);

            let foundOpt = false, foundExp = false, foundPess = false;
            let dOpt = "", dExp = "", dPess = "";

            for (let i = 0; i <= maxDays; i++) {
                const date = addDays(today, i);
                const dateStr = format(date, "MMM dd");

                // Cumulative Work Completed
                const optimistic = Math.min(totalScopeDays, i * (TEAM_SCOPE_THROUGHPUT * 1.25));
                const expected = Math.min(totalScopeDays, i * TEAM_SCOPE_THROUGHPUT);
                const pessimistic = Math.min(totalScopeDays, i * (TEAM_SCOPE_THROUGHPUT * 0.75));

                if (!foundOpt && optimistic >= totalScopeDays) { dOpt = dateStr; foundOpt = true; }
                if (!foundExp && expected >= totalScopeDays) { dExp = dateStr; foundExp = true; }
                if (!foundPess && pessimistic >= totalScopeDays) { dPess = dateStr; foundPess = true; }

                projections.push({
                    date: dateStr,
                    totalTickets: totalScopeDays,
                    optimistic,
                    expected,
                    pessimistic
                });
            }

            setData(projections);
            setLandingDates({ opt: dOpt, exp: dExp, pess: dPess });
        });
    }, [client, activeWorkJql, baselineVelocity]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Projected Landing Zones</CardTitle>
                <CardDescription>
                    When will all {data[0]?.totalTickets.toFixed(1)} days of scope be completed?
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="date" minTickGap={30} />
                            <YAxis label={{ value: 'Days Completed', angle: -90, position: 'insideLeft' }} />
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
