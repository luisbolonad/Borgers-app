import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SUPA_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return Response.json({ error: "Email y contraseña requeridos" }, { status: 400, headers: CORS });
    }

    const res = await fetch(
      `${SUPA_URL}/rest/v1/users?email=eq.${encodeURIComponent(email.toLowerCase())}&activo=eq.true&select=*&limit=1`,
      { headers: { "apikey": SERVICE_KEY, "Authorization": `Bearer ${SERVICE_KEY}` } }
    );
    const rows = await res.json();

    if (!Array.isArray(rows) || rows.length === 0) {
      return Response.json({ error: "Email o contraseña incorrectos" }, { status: 401, headers: CORS });
    }

    const user = rows[0];
    if (user.password !== password) {
      return Response.json({ error: "Email o contraseña incorrectos" }, { status: 401, headers: CORS });
    }

    // Return user without password field
    const { password: _pw, ...safeUser } = user;
    return Response.json({ user: safeUser }, { headers: CORS });

  } catch (e) {
    return Response.json({ error: "Error interno" }, { status: 500, headers: CORS });
  }
});
