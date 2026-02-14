import { NextRequest, NextResponse } from "next/server";
import { getJiraServerClient } from "@/lib/data/jira-server";

export async function GET(req: NextRequest) {
    const serverClient = await getJiraServerClient();
    if (!serverClient) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { client } = serverClient;
    const searchParams = req.nextUrl.searchParams;
    const jql = searchParams.get("jql");

    if (!jql) {
        return NextResponse.json({ error: "Missing JQL" }, { status: 400 });
    }

    try {
        const search = await client.issueSearch.searchForIssuesUsingJql({
            jql,
            fields: ["summary", "status", "assignee", "created", "updated", "labels", "customfield_10026"],
        });

        const tickets = (search.issues || []).map((issue) => ({
            id: issue.id,
            key: issue.key,
            summary: issue.fields.summary,
            status: issue.fields.status.name || "Unknown",
            points: issue.fields["customfield_10026"] || 0,
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

        return NextResponse.json(tickets);
    } catch (err) {
        console.error("Proxy search error:", err);
        return NextResponse.json({ error: "Failed to fetch from Jira" }, { status: 500 });
    }
}
