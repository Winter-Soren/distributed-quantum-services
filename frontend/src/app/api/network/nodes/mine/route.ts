import { type NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/shared/lib/mongodb";
import { getSession } from "@/features/auth/server/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const db = await getDatabase();
  const docs = await db
    .collection("user_nodes")
    .find({ user_id: userId })
    .sort({ registered_at: -1 })
    .toArray();

  const nodes = docs.map((d) => ({
    peerId: d.peer_id,
    label: d.label ?? null,
    host: d.host ?? null,
    port: d.port ?? null,
    registeredAt: d.registered_at,
  }));

  return NextResponse.json({ nodes });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await request.json();
  const { peerId, host, port, label } = body as {
    peerId: string;
    host: string;
    port: number;
    label?: string;
  };

  if (!peerId || !host || !port) {
    return NextResponse.json(
      { error: "peerId, host, and port are required" },
      { status: 400 }
    );
  }

  const db = await getDatabase();
  const col = db.collection("user_nodes");

  const existing = await col.findOne({ user_id: userId, peer_id: peerId });
  if (existing) {
    return NextResponse.json(
      { error: "Node already registered" },
      { status: 409 }
    );
  }

  const doc = {
    user_id: userId,
    peer_id: peerId,
    host,
    port,
    label: label ?? null,
    registered_at: new Date().toISOString(),
  };
  await col.insertOne(doc);

  return NextResponse.json({
    peerId,
    label: label ?? null,
    host,
    port,
    registeredAt: doc.registered_at,
  });
}
