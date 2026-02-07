"use client";

import { useData } from "@/lib/data/provider";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";

const POINTS_TO_DAYS = 0.5;
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

interface ContributorStat {
    name: string;
    ticketsCompleted: number;
    daysLogged: number; // Est. days
    velocity: number; // Avg days per ticket
    comparison: string; // Performance vs Avg
}

export default function MonthlyReportPage() {
    const { client, baselineVelocity } = useData();
    const [stats, setStats] = useState<ContributorStat[]>([]);

    useEffect(() => {
        if (!client) return;

        client.searchTickets("status = Done").then(tickets => {
            const rawStats: Record<string, ContributorStat> = {};

            tickets.forEach(t => {
                if (!t.assignee) return;
                const name = t.assignee.displayName;
                // Use dynamic baseline velocity for estimation where points are used
                // In a real advanced version, we'd use historical data per user. 
                // For now, we use the configured global exchange rate.
                const days = t.points * baselineVelocity;

                if (!rawStats[name]) {
                    rawStats[name] = { name, ticketsCompleted: 0, daysLogged: 0, velocity: 0, comparison: "Avg" };
                }

                rawStats[name].ticketsCompleted += 1;
                rawStats[name].daysLogged += days;
            });

            // Calc avg velocity per contributor
            let totalVelocity = 0;
            let contributorCount = 0;

            const statArray = Object.values(rawStats).map(s => {
                const vel = parseFloat((s.daysLogged / s.ticketsCompleted).toFixed(1));
                totalVelocity += vel;
                contributorCount++;
                return {
                    ...s,
                    daysLogged: Math.ceil(s.daysLogged),
                    velocity: vel
                };
            });

            const teamAvgVelocity = contributorCount > 0 ? totalVelocity / contributorCount : 0;

            // Add comparison
            const finalStats = statArray.map(s => {
                let comparison = "Avg";
                if (teamAvgVelocity > 0) {
                    const diff = ((s.velocity - teamAvgVelocity) / teamAvgVelocity) * 100;
                    if (diff > 5) comparison = `+${diff.toFixed(0)}% (Slower)`;
                    else if (diff < -5) comparison = `${diff.toFixed(0)}% (Faster)`;
                }
                return { ...s, comparison };
            }).sort((a, b) => b.daysLogged - a.daysLogged);

            setStats(finalStats);
        });
    }, [client, baselineVelocity]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Monthly Review</h1>
                <p className="text-muted-foreground">Performance & Work Distribution</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* PIE CHART */}
                <Card>
                    <CardHeader>
                        <CardTitle>Work Distribution</CardTitle>
                        <CardDescription>Share of estimated days completed</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="daysLogged"
                                    >
                                        {stats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* SUMMARY STATS */}
                <Card>
                    <CardHeader>
                        <CardTitle>Team Velocity</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-4xl font-bold">
                            {Math.ceil(stats.reduce((acc, s) => acc + s.daysLogged, 0))} <span className="text-lg font-normal text-muted-foreground">days</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Total estimated work completed this month.
                        </div>

                        <div className="pt-4 border-t">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-medium">Top Contributor</span>
                                <span className="text-green-600 font-bold">{stats[0]?.name || "-"}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-medium">Most Tickets</span>
                                <span>{stats.sort((a, b) => b.ticketsCompleted - a.ticketsCompleted)[0]?.name || "-"}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* LEAGUE TABLE */}
            <Card>
                <CardHeader>
                    <CardTitle>Contributor League Table</CardTitle>
                    <CardDescription>Breakdown by individual performance</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50 transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Contributor</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Tickets</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Est. Days</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Avg. Velocity</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">vs Team Avg</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.map((s) => (
                                    <tr key={s.name} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <td className="p-4 font-medium">{s.name}</td>
                                        <td className="p-4">{s.ticketsCompleted}</td>
                                        <td className="p-4">{s.daysLogged}</td>
                                        <td className="p-4">{s.velocity} d/ticket</td>
                                        <td className={`p-4 font-medium ${s.comparison.includes("Faster") ? "text-green-600" : s.comparison.includes("Slower") ? "text-red-500" : ""}`}>
                                            {s.comparison}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
