import { NextRequest, NextResponse } from "next/server";
import { getJiraServerClient } from "@/lib/data/jira-server";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const key = searchParams.get("key");

    if (!key) {
        return NextResponse.json({ error: "Missing ticket key" }, { status: 400 });
    }

    const serverClient = await getJiraServerClient();
    if (!serverClient) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const url = `https://${serverClient.host}/rest/api/3/issue/${key}?expand=names,schema`;
        const authHeader = Buffer.from(`${serverClient.credentials.email}:${serverClient.credentials.apiToken}`).toString("base64");

        const response = await fetch(url, {
            headers: {
                "Authorization": `Basic ${authHeader}`,
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json(errorData, { status: response.status });
        }

        const data = await response.json();

        // Return names and field values for easy debugging
        return NextResponse.json({
            key: data.key,
            names: data.names,
            fields: data.fields
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
