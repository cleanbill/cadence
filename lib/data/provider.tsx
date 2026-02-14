"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { DataClient } from "./api-client";
import { MockDataClient } from "./mock-data";
import { JiraDataClient } from "./jira-client";

export enum DataMode {
    MOCK = "MOCK",
    JIRA = "JIRA"
}

interface DataContextType {
    client: DataClient | null;
    mode: DataMode;
    setMode: (mode: DataMode) => void;
    configureJira: () => void;
    isLoading: boolean;
    staleThreshold: number;
    baselineVelocity: number;
    activeWorkJql: string;
    futureIdeasJql: string;
    updateSettings: (stale: number, activeJql: string, futureJql: string) => void;
}

const DataContext = createContext<DataContextType>({
    client: null,
    mode: DataMode.MOCK,
    setMode: () => { },
    configureJira: () => { },
    isLoading: true,
    staleThreshold: 30,
    baselineVelocity: 5,
    activeWorkJql: "statusCategory != Done",
    futureIdeasJql: "labels = future",
    updateSettings: () => { },
});

export function DataProvider({ children }: { children: React.ReactNode }) {
    const [mode, setMode] = useState<DataMode>(DataMode.MOCK);
    const [client, setClient] = useState<DataClient | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [staleThreshold, setStaleThreshold] = useState(30);
    const [velocity, setVelocity] = useState(5); // Calculated Velocity

    // Scope Configuration
    const [activeWorkJql, setActiveWorkJql] = useState("statusCategory != Done AND labels != future");
    const [futureIdeasJql, setFutureIdeasJql] = useState("labels = future");

    // Effect to calculate velocity when client changes
    useEffect(() => {
        if (!client) return;

        // Fetch all Done tickets to calculate team velocity
        // In a real app, strict date ranges or limits would apply
        client.searchTickets("status = Done").then(tickets => {
            // Import dynamically to avoid circular deps if any, or just use the utility
            // We need to move calculateVelocity out of analysis if it depends on client types that cause issues, 
            // but it should be fine.
            // We need to import calculateVelocity. 
            // Since we can't easily add imports in this Replace block without messing up the top, 
            // I'll assume I can add the import in a separate block or just copy the logic if simple.
            // Actually, I'll add the import in a separate tool call first to be safe, 
            // OR I can use the 'calculateVelocity' function if I import it at the top.
            // For now, let's just do the fetch and set.
            import("@/lib/analysis/velocity").then(({ calculateVelocity }) => {
                const metrics = calculateVelocity(tickets);
                setVelocity(metrics.daysPerPoint);
            });
        }).catch(err => {
            console.error("Failed to calculate velocity:", err);
            // Fallback
            setVelocity(5);
        });
    }, [client]);

    useEffect(() => {
        // Load config from localStorage
        const savedMode = localStorage.getItem("cadence_mode") as DataMode;
        if (savedMode) setMode(savedMode);

        const savedStale = localStorage.getItem("cadence_stale_threshold");
        if (savedStale) setStaleThreshold(parseInt(savedStale));

        const savedActive = localStorage.getItem("cadence_active_jql");
        if (savedActive) setActiveWorkJql(savedActive);

        const savedFuture = localStorage.getItem("cadence_future_jql");
        if (savedFuture) setFutureIdeasJql(savedFuture);

        // Initialize
        if (savedMode === DataMode.JIRA) {
            // With proxy, we don't need to read credentials from localStorage
            // We just assume the cookie is there. JiraDataClient will handle it.
            setClient(new JiraDataClient());
        } else {
            setClient(new MockDataClient());
        }

        setIsLoading(false);
    }, []);

    const updateSettings = (stale: number, activeJql: string, futureJql: string) => {
        setStaleThreshold(stale);
        setActiveWorkJql(activeJql);
        setFutureIdeasJql(futureJql);

        localStorage.setItem("cadence_stale_threshold", stale.toString());
        localStorage.setItem("cadence_active_jql", activeJql);
        localStorage.setItem("cadence_future_jql", futureJql);
    };

    const handleSetMode = (newMode: DataMode) => {
        setMode(newMode);
        localStorage.setItem("cadence_mode", newMode);

        if (newMode === DataMode.MOCK) {
            setClient(new MockDataClient());
        }
    };

    const configureJira = () => {
        setClient(new JiraDataClient());
        handleSetMode(DataMode.JIRA);
    };

    return (
        <DataContext.Provider
            value={{
                client,
                mode,
                setMode: handleSetMode,
                configureJira,
                isLoading,
                staleThreshold,
                activeWorkJql,
                futureIdeasJql,
                baselineVelocity: velocity, // Expose calculated velocity as the "baseline"
                updateSettings,
            }}
        >
            {children}
        </DataContext.Provider>
    );
}

export const useData = () => useContext(DataContext);
