import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { workspaces, salaries, taxSettings, absences, assignments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { SalaryPlanner } from "@/components/salary-planner";
import { DEFAULT_TAX_SETTINGS_2026, TaxYearSettings } from "@/lib/calculations";
import { calculateMonthlyStats } from "@/lib/salary-stats";
import { getHolidaysAndBridgeDays } from "@/lib/holidays";

export default async function SalaryPage() {
  const user = await currentUser();
  if (!user) return redirect("/sign-in");

  // Fetch workspace
  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.userId, user.id),
  });

  if (!workspace) {
    // Should ideally redirect to an onboarding or dashboard that creates it
    return redirect("/dashboard");
  }

  // Fetch tax settings for current year (2026), or use defaults
  const currentYear = 2026;
  const dbTaxSettings = await db.query.taxSettings.findFirst({
    where: and(
      eq(taxSettings.workspaceId, workspace.id),
      eq(taxSettings.year, currentYear)
    ),
  });

  const activeTaxSettings: TaxYearSettings = dbTaxSettings 
    ? {
        year: dbTaxSettings.year,
        stateTaxThreshold: dbTaxSettings.stateTaxThreshold,
        municipalityTaxPercent: Number(dbTaxSettings.municipalityTaxPercent),
        employerTaxPercent: DEFAULT_TAX_SETTINGS_2026.employerTaxPercent, // Simplified: assuming standard rate
      }
    : DEFAULT_TAX_SETTINGS_2026;

  // Fetch existing salary entries for this year
  const salaryEntries = await db.query.salaries.findMany({
    where: eq(salaries.workspaceId, workspace.id),
  });

  // Fetch absences for stats
  const absenceEntries = await db.query.absences.findMany({
    where: eq(absences.workspaceId, workspace.id),
  });

  // Fetch assignments for revenue stats
  const assignmentEntries = await db.query.assignments.findMany({
      where: eq(assignments.workspaceId, workspace.id),
  });

  // Fetch holidays
  const holidays = await getHolidaysAndBridgeDays(currentYear);

  // Calculate monthly stats (workable hours, absence days, revenue)
  const monthlyStats = calculateMonthlyStats(currentYear, absenceEntries, holidays, assignmentEntries);

  // Prepare data for the client component
  // Map DB entries to a format suitable for the UI (key by month)
  const salaryMap: Record<string, any> = {};
  salaryEntries.forEach(entry => {
    salaryMap[entry.month] = {
        id: entry.id,
        grossSalary: entry.grossSalary,
        pensionProvision: entry.pensionProvision,
    };
  });

  return (
    <div className="container mx-auto py-8">
       <h1 className="text-3xl font-bold mb-6">Löneplanering {currentYear}</h1>
       <SalaryPlanner 
         workspaceId={workspace.id}
         initialSalaryMap={salaryMap}
         taxSettings={activeTaxSettings}
         monthlyStats={monthlyStats}
       />
    </div>
  );
}
