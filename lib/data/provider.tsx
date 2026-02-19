"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { DataClient } from "./api-client";
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
    teamVelocity: number; // Points per Week
    activeWorkJql: string;
    futureIdeasJql: string;
    buildLabel: string;
    storyPointField: string;
    jiraBoardId: string;
    teamName: string;
    teamMembers: { id: string; name: string; role: string }[];
    updateSettings: (stale: number, activeJql: string, futureJql: string, buildLabel: string, storyPointField: string, jiraBoardId: string, teamName: string, teamMembers: { id: string; name: string; role: string }[], velocity?: number) => void;
}

const DataContext = createContext<DataContextType>({
    client: null,
    mode: DataMode.MOCK,
    setMode: () => { },
    configureJira: () => { },
    isLoading: true,
    staleThreshold: 30,
    teamVelocity: 10,
    activeWorkJql: "statusCategory != Done",
    futureIdeasJql: "labels = future",
    buildLabel: "build",
    storyPointField: "customfield_10014",
    jiraBoardId: "",
    teamName: "Core Team",
    teamMembers: [],
    updateSettings: () => { },
});

export function DataProvider({ children }: { children: React.ReactNode }) {
    const [mode, setMode] = useState<DataMode>(DataMode.MOCK);
    const [client, setClient] = useState<DataClient | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [staleThreshold, setStaleThreshold] = useState(30);
    const [teamVelocity, setTeamVelocity] = useState(10); // Points per Week
    const [manualVelocity, setManualVelocity] = useState<number | null>(null);

    // Scope Configuration
    const [activeWorkJql, setActiveWorkJql] = useState("statusCategory != Done");
    const [futureIdeasJql, setFutureIdeasJql] = useState("labels = future");
    const [buildLabel, setBuildLabel] = useState("build");
    const [storyPointField, setStoryPointField] = useState("customfield_10014");
    const [jiraBoardId, setJiraBoardId] = useState("");

    // Team Configuration
    const [teamName, setTeamName] = useState("Core Team");
    const [teamMembers, setTeamMembers] = useState<{ id: string; name: string; role: string }[]>([]);

    // Effect to calculate velocity when client changes
    useEffect(() => {
        if (!client) return;

        client.searchTickets("status = Done", storyPointField, jiraBoardId).then(tickets => {
            import("@/lib/analysis/velocity").then(({ calculateVelocity }) => {
                const metrics = calculateVelocity(tickets);
                // Only use calculated if no manual override
                if (manualVelocity === null) {
                    setTeamVelocity(metrics.pointsPerWeek);
                }
            });
        }).catch(err => {
            console.error("Failed to calculate velocity:", err);
            if (manualVelocity === null) setTeamVelocity(10);
        });
    }, [client, manualVelocity, storyPointField]);

    useEffect(() => {
        // Load config from localStorage
        const savedMode = localStorage.getItem("cadence_mode") as DataMode;
        if (savedMode) setMode(savedMode);

        const savedStale = localStorage.getItem("cadence_stale_threshold");
        if (savedStale) setStaleThreshold(parseInt(savedStale));

        const savedVelocity = localStorage.getItem("cadence_team_velocity");
        if (savedVelocity) {
            const v = parseFloat(savedVelocity);
            setTeamVelocity(v);
            setManualVelocity(v);
        }

        let savedActive = localStorage.getItem("cadence_active_jql");
        if (savedActive) setActiveWorkJql(savedActive);

        const savedFuture = localStorage.getItem("cadence_future_jql");
        if (savedFuture) setFutureIdeasJql(savedFuture);

        const savedBuildLabel = localStorage.getItem("cadence_build_label");
        if (savedBuildLabel) setBuildLabel(savedBuildLabel);

        const savedPointField = localStorage.getItem("cadence_story_point_field");
        if (savedPointField) setStoryPointField(savedPointField);

        const savedBoardId = localStorage.getItem("cadence_jira_board_id");
        if (savedBoardId) setJiraBoardId(savedBoardId);

        const savedTeamName = localStorage.getItem("cadence_team_name");
        if (savedTeamName) setTeamName(savedTeamName);

        const savedTeamMembers = localStorage.getItem("cadence_team_members");
        if (savedTeamMembers) {
            try {
                setTeamMembers(JSON.parse(savedTeamMembers));
            } catch (e) {
                console.error("Failed to parse team members", e);
            }
        }

        // Initialize client
        if (savedMode === DataMode.JIRA) {
            setClient(new JiraDataClient(false));
        } else {
            setClient(new JiraDataClient(true));
        }

        setIsLoading(false);
    }, []);

    const updateSettings = (stale: number, activeJql: string, futureJql: string, label: string, pointField: string, boardId: string, tName: string, tMembers: { id: string; name: string; role: string }[], velocity?: number) => {
        setStaleThreshold(stale);
        setActiveWorkJql(activeJql);
        setFutureIdeasJql(futureJql);
        setBuildLabel(label);
        setStoryPointField(pointField);
        setJiraBoardId(boardId);
        setTeamName(tName);
        setTeamMembers(tMembers);

        if (velocity !== undefined) {
            setTeamVelocity(velocity);
            setManualVelocity(velocity);
            localStorage.setItem("cadence_team_velocity", velocity.toString());
        }

        localStorage.setItem("cadence_stale_threshold", stale.toString());
        localStorage.setItem("cadence_active_jql", activeJql);
        localStorage.setItem("cadence_future_jql", futureJql);
        localStorage.setItem("cadence_build_label", label);
        localStorage.setItem("cadence_story_point_field", pointField);
        localStorage.setItem("cadence_jira_board_id", boardId);
        localStorage.setItem("cadence_team_name", tName);
        localStorage.setItem("cadence_team_members", JSON.stringify(tMembers));
    };

    const handleSetMode = (newMode: DataMode) => {
        setMode(newMode);
        localStorage.setItem("cadence_mode", newMode);

        if (newMode === DataMode.MOCK) {
            setClient(new JiraDataClient(true));
        } else {
            setClient(new JiraDataClient(false));
        }
    };

    const configureJira = () => {
        setClient(new JiraDataClient(false));
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
                teamVelocity,
                activeWorkJql,
                futureIdeasJql,
                buildLabel,
                storyPointField,
                jiraBoardId,
                teamName,
                teamMembers,
                updateSettings,
            }}
        >
            {children}
        </DataContext.Provider>
    );
}

export const useData = () => useContext(DataContext);
