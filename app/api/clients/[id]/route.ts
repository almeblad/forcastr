import { NextResponse } from 'next/server';
import { db } from '@/db';
import { clients } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { currentUser } from '@clerk/nextjs/server';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  // In a real app we should verify that the user owns the workspace of this client
  const { id } = await params;

  await db.delete(clients).where(eq(clients.id, id));

  return new NextResponse(null, { status: 204 });
}
