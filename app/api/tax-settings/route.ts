import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { workspaces, taxSettings } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { DEFAULT_TAX_SETTINGS_2026 } from "@/lib/calculations";

export async function GET() {
  const user = await currentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.userId, user.id),
  });

  if (!workspace) {
    return new NextResponse("Workspace not found", { status: 404 });
  }

  const currentYear = 2026;
  const dbTaxSettings = await db.query.taxSettings.findFirst({
    where: and(
      eq(taxSettings.workspaceId, workspace.id),
      eq(taxSettings.year, currentYear)
    ),
  });

  return NextResponse.json(dbTaxSettings || { ...DEFAULT_TAX_SETTINGS_2026, workspaceId: workspace.id, year: currentYear });
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json();
  const { municipalityTaxPercent, stateTaxThreshold } = body;

  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.userId, user.id),
  });

  if (!workspace) {
    return new NextResponse("Workspace not found", { status: 404 });
  }

  const currentYear = 2026;

  // Check if settings exist
  const existingSettings = await db.query.taxSettings.findFirst({
    where: and(
        eq(taxSettings.workspaceId, workspace.id),
        eq(taxSettings.year, currentYear)
    ),
  });

  if (existingSettings) {
      await db.update(taxSettings)
        .set({ 
            municipalityTaxPercent: municipalityTaxPercent.toString(),
            stateTaxThreshold,
        })
        .where(eq(taxSettings.id, existingSettings.id));
  } else {
      await db.insert(taxSettings).values({
        workspaceId: workspace.id,
        year: currentYear,
        municipalityTaxPercent: municipalityTaxPercent.toString(),
        stateTaxThreshold,
      });
  }

  return NextResponse.json({ success: true });
}
