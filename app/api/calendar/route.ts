import { NextResponse } from "next/server";
import { gcalFetch } from "./gcal";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    let query: string;
    if (date) {
      const tMin = encodeURIComponent(`${date}T00:00:00-03:00`);
      const tMax = encodeURIComponent(`${date}T23:59:59-03:00`);
      query = `/events?singleEvents=true&orderBy=startTime&maxResults=100&timeMin=${tMin}&timeMax=${tMax}`;
    } else {
      query = `/events?singleEvents=true&orderBy=startTime&maxResults=100&timeMin=${new Date().toISOString()}`;
    }

    const res = await gcalFetch(query);
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data }, { status: res.status });

    const events = (data.items ?? []).map((e: any) => ({
      id: e.id,
      title: e.summary ?? "(sem título)",
      note: e.description ?? "",
      date: (e.start?.date ?? e.start?.dateTime ?? "").slice(0, 10),
      startTime: e.start?.dateTime ? e.start.dateTime.slice(11, 16) : "00:00",
      endTime: e.end?.dateTime ? e.end.dateTime.slice(11, 16) : "00:00",
      color: "bg-blue-400",
      syncSource: e.extendedProperties?.private?.sync_source ?? null,
    }));

    return NextResponse.json(events);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, note, date, startTime, endTime, syncSource } = body;

    const startDT = `${date}T${startTime}:00-03:00`;
    const endDT = `${date}T${endTime}:00-03:00`;

    const gcalBody: Record<string, unknown> = {
      summary: title,
      description: note,
      start: { dateTime: startDT, timeZone: "America/Sao_Paulo" },
      end: { dateTime: endDT, timeZone: "America/Sao_Paulo" },
    };
    if (syncSource) {
      gcalBody.extendedProperties = { private: { sync_source: syncSource } };
    }

    const res = await gcalFetch("/events", { method: "POST", body: JSON.stringify(gcalBody) });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data }, { status: res.status });
    return NextResponse.json({ id: data.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
