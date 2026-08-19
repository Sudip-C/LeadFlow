import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { leads } from "../../../db/schema";

const allowedStatuses = new Set(["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"]);

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected error";
}

export async function GET() {
  try {
    const db = await getDb();
    const rows = await db.select().from(leads).orderBy(desc(leads.createdAt), desc(leads.id));
    return Response.json({ leads: rows });
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const name = String(payload.name ?? "").trim();
    const email = String(payload.email ?? "").trim();
    const company = String(payload.company ?? "").trim();
    const status = String(payload.status ?? "New");
    const source = String(payload.source ?? "Website").trim();
    const value = Math.max(0, Math.round(Number(payload.value) || 0));

    if (!name || !email || !company) return Response.json({ error: "Name, email, and company are required." }, { status: 400 });
    if (!allowedStatuses.has(status)) return Response.json({ error: "Invalid status." }, { status: 400 });

    const db = await getDb();
    const [lead] = await db.insert(leads).values({ name, email, company, value, status, source }).returning();
    return Response.json({ lead }, { status: 201 });
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const id = Number(payload.id);
    if (!Number.isInteger(id)) return Response.json({ error: "A valid lead is required." }, { status: 400 });

    const isStatusOnly = Object.keys(payload).every((key) => ["id", "status"].includes(key));
    const status = String(payload.status ?? "");
    if (!allowedStatuses.has(status)) return Response.json({ error: "Invalid status." }, { status: 400 });

    const name = String(payload.name ?? "").trim();
    const email = String(payload.email ?? "").trim();
    const company = String(payload.company ?? "").trim();
    const value = Math.max(0, Math.round(Number(payload.value) || 0));
    const source = String(payload.source ?? "Website").trim();

    if (!isStatusOnly && (!name || !email || !company)) {
      return Response.json({ error: "Name, email, and company are required." }, { status: 400 });
    }

    const values = isStatusOnly
      ? { status }
      : { name, email, company, value, status, source };

    const db = await getDb();
    const [lead] = await db.update(leads).set(values).where(eq(leads.id, id)).returning();
    if (!lead) return Response.json({ error: "Lead not found." }, { status: 404 });
    return Response.json({ lead });
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const payload = (await request.json()) as { id?: number };
    const id = Number(payload.id);
    if (!Number.isInteger(id)) return Response.json({ error: "A valid lead is required." }, { status: 400 });

    const db = await getDb();
    const [lead] = await db.delete(leads).where(eq(leads.id, id)).returning();
    if (!lead) return Response.json({ error: "Lead not found." }, { status: 404 });
    return Response.json({ lead });
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}
