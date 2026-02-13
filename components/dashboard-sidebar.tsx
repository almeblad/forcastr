"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wallet, Briefcase, Settings, CalendarOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardSidebar() {
  const pathname = usePathname();

  const navigation = [
    { name: "Översikt", href: "/dashboard", icon: LayoutDashboard },
    { name: "Löneplanering", href: "/salary", icon: Wallet },
    { name: "Uppdrag", href: "/assignments", icon: Briefcase },
    { name: "Frånvaro", href: "/absence", icon: CalendarOff },
    { name: "Inställningar", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="hidden w-64 bg-white border-r md:block fixed h-full">
      <div className="h-16 flex items-center px-6 border-b">
        <div className="flex items-center gap-2 font-bold text-xl text-slate-900">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">F</div>
          Forcastr
        </div>
      </div>
      <nav className="p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
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
    </aside>
  );
}
