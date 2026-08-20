import { sessionCookie } from "../../../lib/auth";

export async function POST() {
  const response = Response.json({ ok: true });
  response.headers.append("Set-Cookie", `${sessionCookie}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
  return response;
}
