"use client";
import * as React from "react";
import { Sidebar, type SidebarItem } from "@/components/organisms/sidebar";

export interface DashboardShellProps {
  sidebarItems: SidebarItem[];
  children: React.ReactNode;
}

export function DashboardShell({ sidebarItems, children }: DashboardShellProps) {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] grid-cols-[auto_1fr] gap-0">
      <Sidebar items={sidebarItems} />
      <div className="p-6">{children}</div>
    </div>
  );
}
