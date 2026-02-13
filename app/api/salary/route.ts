import { NextResponse } from 'next/server';
import { db } from '@/db';
import { salaries } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { currentUser } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json();
  const { workspaceId, month, grossSalary, employerTaxPercent, pensionProvision } = body;

  if (!workspaceId || !month || grossSalary === undefined) {
    return new NextResponse("Missing required fields", { status: 400 });
  }

  // Check if salary record exists for this month
  const existingSalary = await db.query.salaries.findFirst({
    where: and(
      eq(salaries.workspaceId, workspaceId),
      eq(salaries.month, month)
    ),
  });

  if (existingSalary) {
    // Update existing
    const [updated] = await db.update(salaries)
      .set({
        grossSalary,
        employerTaxPercent: employerTaxPercent?.toString() || existingSalary.employerTaxPercent,
        pensionProvision: pensionProvision || 0,
      })
      .where(eq(salaries.id, existingSalary.id))
      .returning();
    return NextResponse.json(updated);
  } else {
    // Create new
    const [created] = await db.insert(salaries).values({
      workspaceId,
      month,
      grossSalary,
      employerTaxPercent: employerTaxPercent?.toString() || '31.42',
      pensionProvision: pensionProvision || 0,
    }).returning();
    return NextResponse.json(created);
  }
}
