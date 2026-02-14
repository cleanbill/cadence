import { NextResponse } from "next/server";
import { getJiraServerClient } from "@/lib/data/jira-server";

export async function GET() {
    const serverClient = await getJiraServerClient();
    if (!serverClient) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { client } = serverClient;

    try {
        const users = await client.userSearch.findUsers({ query: "" });
        const result = users.map((u) => ({
            accountId: u.accountId || "",
            displayName: u.displayName || "",
            avatarUrl: u.avatarUrls?.["48x48"] || "",
        }));
        return NextResponse.json(result);
    } catch (err) {
        console.error("Proxy users error:", err);
        return NextResponse.json({ error: "Failed to fetch users from Jira" }, { status: 500 });
    }
}
