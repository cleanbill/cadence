import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Version3Client } from "jira.js";

export async function POST(req: NextRequest) {
    try {
        const { host, email, apiToken } = await req.json();

        if (!host || !email || !apiToken) {
            return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
        }

        // Validate credentials with Jira
        const client = new Version3Client({
            host,
            authentication: {
                basic: { email, apiToken },
            },
        });

        try {
            await client.myself.getCurrentUser();
        } catch (err) {
            console.error("Jira authentication failed:", err);
            return NextResponse.json({ error: "Invalid Jira credentials" }, { status: 401 });
        }

        // Store host and auth in a secure cookie
        const authData = Buffer.from(JSON.stringify({ host, email, apiToken })).toString("base64");

        const cookieStore = await cookies();
        cookieStore.set("cadence_jira_auth", authData, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 60 * 60 * 24 * 30, // 30 days
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Auth route error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
