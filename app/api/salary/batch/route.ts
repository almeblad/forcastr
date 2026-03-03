import { NextResponse } from 'next/server';
import { db } from '@/db';
import { salaries } from '@/db/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { currentUser } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json();
  const { workspaceId, updates } = body; // updates is array of { month, grossSalary }

  if (!workspaceId || !Array.isArray(updates) || updates.length === 0) {
    return new NextResponse("Invalid request body", { status: 400 });
  }

  try {
    const monthsToUpdate = updates.map((u: any) => u.month);

    // Fetch existing records for these months
    const existingSalaries = await db.query.salaries.findMany({
      where: and(
        eq(salaries.workspaceId, workspaceId),
        inArray(salaries.month, monthsToUpdate)
      ),
    });

    const existingMap = new Map(existingSalaries.map(s => [s.month, s]));
    const operations = [];

    for (const update of updates) {
      const { month, grossSalary } = update;
      const existing = existingMap.get(month);

      if (existing) {
        // Update
        operations.push(
          db.update(salaries)
            .set({ 
              grossSalary, 
              // Preserve other fields if not provided? For now we only sync grossSalary
            })
            .where(eq(salaries.id, existing.id))
        );
      } else {
        // Insert
        operations.push(
          db.insert(salaries).values({
            workspaceId,
            month,
            grossSalary,
            employerTaxPercent: '31.42', // Default
            pensionProvision: 0,
          })
        );
      }
    }

    // Run all operations
    await Promise.all(operations);

    return NextResponse.json({ success: true, count: operations.length });
  } catch (error) {
    console.error("Batch salary update failed:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
