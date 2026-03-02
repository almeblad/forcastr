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
  const { 
    municipalityCode, 
    municipalityName, 
    municipalTaxPercent, 
    countyTaxPercent, 
    burialFeePercent,
    churchTaxEnabled,
    stateTaxThreshold 
  } = body;

  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.userId, user.id),
  });

  if (!workspace) {
    return new NextResponse("Workspace not found", { status: 404 });
  }

  const currentYear = 2026;

  const existingSettings = await db.query.taxSettings.findFirst({
    where: and(
        eq(taxSettings.workspaceId, workspace.id),
        eq(taxSettings.year, currentYear)
    ),
  });

  const settingsData = {
    municipalityCode: municipalityCode || null,
    municipalityName: municipalityName || null,
    municipalTaxPercent: municipalTaxPercent?.toString() || '30.00',
    countyTaxPercent: countyTaxPercent?.toString() || '0',
    burialFeePercent: burialFeePercent?.toString() || '0.30',
    stateTaxThreshold: stateTaxThreshold || 643000,
    churchTaxEnabled: churchTaxEnabled ?? true,
  };

  if (existingSettings) {
      await db.update(taxSettings)
        .set(settingsData)
        .where(eq(taxSettings.id, existingSettings.id));
  } else {
      await db.insert(taxSettings).values({
        workspaceId: workspace.id,
        year: currentYear,
        ...settingsData,
      });
  }

  return NextResponse.json({ success: true });
}
