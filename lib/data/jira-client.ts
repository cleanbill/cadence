import { DataClient, JiraTicket, JiraUser } from "./api-client";

export class JiraDataClient implements DataClient {
    async getMyself(): Promise<JiraUser> {
        const res = await fetch("/api/jira/myself");
        if (!res.ok) {
            throw new Error("Failed to fetch user info from proxy");
        }
        return res.json();
    }

    async searchTickets(jql: string): Promise<JiraTicket[]> {
        const res = await fetch(`/api/jira/search?jql=${encodeURIComponent(jql)}`);
        if (!res.ok) {
            throw new Error("Failed to search tickets via proxy");
        }
        return res.json();
    }

    async getAllUsers(): Promise<JiraUser[]> {
        const res = await fetch("/api/jira/users");
        if (!res.ok) {
            throw new Error("Failed to fetch users via proxy");
        }
        return res.json();
    }
}
