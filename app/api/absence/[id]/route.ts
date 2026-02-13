import { NextResponse } from 'next/server';
import { db } from '@/db';
import { absences, workspaces } from '@/db/schema';
import { currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await currentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;

  // Verify ownership
  const absence = await db
    .select({
      id: absences.id,
      userId: workspaces.userId,
    })
    .from(absences)
    .innerJoin(workspaces, eq(absences.workspaceId, workspaces.id))
    .where(eq(absences.id, id))
    .limit(1);

  if (absence.length === 0) {
    return new NextResponse("Absence not found", { status: 404 });
  }

  if (absence[0].userId !== user.id) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  await db.delete(absences).where(eq(absences.id, id));

  return new NextResponse(null, { status: 204 });
}
