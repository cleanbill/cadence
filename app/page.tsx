"use client";

import { useData } from "@/lib/data/provider";
import { DataMode } from "@/lib/data/provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TimeBoard } from "@/components/TimeBoard";
import { LandingZoneChart } from "@/components/LandingZoneChart";
import { useState } from "react";


export default function Home() {
  const { mode, isLoading, client, configureJira, setMode } = useData();
  const [jiraHost, setJiraHost] = useState("");
  const [jiraEmail, setJiraEmail] = useState("");
  const [jiraToken, setJiraToken] = useState("");

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  // ONBOARDING VIEW
  if (!client) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Welcome to Cadence</CardTitle>
            <CardDescription className="text-center">
              Subvert Story Points. Return to Time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full h-12 text-lg"
                onClick={() => setMode(DataMode.MOCK)}
              >
                Try Demo Mode (Mock Data)
              </Button>
              <div className="text-center text-xs text-muted-foreground uppercase my-2">-- OR --</div>
              {/* Simple Jira Form */}
              <div className="space-y-2">
                <input
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Jira Host (e.g. yourcompany.atlassian.net)"
                  value={jiraHost}
                  onChange={(e) => setJiraHost(e.target.value)}
                />
                <input
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Email"
                  value={jiraEmail}
                  onChange={(e) => setJiraEmail(e.target.value)}
                />
                <input
                  type="password"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="API Token"
                  value={jiraToken}
                  onChange={(e) => setJiraToken(e.target.value)}
                />
                <Button
                  className="w-full"
                  disabled={!jiraHost || !jiraEmail || !jiraToken}
                  onClick={() => configureJira(jiraHost, jiraEmail, jiraToken)}
                >
                  Connect Jira
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // DASHBOARD VIEW
  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center justify-between space-y-2 mb-4">
          <h2 className="text-3xl font-bold tracking-tight">Landing Zones</h2>
        </div>
        <LandingZoneChart />
      </section>

      <section>
        <h2 className="text-3xl font-bold tracking-tight mb-4">Current Sprint (Time View)</h2>
        <TimeBoard />
      </section>
    </div>
  );
}
