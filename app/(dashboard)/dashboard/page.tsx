import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { workspaces, assignments, salaries, absences } from "@/db/schema";
import { eq } from "drizzle-orm";
import { calculateMonthlyFinancials } from "@/lib/dashboard-calculations";
import { DashboardCharts } from "@/components/dashboard-charts";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) return redirect("/sign-in");

  // Fetch or create default workspace
  let workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.userId, user.id),
  });

  if (!workspace) {
     const [newWorkspace] = await db.insert(workspaces).values({
      userId: user.id,
      name: "Mitt Företag",
    }).returning();
    workspace = newWorkspace;
  }

  // Fetch all necessary data
  const [dbAssignments, dbSalaries, dbAbsences] = await Promise.all([
    db.query.assignments.findMany({
      where: eq(assignments.workspaceId, workspace.id),
    }),
    db.query.salaries.findMany({
      where: eq(salaries.workspaceId, workspace.id),
    }),
    db.query.absences.findMany({
      where: eq(absences.workspaceId, workspace.id),
    })
  ]);

  // Calculate financials
  const financialData = calculateMonthlyFinancials(dbAssignments, dbSalaries, dbAbsences, 2026);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <h1 className="text-3xl font-bold">Översikt</h1>
         <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <Link href="/assignments" className="flex-1 md:flex-none">
               <Button className="w-full">Hantera Uppdrag</Button>
            </Link>
            <Link href="/salary" className="flex-1 md:flex-none">
               <Button variant="outline" className="w-full">Planera Lön</Button>
            </Link>
            <Link href="/absence" className="flex-1 md:flex-none">
               <Button variant="outline" className="w-full">Lägg in Frånvaro</Button>
            </Link>
         </div>
      </div>
      
      <DashboardCharts data={financialData} />
    </div>
  );
}
