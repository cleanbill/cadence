import { DataClient, JiraTicket, JiraUser } from "./api-client";

export class JiraDataClient implements DataClient {
    private isMock: boolean;

    constructor(mock: boolean = false) {
        this.isMock = mock;
        console.log(`[JiraDataClient] Initialized: isMock = ${this.isMock}`);
    }

    private getQueryUrl(endpoint: string, params: Record<string, string> = {}): string {
        const url = new URL(endpoint, window.location.origin);
        if (this.isMock) {
            url.searchParams.set("mock", "true");
        }
        url.searchParams.set("_", Date.now().toString());
        Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
        return url.pathname + url.search;
    }

    async getMyself(): Promise<JiraUser> {
        const url = this.getQueryUrl("/api/jira/myself");
        const res = await fetch(url);
        if (!res.ok) {
            console.error("JiraDataClient: myself failed", res.status);
            throw new Error("Failed to fetch user info");
        }
        return res.json();
    }

    async searchTickets(jql: string, pointsField?: string, jiraBoardId?: string): Promise<JiraTicket[]> {
        const url = this.getQueryUrl("/api/jira/query");
        console.log(`[JiraDataClient] Fetching (POST): ${url}`);
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jql, pointsField, jiraBoardId })
        });
        if (!res.ok) {
            console.error("JiraDataClient: search failed", res.status);
            throw new Error("Failed to search tickets");
        }
        const tickets = await res.json();
        return tickets;
    }

    async getAllUsers(): Promise<JiraUser[]> {
        const url = this.getQueryUrl("/api/jira/users");
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error("Failed to fetch users");
        }
        return res.json();
    }
}
