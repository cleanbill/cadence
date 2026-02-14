import { NextResponse } from "next/server";
import { getJiraServerClient } from "@/lib/data/jira-server";

export async function GET() {
    const serverClient = await getJiraServerClient();
    if (!serverClient) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { client } = serverClient;

    try {
        const user = await client.myself.getCurrentUser();
        return NextResponse.json({
            accountId: user.accountId || "",
            displayName: user.displayName || "Unknown",
            avatarUrl: user.avatarUrls?.["48x48"] || "",
            emailAddress: user.emailAddress,
        });
    } catch (err) {
        console.error("Proxy myself error:", err);
        return NextResponse.json({ error: "Failed to fetch user from Jira" }, { status: 500 });
    }
}
