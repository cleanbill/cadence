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
  points: number; // Story Points
  assignee: JiraUser | null;
  created: string; // ISO Date
  updated: string; // ISO Date
  labels: string[];
}

export interface DataClient {
  getMyself(): Promise<JiraUser>;
  searchTickets(jql: string): Promise<JiraTicket[]>;
  getAllUsers(): Promise<JiraUser[]>;
}
