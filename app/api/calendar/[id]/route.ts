import { NextResponse } from "next/server";
import { gcalFetch } from "../gcal";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const res = await gcalFetch(`/events/${id}`, { method: "DELETE" });
    if (res.status === 204 || res.ok) return NextResponse.json({ ok: true });
    const data = await res.json();
    return NextResponse.json({ error: data }, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
