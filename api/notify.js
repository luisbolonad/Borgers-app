import admin from "firebase-admin";

const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}

async function supaGet(table, query) {
  const r = await fetch(`${SUPA_URL}/rest/v1/${table}${query}`, {
    headers: { "apikey": SUPA_KEY, "Authorization": `Bearer ${SUPA_KEY}` }
  });
  return r.json();
}

async function supaDelete(table, query) {
  await fetch(`${SUPA_URL}/rest/v1/${table}${query}`, {
    method: "DELETE",
    headers: { "apikey": SUPA_KEY, "Authorization": `Bearer ${SUPA_KEY}` }
  });
}

export default async function handler(req, res) {
  // Verificar clave secreta para que solo el cron pueda llamar esto
  if (req.headers["x-cron-secret"] !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Hora actual en Ecuador (UTC-5)
    const now = new Date(Date.now() - 5 * 60 * 60 * 1000);
    const horaActual = now.toISOString().slice(11, 16); // "HH:MM"
    const ahoraMins = parseInt(horaActual.slice(0, 2)) * 60 + parseInt(horaActual.slice(3, 5));
    const hoyNum = now.getUTCDay() === 0 ? 7 : now.getUTCDay();

    // Obtener asignaciones activas
    const asigs = await supaGet("act_asignaciones", "?activo=eq.true");
    if (!Array.isArray(asigs)) return res.json({ sent: 0 });

    // Notificaciones a enviar: { user_id?, sucursal?, tipo_nombre, hora }
    const pendientes = [];

    for (const a of asigs) {
      if (!(a.dias_semana || []).includes(hoyNum)) continue;
      const horas = a.horas_limite?.length ? a.horas_limite : (a.hora_limite ? [a.hora_limite] : []);
      for (const h of horas) {
        if (!h) continue;
        const limiteMins = parseInt(h.slice(0, 2)) * 60 + parseInt(h.slice(3, 5));
        const diff = limiteMins - ahoraMins;
        // Avisar 10 min antes (ventana de ±2 min para no perderse)
        if (diff >= 8 && diff <= 12) {
          pendientes.push({
            user_id: a.user_id ? String(a.user_id) : null,
            sucursal: a.sucursal || null,
            tipo_nombre: a.tipo_nombre || "Actividad",
            hora: h
          });
        }
      }
    }

    if (!pendientes.length) return res.json({ sent: 0 });

    // Obtener tokens
    const userIds = [...new Set(pendientes.filter(p => p.user_id).map(p => p.user_id))];
    const sucursales = [...new Set(pendientes.filter(p => p.sucursal && !p.user_id).map(p => p.sucursal))];

    let tokenRows = [];

    if (userIds.length) {
      const rows = await supaGet("push_tokens", `?user_id=in.(${userIds.join(",")})`);
      if (Array.isArray(rows)) tokenRows.push(...rows);
    }

    if (sucursales.length) {
      for (const suc of sucursales) {
        const rows = await supaGet("push_tokens", `?sucursal=eq.${encodeURIComponent(suc)}`);
        if (Array.isArray(rows)) tokenRows.push(...rows);
      }
    }

    // Deduplicar por token
    const uniqueTokens = [...new Map(tokenRows.map(r => [r.token, r])).values()];

    let sent = 0;
    for (const { token, user_id, sucursal } of uniqueTokens) {
      const notif = pendientes.find(p =>
        (p.user_id && p.user_id === user_id) || (p.sucursal && p.sucursal === sucursal)
      );
      if (!notif) continue;

      try {
        await admin.messaging().send({
          token,
          notification: {
            title: `⏰ En 10 min: ${notif.tipo_nombre}`,
            body: `Límite: ${notif.hora} — Ábrela app para registrar.`
          },
          android: { priority: "high", notification: { channelId: "actividades" } },
          apns: { payload: { aps: { sound: "default" } } }
        });
        sent++;
      } catch (e) {
        // Token inválido — eliminarlo de la DB
        if (e.code?.includes("invalid-registration-token") || e.code?.includes("not-registered")) {
          await supaDelete("push_tokens", `?token=eq.${encodeURIComponent(token)}`);
        }
      }
    }

    return res.json({ sent, total: uniqueTokens.length });
  } catch (e) {
    console.error("[notify]", e);
    return res.status(500).json({ error: e.message });
  }
}
