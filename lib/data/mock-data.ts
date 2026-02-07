import { DataClient, JiraTicket, JiraUser } from "./api-client";
import { addDays, subDays, format } from "date-fns";

const MOCK_USERS: JiraUser[] = [
    { accountId: "u1", displayName: "Alice Engineer", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice", emailAddress: "alice@example.com" },
    { accountId: "u2", displayName: "Bob Builder", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob", emailAddress: "bob@example.com" },
    { accountId: "u3", displayName: "Charlie Designer", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie", emailAddress: "charlie@example.com" },
    { accountId: "u4", displayName: "David Dev", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=David", emailAddress: "david@example.com" },
    { accountId: "u5", displayName: "Eve Expert", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Eve", emailAddress: "eve@example.com" },
    { accountId: "u6", displayName: "Frank Fixer", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Frank", emailAddress: "frank@example.com" },
    { accountId: "u7", displayName: "Grace Guru", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Grace", emailAddress: "grace@example.com" },
    { accountId: "u8", displayName: "Heidi Hacker", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Heidi", emailAddress: "heidi@example.com" },
    { accountId: "u9", displayName: "Ivan Innovator", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ivan", emailAddress: "ivan@example.com" },
    { accountId: "u10", displayName: "Judy Java", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Judy", emailAddress: "judy@example.com" },
    { accountId: "u11", displayName: "Kevin Kotlin", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kevin", emailAddress: "kevin@example.com" },
    { accountId: "u12", displayName: "Liam Linux", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Liam", emailAddress: "liam@example.com" },
];

const STATUSES = ["To Do", "In Progress", "Code Review", "Done"];
const LABELS = ["frontend", "backend", "bug", "feature", "urgent", "idea"];

function generateTickets(count: number): JiraTicket[] {
    return Array.from({ length: count }).map((_, i) => {
        const isDone = Math.random() > 0.7;
        const status = isDone ? "Done" : STATUSES[Math.floor(Math.random() * (STATUSES.length - 1))];
        const assignee = Math.random() > 0.2 ? MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)] : null;

        return {
            id: `mock-${i}`,
            key: `CAD-${1000 + i}`,
            summary: `Mock Task ${i}: Implement feature ${Math.floor(Math.random() * 100)}`,
            status,
            points: Math.floor(Math.random() * 8) + 1, // 1 to 8 points
            assignee,
            created: subDays(new Date(), Math.floor(Math.random() * 30)).toISOString(),
            updated: subDays(new Date(), Math.floor(Math.random() * 5)).toISOString(),
            labels: [LABELS[Math.floor(Math.random() * LABELS.length)]],
        };
    });
}

export class MockDataClient implements DataClient {
    private tickets: JiraTicket[];

    constructor() {
        this.tickets = generateTickets(150);
    }

    async getMyself(): Promise<JiraUser> {
        return MOCK_USERS[0];
    }

    async searchTickets(jql: string): Promise<JiraTicket[]> {
        // Simple mock filter
        if (jql.includes("assignee = currentUser()")) {
            return this.tickets.filter((t) => t.assignee?.accountId === "user-1");
        }
        return this.tickets;
    }

    async getAllUsers(): Promise<JiraUser[]> {
        return MOCK_USERS;
    }
}
