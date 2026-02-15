import { NextRequest, NextResponse } from "next/server";
import { getJiraServerClient } from "@/lib/data/jira-server";
import { MOCK_USERS } from "@/lib/data/jira-mock-server";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const isMock = searchParams.get("mock") === "true";

    if (isMock) {
        return NextResponse.json(MOCK_USERS[0]);
    }

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
    } catch (err: any) {
        console.error("Proxy myself error:", err);
        const status = err.response?.status || 500;
        const message = err.response?.data?.errorMessages?.[0] || err.message || "Failed to fetch user from Jira";
        return NextResponse.json({ error: message }, { status });
    }
}
