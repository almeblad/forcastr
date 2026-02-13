import { NextResponse } from 'next/server';
import { db } from '@/db';
import { absences } from '@/db/schema';
import { currentUser } from '@clerk/nextjs/server';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) {
    return new NextResponse("Workspace ID required", { status: 400 });
  }

  const result = await db
    .select()
    .from(absences)
    .where(eq(absences.workspaceId, workspaceId))
    .orderBy(desc(absences.startDate));

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json();
  const { workspaceId, startDate, endDate, type, description } = body;

  if (!workspaceId || !startDate || !endDate || !type) {
    return new NextResponse("Missing required fields", { status: 400 });
  }

  const [created] = await db.insert(absences).values({
    workspaceId,
    startDate,
    endDate,
    type,
    description,
  }).returning();

  return NextResponse.json(created);
}
