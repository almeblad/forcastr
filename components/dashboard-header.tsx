"use client";

import { UserButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export function DashboardHeader() {
  const [workspaceName, setWorkspaceName] = useState("Mitt Företag");

  useEffect(() => {
    // Fetch workspace name
    fetch("/api/workspace")
      .then((res) => res.json())
      .then((data) => {
        if (data.name) {
          setWorkspaceName(data.name);
        }
      })
      .catch((err) => console.error("Failed to fetch workspace name", err));
  }, []);

  return (
    <header className="h-16 bg-white border-b sticky top-0 z-10 px-6 flex items-center justify-between">
      <h1 className="font-semibold text-lg text-slate-800">{workspaceName}</h1>
      <div className="flex items-center gap-4">
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
}
