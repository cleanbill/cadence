import { DataClient, JiraTicket, JiraUser } from "./api-client";
import { Version3Client } from "jira.js";

export class JiraDataClient implements DataClient {
    private client: Version3Client;

    constructor(host: string, email: string, apiToken: string) {
        this.client = new Version3Client({
            host,
            authentication: {
                basic: {
                    email,
                    apiToken,
                },
            },
        });
    }

    async getMyself(): Promise<JiraUser> {
        const user = await this.client.myself.getCurrentUser();
        return {
            accountId: user.accountId || "",
            displayName: user.displayName || "Unknown",
            avatarUrl: user.avatarUrls?.["48x48"] || "",
            emailAddress: user.emailAddress,
        };
    }

    async searchTickets(jql: string): Promise<JiraTicket[]> {
        const search = await this.client.issueSearch.searchForIssuesUsingJql({
            jql,
            fields: ["summary", "status", "assignee", "created", "updated", "labels", "customfield_10026"], // Assuming customfield_10026 is Story Points, need to make this configurable
        });

        return (search.issues || []).map((issue) => ({
            id: issue.id,
            key: issue.key,
            summary: issue.fields.summary,
            status: issue.fields.status.name || "Unknown",
            points: issue.fields["customfield_10026"] || 0, // TODO: Make field ID configurable
            assignee: issue.fields.assignee
                ? {
                    accountId: issue.fields.assignee.accountId || "",
                    displayName: issue.fields.assignee.displayName || "",
                    avatarUrl: issue.fields.assignee.avatarUrls?.["48x48"] || "",
                }
                : null,
            created: issue.fields.created,
            updated: issue.fields.updated,
            labels: issue.fields.labels || [],
        }));
    }

    async getAllUsers(): Promise<JiraUser[]> {
        // This is expensive in real Jira, maybe just get assignable users for a project
        const users = await this.client.userSearch.findUsers({ query: "" });
        return users.map((u) => ({
            accountId: u.accountId || "",
            displayName: u.displayName || "",
            avatarUrl: u.avatarUrls?.["48x48"] || "",
        }));
    }
}
