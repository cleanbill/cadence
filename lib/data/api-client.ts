export interface JiraUser {
    accountId: string;
    avatarUrl: string;
    displayName: string;
    emailAddress?: string;
}

export interface JiraTicket {
    id: string;
    key: string; // e.g. "PROJ-123"
    summary: string;
    status: string;
    statusCategory: "To Do" | "In Progress" | "Done";
    points: number; // Story Points
    assignee: JiraUser | null;
    created: string; // ISO Date
    updated: string; // ISO Date
    labels: string[];
    issuetype?: {
        name: string;
        subtask: boolean;
    };
}

export interface DataClient {
    getMyself(): Promise<JiraUser>;
    searchTickets(jql: string, pointsField?: string, jiraBoardId?: string): Promise<JiraTicket[]>;
    getAllUsers(): Promise<JiraUser[]>;
}
