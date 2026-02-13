import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { workspaces, clients, assignments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AssignmentList } from "@/components/assignments/assignment-list";
import { ClientList } from "@/components/assignments/client-list";
import { AddClientDialog } from "@/components/assignments/add-client-dialog";
import { AddAssignmentDialog } from "@/components/assignments/add-assignment-dialog";

export default async function AssignmentsPage() {
  const user = await currentUser();
  if (!user) return redirect("/sign-in");

  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.userId, user.id),
  });

  if (!workspace) return redirect("/dashboard");

  // Fetch data
  const workspaceClients = await db.query.clients.findMany({
    where: eq(clients.workspaceId, workspace.id),
  });

  const activeAssignments = await db.query.assignments.findMany({
    where: eq(assignments.workspaceId, workspace.id),
  });
  
  // Manual join for display (simplified)
  const assignmentsWithClientName = activeAssignments.map(a => ({
      ...a,
      clientName: workspaceClients.find(c => c.id === a.clientId)?.name || "Okänd kund"
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Uppdrag & Kunder</h1>
        
        <div className="flex gap-2">
            <AddClientDialog workspaceId={workspace.id} />
            <AddAssignmentDialog workspaceId={workspace.id} clients={workspaceClients} />
        </div>
      </div>

      <AssignmentList assignments={assignmentsWithClientName} />
      <ClientList clients={workspaceClients} />
    </div>
  );
}
