"use client";

import { useData } from "@/lib/data/provider";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

interface ContributorStat {
    name: string;
    ticketsCompleted: number;
    pointsCompleted: number;
    avgPoints: number;
    comparison: string; // Performance vs Avg
}

export default function MonthlyReportPage() {
    const { client, teamVelocity, storyPointField } = useData();
    const [stats, setStats] = useState<ContributorStat[]>([]);

    useEffect(() => {
        if (!client) return;

        client.searchTickets("status = Done", storyPointField).then(tickets => {
            const rawStats: Record<string, ContributorStat> = {};

            tickets.forEach(t => {
                if (!t.assignee) return;
                const name = t.assignee.displayName;
                const points = t.points || 0;

                if (!rawStats[name]) {
                    rawStats[name] = { name, ticketsCompleted: 0, pointsCompleted: 0, avgPoints: 0, comparison: "Avg" };
                }

                rawStats[name].ticketsCompleted += 1;
                rawStats[name].pointsCompleted += points;
            });

            const statArray = Object.values(rawStats).map(s => {
                const avg = parseFloat((s.pointsCompleted / s.ticketsCompleted).toFixed(1));
                return {
                    ...s,
                    avgPoints: avg
                };
            });

            const teamAvgPoints = statArray.length > 0 ? statArray.reduce((acc, s) => acc + s.avgPoints, 0) / statArray.length : 0;

            const finalStats = statArray.map(s => {
                let comparison = "Avg";
                if (teamAvgPoints > 0) {
                    const diff = ((s.avgPoints - teamAvgPoints) / teamAvgPoints) * 100;
                    if (diff > 5) comparison = `+${diff.toFixed(0)}% (Higher Complexity)`;
                    else if (diff < -5) comparison = `${diff.toFixed(0)}% (Lower Complexity)`;
                }
                return { ...s, comparison };
            }).sort((a, b) => b.pointsCompleted - a.pointsCompleted);

            setStats(finalStats);
        });
    }, [client, teamVelocity]);

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
                        <CardDescription>Share of story points completed</CardDescription>
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
                                        dataKey="pointsCompleted"
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
                        <CardTitle>Team Throughput</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-4xl font-bold">
                            {stats.reduce((acc, s) => acc + s.pointsCompleted, 0)} <span className="text-lg font-normal text-muted-foreground">pts</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Total story points completed this month.
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
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Total Points</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Avg. Points/Ticket</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">vs Team Avg</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.map((s) => (
                                    <tr key={s.name} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <td className="p-4 font-medium">{s.name}</td>
                                        <td className="p-4">{s.ticketsCompleted}</td>
                                        <td className="p-4">{s.pointsCompleted}</td>
                                        <td className="p-4">{s.avgPoints} pts</td>
                                        <td className={`p-4 font-medium ${s.comparison.includes("Higher") ? "text-blue-600" : s.comparison.includes("Lower") ? "text-muted-foreground" : ""}`}>
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
