import { cookies } from "next/headers";
import { Version3Client } from "jira.js";

export async function getJiraServerClient() {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get("cadence_jira_auth");

    if (!authCookie?.value) {
        return null;
    }

    try {
        const { host: rawHost, email, apiToken } = JSON.parse(
            Buffer.from(authCookie.value, "base64").toString("utf8")
        );

        // Standardize host: remove protocol if exists, remove trailing slash, then add https://
        let host = rawHost.replace(/^https?:\/\//, "").replace(/\/$/, "");
        console.log(`[Jira Server] Initializing client for host: https://${host}`);

        return {
            client: new Version3Client({
                host: `https://${host}`,
                authentication: {
                    basic: { email, apiToken },
                },
            }),
            host,
            credentials: { email, apiToken }
        };
    } catch (err) {
        console.error("Failed to parse Jira auth cookie:", err);
        return null;
    }
}
