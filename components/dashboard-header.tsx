"use client";

import { UserButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, LayoutDashboard, Wallet, Briefcase, Settings, CalendarOff } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function DashboardHeader() {
  const [workspaceName, setWorkspaceName] = useState("Mitt Företag");
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Fetch workspace name
    fetch("/api/workspace")
      .then((res) => res.json())
      .then((data) => {
        if (data?.name) {
          setWorkspaceName(data.name);
        }
      })
      .catch((err) => console.error("Failed to fetch workspace name", err));
  }, []);

  const navigation = [
    { name: "Översikt", href: "/dashboard", icon: LayoutDashboard },
    { name: "Löneplanering", href: "/salary", icon: Wallet },
    { name: "Uppdrag", href: "/assignments", icon: Briefcase },
    { name: "Frånvaro", href: "/absence", icon: CalendarOff },
    { name: "Inställningar", href: "/settings", icon: Settings },
  ];

  return (
    <header className="h-16 bg-white border-b sticky top-0 z-10 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Öppna meny</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Navigationsmeny</SheetTitle>
            <div className="h-16 flex items-center px-6 border-b">
              <div className="flex items-center gap-2 font-bold text-xl text-slate-900">
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">F</div>
                Forcastr
              </div>
            </div>
            <nav className="flex flex-col gap-1 p-4">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive 
                        ? "bg-slate-100 text-slate-900" 
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <item.icon className={cn("w-5 h-5", isActive ? "text-slate-900" : "text-slate-500")} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
        <h1 className="font-semibold text-lg text-slate-800">{workspaceName}</h1>
      </div>
      <div className="flex items-center gap-4">
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
}
