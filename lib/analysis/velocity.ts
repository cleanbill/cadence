import { JiraTicket } from "@/lib/data/api-client";
import { differenceInBusinessDays, parseISO } from "date-fns";

export interface VelocityMetrics {
    pointsPerWeek: number; // Avg points completed per 7-day week
    daysPerPoint: number; // Avg days to complete 1 point (Cycle Time)
    sampleSize: number;   // Number of tickets used
}

/**
 * Calculates the velocity based on a list of COMPLETED tickets.
 * 
 * @param tickets List of JiraTickets (must be status='Done' or similar)
 * @param defaultPointsPerWeek Fallback if no history exists (default 10 pts/week)
 */
export function calculateVelocity(tickets: JiraTicket[], defaultPointsPerWeek: number = 10): VelocityMetrics {
    const closedTickets = tickets.filter(t => t.status === "Done" && t.points > 0 && t.updated);

    if (closedTickets.length === 0) {
        return {
            pointsPerWeek: defaultPointsPerWeek,
            daysPerPoint: 5 / defaultPointsPerWeek, // Heuristic: 1 pt = 1/2 day if 10 pts/week
            sampleSize: 0
        };
    }

    // Determine the date range of completed work
    const sorted = [...closedTickets].sort((a, b) =>
        parseISO(a.updated).getTime() - parseISO(b.updated).getTime()
    );

    const firstUpdate = parseISO(sorted[0].updated);
    const lastUpdate = parseISO(sorted[sorted.length - 1].updated);

    // Duration in calendar days (ensure at least 7 days for a decent average)
    const calendarDays = Math.max(7, Math.abs(differenceInBusinessDays(lastUpdate, firstUpdate)) * 1.4); // Rough approx of calendar days from business days or just use raw diff
    // Better: use differenceInCalendarDays if we had it, but differenceInBusinessDays * (7/5) is okay, 
    // or just calculate raw milliseconds difference.

    const timeSpanMs = Math.max(7 * 24 * 60 * 60 * 1000, lastUpdate.getTime() - firstUpdate.getTime());
    const weeks = timeSpanMs / (7 * 24 * 60 * 60 * 1000);

    let totalPoints = 0;
    let totalCycleDays = 0;

    closedTickets.forEach(t => {
        totalPoints += t.points;

        // Cycle Time (Created to Updated as proxy)
        if (t.created) {
            const start = parseISO(t.created);
            const end = parseISO(t.updated);
            totalCycleDays += Math.max(1, Math.abs(differenceInBusinessDays(end, start)));
        }
    });

    const pointsPerWeek = totalPoints / weeks;
    const daysPerPoint = totalPoints > 0 ? totalCycleDays / totalPoints : 5;

    return {
        pointsPerWeek: Math.round(pointsPerWeek * 10) / 10,
        daysPerPoint: Math.round(daysPerPoint * 10) / 10,
        sampleSize: closedTickets.length
    };
}
