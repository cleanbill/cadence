import { JiraTicket } from "@/lib/data/api-client";
import { differenceInBusinessDays, parseISO } from "date-fns";

export interface VelocityMetrics {
    dailyVelocity: number; // Points completed per day
    daysPerPoint: number; // Avg days to complete 1 point
    sampleSize: number;   // Number of tickets used
}

/**
 * Calculates the velocity based on a list of COMPLETED tickets.
 * 
 * @param tickets List of JiraTickets (must be status='Done' or similar)
 * @param defaultDaysPerPoint Fallback if no history exists (default 5 days = 1 week)
 */
export function calculateVelocity(tickets: JiraTicket[], defaultDaysPerPoint: number = 5): VelocityMetrics {
    const closedTickets = tickets.filter(t => t.status === "Done" && t.points > 0 && t.created && t.updated);

    if (closedTickets.length === 0) {
        return {
            dailyVelocity: 1 / defaultDaysPerPoint,
            daysPerPoint: defaultDaysPerPoint,
            sampleSize: 0
        };
    }

    let totalPoints = 0;
    let totalDays = 0;

    closedTickets.forEach(t => {
        // Simple heuristic: Duration = Updated - Created
        // In reality, we'd want "In Progress" time, but API might only give basic fields.
        // Let's assume (Updated - Created) is the cycle time for now.
        const start = parseISO(t.created);
        const end = parseISO(t.updated);

        // Ensure at least 1 day
        const duration = Math.max(1, Math.abs(differenceInBusinessDays(end, start)));

        totalPoints += t.points;
        totalDays += duration;
    });

    if (totalPoints === 0) {
        return {
            dailyVelocity: 1 / defaultDaysPerPoint,
            daysPerPoint: defaultDaysPerPoint,
            sampleSize: closedTickets.length
        };
    }

    // Days Per Point = Total Days / Total Points
    // e.g. 10 days / 5 points = 2 days per point
    const avgDaysPerPoint = totalDays / totalPoints;

    return {
        dailyVelocity: 1 / avgDaysPerPoint,
        daysPerPoint: avgDaysPerPoint,
        sampleSize: closedTickets.length
    };
}
