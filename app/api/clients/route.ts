import { NextResponse } from 'next/server';
import { db } from '@/db';
import { clients } from '@/db/schema';
import { currentUser } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json();
  const { workspaceId, name } = body;

  if (!workspaceId || !name) {
    return new NextResponse("Missing required fields", { status: 400 });
  }

  const [created] = await db.insert(clients).values({
    workspaceId,
    name,
  }).returning();

  return NextResponse.json(created);
}
