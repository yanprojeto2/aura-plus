import { NextResponse } from "next/server";
import { gcalFetch } from "./gcal";

export async function GET() {
  try {
    const now = new Date().toISOString();
    const res = await gcalFetch(
      `/events?singleEvents=true&orderBy=startTime&maxResults=100&timeMin=${now}`
    );
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
    }));

    return NextResponse.json(events);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, note, date, startTime, endTime } = body;

    const startDT = `${date}T${startTime}:00-03:00`;
    const endDT = `${date}T${endTime}:00-03:00`;

    const res = await gcalFetch("/events", {
      method: "POST",
      body: JSON.stringify({
        summary: title,
        description: note,
        start: { dateTime: startDT, timeZone: "America/Sao_Paulo" },
        end: { dateTime: endDT, timeZone: "America/Sao_Paulo" },
      }),
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data }, { status: res.status });
    return NextResponse.json({ id: data.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
