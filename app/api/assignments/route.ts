import { NextResponse } from 'next/server';
import { db } from '@/db';
import { assignments } from '@/db/schema';
import { currentUser } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json();
  const { 
    workspaceId, 
    clientId, 
    name, 
    startDate, 
    endDate, 
    hourlyRate, 
    allocationPercent,
    brokerFeePercent
  } = body;

  if (!workspaceId || !clientId || !name || !startDate || !endDate) {
    return new NextResponse("Missing required fields", { status: 400 });
  }

  const [created] = await db.insert(assignments).values({
    workspaceId,
    clientId,
    name,
    startDate, // Drizzle expects date string YYYY-MM-DD or ISO
    endDate,
    hourlyRate,
    allocationPercent,
    brokerFeePercent: String(brokerFeePercent || 0), // Convert to string for decimal/numeric type
  }).returning();

  return NextResponse.json(created);
}
