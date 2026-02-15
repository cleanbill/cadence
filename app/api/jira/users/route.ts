import { NextRequest, NextResponse } from "next/server";
import { getJiraServerClient } from "@/lib/data/jira-server";
import { MOCK_USERS } from "@/lib/data/jira-mock-server";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const isMock = searchParams.get("mock") === "true";

    if (isMock) {
        return NextResponse.json(MOCK_USERS);
    }

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
    } catch (err: any) {
        console.error("Proxy users error:", err);
        const status = err.response?.status || 500;
        const message = err.response?.data?.errorMessages?.[0] || err.message || "Failed to fetch users from Jira";
        return NextResponse.json({ error: message }, { status });
    }
}
