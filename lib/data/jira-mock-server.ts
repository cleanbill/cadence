import { JiraTicket, JiraUser } from "./api-client";
import { subDays } from "date-fns";

export const MOCK_USERS: JiraUser[] = [
    { accountId: "u1", displayName: "Alice Engineer", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice", emailAddress: "alice@example.com" },
    { accountId: "u2", displayName: "Bob Builder", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob", emailAddress: "bob@example.com" },
    { accountId: "u3", displayName: "Charlie Designer", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie", emailAddress: "charlie@example.com" },
    { accountId: "u4", displayName: "David Dev", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=David", emailAddress: "david@example.com" },
    { accountId: "u5", displayName: "Eve Expert", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Eve", emailAddress: "eve@example.com" },
];

const STATUSES = ["To Do", "In Progress", "Code Review", "Done"];
const LABELS = ["frontend", "backend", "bug", "feature", "urgent", "idea", "build"];

export function generateMockTickets(count: number): JiraTicket[] {
    return Array.from({ length: count }).map((_, i) => {
        const isDone = Math.random() > 0.7;
        const status = isDone ? "Done" : STATUSES[Math.floor(Math.random() * (STATUSES.length - 1))];
        const assignee = Math.random() > 0.2 ? MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)] : null;

        // Ensure some tickets are "Stale" (updated > 30 days ago)
        const updatedDaysAgo = i % 5 === 0 ? Math.floor(Math.random() * 30) + 31 : Math.floor(Math.random() * 5);

        const labels = [LABELS[Math.floor(Math.random() * LABELS.length)]];
        if (Math.random() > 0.2) labels.push("build"); // 80% of mock tickets get 'build' label now

        const isSubtask = i % 10 === 0;

        return {
            id: `mock-${i}`,
            key: `CAD-${1000 + i}`,
            summary: `Mock Task ${i}: ${[
                "Implement auth flow",
                "Fix migration bug",
                "Optimize database",
                "Design UI components",
                "Refactor state management"
            ][i % 5]}`,
            status,
            statusCategory: status === "Done" ? "Done" : (status === "To Do" ? "To Do" : "In Progress"),
            points: isSubtask ? 0 : Math.floor(Math.random() * 8) + 1,
            assignee,
            created: subDays(new Date(), updatedDaysAgo + 10).toISOString(),
            updated: subDays(new Date(), updatedDaysAgo).toISOString(),
            labels,
            issuetype: {
                name: isSubtask ? "Sub-task" : "Story",
                subtask: isSubtask
            }
        };
    });
}

export const CACHED_MOCK_TICKETS = generateMockTickets(100);
