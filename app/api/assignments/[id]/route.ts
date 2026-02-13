import { NextResponse } from 'next/server';
import { db } from '@/db';
import { assignments, workspaces } from '@/db/schema';
import { currentUser } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await currentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;

  // Verify ownership via workspace
  // We join assignments with workspaces to check if the workspace belongs to the user
  const assignment = await db
    .select({
      id: assignments.id,
      userId: workspaces.userId,
    })
    .from(assignments)
    .innerJoin(workspaces, eq(assignments.workspaceId, workspaces.id))
    .where(eq(assignments.id, id))
    .limit(1);

  if (assignment.length === 0) {
    return new NextResponse("Assignment not found", { status: 404 });
  }

  if (assignment[0].userId !== user.id) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  await db.delete(assignments).where(eq(assignments.id, id));

  return new NextResponse(null, { status: 204 });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await currentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { endDate, hourlyRate, allocationPercent } = body;

  // Validation
  if (!endDate && !hourlyRate && !allocationPercent) {
    return new NextResponse("No fields to update", { status: 400 });
  }

  // Verify ownership
  const assignment = await db
    .select({
      id: assignments.id,
      userId: workspaces.userId,
    })
    .from(assignments)
    .innerJoin(workspaces, eq(assignments.workspaceId, workspaces.id))
    .where(eq(assignments.id, id))
    .limit(1);

  if (assignment.length === 0) {
    return new NextResponse("Assignment not found", { status: 404 });
  }

  if (assignment[0].userId !== user.id) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  // Update
  const [updated] = await db
    .update(assignments)
    .set({
      ...(endDate && { endDate }),
      ...(hourlyRate && { hourlyRate: parseInt(hourlyRate) }),
      ...(allocationPercent && { allocationPercent: parseInt(allocationPercent) }),
    })
    .where(eq(assignments.id, id))
    .returning();

  return NextResponse.json(updated);
}
