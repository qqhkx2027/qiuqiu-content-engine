import { createSession, sessionCookie, sessionCookieOptions, verifyCredentials } from "../../../lib/auth";

export async function POST(request: Request) {
  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!verifyCredentials(body.username ?? "", body.password ?? "")) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const response = Response.json({ ok: true });
  response.headers.append("Set-Cookie", `${sessionCookie}=${createSession()}; Path=/; Max-Age=${sessionCookieOptions.maxAge}; HttpOnly; Secure; SameSite=Lax`);
  return response;
}
