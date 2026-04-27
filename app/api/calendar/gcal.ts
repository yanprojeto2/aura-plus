import crypto from "crypto";

const SCOPE = "https://www.googleapis.com/auth/calendar";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const CAL_BASE = "https://www.googleapis.com/calendar/v3/calendars";

function b64url(buf: Buffer) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function getAccessToken(): Promise<string> {
  const email = process.env.GCAL_CLIENT_EMAIL!.trim();
  const rawKey = process.env.GCAL_PRIVATE_KEY!.replace(/\\n/g, "\n").trim();
  const now = Math.floor(Date.now() / 1000);

  const header = b64url(Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const payload = b64url(Buffer.from(JSON.stringify({
    iss: email, scope: SCOPE,
    aud: TOKEN_URL, exp: now + 3600, iat: now,
  })));

  const sign = crypto.createSign("RSA-SHA256");
  sign.update(`${header}.${payload}`);
  const sig = b64url(sign.sign(rawKey));
  const jwt = `${header}.${payload}.${sig}`;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("Token error: " + JSON.stringify(data));
  return data.access_token;
}

export async function gcalFetch(path: string, options: RequestInit = {}) {
  const token = await getAccessToken();
  const calId = encodeURIComponent(process.env.GCAL_CALENDAR_ID!);
  const url = `${CAL_BASE}/${calId}${path}`;
  return fetch(url, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...options.headers },
  });
}
