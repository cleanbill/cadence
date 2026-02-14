import { cookies } from "next/headers";
import { Version3Client } from "jira.js";

export async function getJiraServerClient() {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get("cadence_jira_auth");

    if (!authCookie?.value) {
        return null;
    }

    try {
        const { host, email, apiToken } = JSON.parse(
            Buffer.from(authCookie.value, "base64").toString("utf8")
        );

        return {
            client: new Version3Client({
                host,
                authentication: {
                    basic: { email, apiToken },
                },
            }),
            host
        };
    } catch (err) {
        console.error("Failed to parse Jira auth cookie:", err);
        return null;
    }
}
