import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { workspaces, absences } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { AbsenceList } from "@/components/absence/absence-list";
import { CreateAbsenceForm } from "@/components/absence/create-absence-form";
import { HolidaySuggestions } from "@/components/absence/holiday-suggestions";

export default async function AbsencePage() {
  const user = await currentUser();
  if (!user) return redirect("/sign-in");

  let workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.userId, user.id),
  });

  if (!workspace) {
    return redirect("/dashboard");
  }

  const absenceList = await db
    .select()
    .from(absences)
    .where(eq(absences.workspaceId, workspace.id))
    .orderBy(asc(absences.startDate));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Frånvaro</h1>
          <p className="text-slate-500">Hantera semester, sjukdom och annan ledighet.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[350px_1fr]">
        <div className="space-y-6">
          <CreateAbsenceForm workspaceId={workspace.id} />
          <HolidaySuggestions workspaceId={workspace.id} />
        </div>
        <div>
          <AbsenceList absences={absenceList} />
        </div>
      </div>
    </div>
  );
}
