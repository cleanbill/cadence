import { NextRequest, NextResponse } from "next/server";
import { getJiraServerClient } from "@/lib/data/jira-server";
import { CACHED_MOCK_TICKETS } from "@/lib/data/jira-mock-server";

export async function POST(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const isMock = searchParams.get("mock") === "true";
    let jql: string | null = searchParams.get("jql");
    let pointsField: string | null = searchParams.get("pointsField");
    let jiraBoardId: string | null = searchParams.get("jiraBoardId");

    if (!jql || !pointsField) {
        try {
            const body = await req.json();
            if (!jql) jql = body.jql;
            if (!pointsField) pointsField = body.pointsField;
            if (!jiraBoardId) jiraBoardId = body.jiraBoardId;
        } catch (e) {
            // Body might be empty
        }
    }

    if (!pointsField) pointsField = "customfield_10026";

    if (isMock) {
        let filtered = [...CACHED_MOCK_TICKETS];

        if (jql) {
            const lowerJql = jql.toLowerCase();

            // Basic filtering for "My Tasks"
            if (lowerJql.includes("assignee = currentuser()")) {
                filtered = filtered.filter(t => t.assignee?.accountId === "u1");
            }

            // Handle labels (case-insensitive, optional quotes)
            const labelMatch = jql.match(/labels\s*=\s*"?([a-zA-Z0-9_-]+)"?/i);
            if (labelMatch) {
                const targetLabel = labelMatch[1].toLowerCase();
                filtered = filtered.filter(t => t.labels.some(l => l.toLowerCase() === targetLabel));
            }

            // Handle project (case-insensitive, optional quotes)
            const projectMatch = jql.match(/project\s*=\s*"?([a-zA-Z0-9_-]+)"?/i);
            if (projectMatch) {
                const targetProject = projectMatch[1].toLowerCase();
                filtered = filtered.filter(t => t.key.toLowerCase().startsWith(targetProject));
            }

            // Handle statusCategory != Done (case-insensitive)
            if (lowerJql.includes("statuscategory != done") || lowerJql.includes("statuscategory !~ done")) {
                filtered = filtered.filter(t => t.status.toLowerCase() !== "done");
            }

            // Handle status = Done (case-insensitive, used for velocity)
            if (lowerJql.includes('status = "done"') || lowerJql.includes("status = done")) {
                filtered = filtered.filter(t => t.status.toLowerCase() === "done");
            }
        }

        // Always filter sub-tasks
        filtered = filtered.filter(t => !t.issuetype?.subtask);

        console.log(`[Proxy] Mock JQL: "${jql}" -> Returning ${filtered.length} tickets`);
        return NextResponse.json(filtered);
    }

    if (!jql) {
        return NextResponse.json({ error: "Missing JQL" }, { status: 400 });
    }

    const serverClient = await getJiraServerClient();
    if (!serverClient) {
        console.error("[Proxy] getJiraServerClient returned null (missing or invalid cookie)");
        return NextResponse.json({ error: "Unauthorized: Missing or invalid Jira authentication cookie" }, { status: 401 });
    }
    if (!serverClient.credentials) {
        console.error("[Proxy] Jira client missing credentials");
        return NextResponse.json({ error: "Unauthorized: Missing credentials" }, { status: 401 });
    }

    try {
        const url = `https://${serverClient.host}/rest/api/3/search/jql`;
        const authHeader = Buffer.from(`${serverClient.credentials.email}:${serverClient.credentials.apiToken}`).toString("base64");

        let allIssues: any[] = [];
        let nextPageToken: string | undefined = undefined;
        let isFirstPage = true;

        while (isFirstPage || nextPageToken) {
            const body: any = {
                jql,
                fields: ["summary", "status", "assignee", "created", "updated", "labels", pointsField, "issuetype"],
                maxResults: 100,
            };

            if (nextPageToken) {
                body.nextPageToken = nextPageToken;
            }

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `Basic ${authHeader}`,
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Jira API error response:", JSON.stringify(errorData, null, 2));
                return NextResponse.json(errorData, { status: response.status });
            }

            const search = await response.json();
            const issues = search.issues || [];
            allIssues = [...allIssues, ...issues];
            nextPageToken = search.nextPageToken;
            isFirstPage = false;

            if (issues.length === 0 || !nextPageToken) break;
        }

        const tickets = allIssues
            .filter((issue: any) => {
                // Filter out sub-tasks
                return !issue.fields.issuetype?.subtask;
            })
            .map((issue: any) => ({
                id: issue.id,
                key: issue.key,
                summary: issue.fields.summary,
                status: issue.fields.status.name || "Unknown",
                statusCategory: (issue.fields.status.statusCategory?.name === "Done" ? "Done" :
                    (issue.fields.status.statusCategory?.name === "To Do" ? "To Do" : "In Progress")) as any,
                points: issue.fields[pointsField] || 0,
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
                issuetype: issue.fields.issuetype ? {
                    name: issue.fields.issuetype.name,
                    subtask: issue.fields.issuetype.subtask
                } : undefined,
            }));

        // FALLBACK: Agile Estimation API
        // If we have tickets with 0 points and a boardId, try to fetch estimation
        if (jiraBoardId && !isMock) {
            const authHeader = Buffer.from(`${serverClient.credentials.email}:${serverClient.credentials.apiToken}`).toString("base64");

            await Promise.all(tickets.map(async (ticket: any) => {
                if (ticket.points === 0 && !ticket.issuetype?.subtask) {
                    try {
                        const estimationUrl = `https://${serverClient.host}/rest/agile/1.0/issue/${ticket.key}/estimation?boardId=${jiraBoardId}`;
                        const estRes = await fetch(estimationUrl, {
                            headers: {
                                "Authorization": `Basic ${authHeader}`,
                                "Accept": "application/json"
                            }
                        });
                        if (estRes.ok) {
                            const estData = await estRes.json();
                            if (estData.value !== undefined) {
                                ticket.points = estData.value;
                                console.log(`[Proxy] Fallback: Found ${ticket.points} points for ${ticket.key} via Agile API`);
                            }
                        }
                    } catch (e) {
                        console.error(`[Proxy] Fallback failed for ${ticket.key}`, e);
                    }
                }
            }));
        }

        return NextResponse.json(tickets);
    } catch (err: any) {
        console.error("Proxy query error:", err);
        return NextResponse.json({ error: err.message || "Failed to fetch from Jira" }, { status: 500 });
    }
}
