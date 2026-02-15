"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BarChart3, BookOpen, Settings, LayoutDashboard, Flag } from "lucide-react";
import { useData } from "@/lib/data/provider";
import { cn } from "@/lib/utils";
import { SettingsDialog } from "@/components/SettingsDialog";

export function SiteHeader() {
    const { mode } = useData();
    const pathname = usePathname();

    const navItems = [
        { href: "/", label: "Dashboard", icon: LayoutDashboard },
        { href: "/reports/monthly", label: "Monthly Reports", icon: BarChart3 },
        { href: "/notes", label: "Notes", icon: BookOpen },
        // Adding a dedicated view for stale/flagged could be good, but user asked for "options". 
        // Let's add a "Backlog Hygiene" or "Flagged" tab if needed, or just keep it in dashboard.
        // user asked "Where is the flagged ticket list options". Let's assume a new page is best for distinct focus.
        { href: "/stale", label: "Stale", icon: Flag },
    ];

    return (
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="w-full flex h-16 items-center px-6">
                <div className="flex items-center gap-6">
                    <Link className="flex items-center space-x-2 font-bold text-xl" href="/">
                        <span>Cadence</span>
                        <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border">
                            {mode} MODE
                        </span>
                    </Link>
                    <nav className="flex items-center space-x-1">
                        {navItems.map((item) => {
                            const isActive = item.href === "/"
                                ? pathname === "/"
                                : pathname?.startsWith(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2",
                                        isActive
                                            ? "border-primary text-primary"
                                            : "border-transparent text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <item.icon size={16} />
                                    {item.label}
                                </Link>
                            )
                        })}
                    </nav>
                </div>
                <div className="ml-auto flex items-center space-x-2">
                    <SettingsDialog />
                </div>
            </div>
        </header>
    );
}
