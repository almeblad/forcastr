import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { workspaces } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const user = await currentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.userId, user.id),
  });

  if (!workspace) {
    // If no workspace exists, we can return a default or error, 
    // but the frontend handles defaults. Let's return empty/default here.
    return NextResponse.json({ name: "Mitt Företag" });
  }

  return NextResponse.json(workspace);
}

export async function PATCH(req: Request) {
  const user = await currentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json();
  const { name } = body;

  if (!name) {
    return new NextResponse("Name is required", { status: 400 });
  }

  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.userId, user.id),
  });

  if (!workspace) {
    return new NextResponse("Workspace not found", { status: 404 });
  }

  const [updatedWorkspace] = await db
    .update(workspaces)
    .set({ name, updatedAt: new Date() })
    .where(eq(workspaces.id, workspace.id))
    .returning();

  return NextResponse.json(updatedWorkspace);
}
