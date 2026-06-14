const admin = require("firebase-admin");

const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!admin.apps.length) {
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT || "{}";
    const sa = JSON.parse(raw);
    if (sa.private_key) sa.private_key = sa.private_key.replace(/\\n/g, "\n");
    admin.initializeApp({ credential: admin.credential.cert(sa) });
  } catch (e) {
    console.error("[notify] Firebase init error:", e.message);
  }
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

module.exports = async function handler(req, res) {
  if (req.headers["x-cron-secret"] !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Hora actual en Ecuador (UTC-5)
    const now = new Date(Date.now() - 5 * 60 * 60 * 1000);
    const ahoraMins = now.getUTCHours() * 60 + now.getUTCMinutes();
    const hoyNum = now.getUTCDay() === 0 ? 7 : now.getUTCDay();

    const asigs = await supaGet("act_asignaciones", "?activo=eq.true");
    if (!Array.isArray(asigs)) return res.json({ sent: 0, error: "no asigs" });

    const pendientes = [];
    for (const a of asigs) {
      if (!(a.dias_semana || []).includes(hoyNum)) continue;
      const horas = a.horas_limite?.length ? a.horas_limite : (a.hora_limite ? [a.hora_limite] : []);
      for (const h of horas) {
        if (!h) continue;
        const limiteMins = parseInt(h.slice(0, 2)) * 60 + parseInt(h.slice(3, 5));
        const diff = limiteMins - ahoraMins;
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

    if (!pendientes.length) return res.json({ sent: 0, pendientes: 0 });

    const userIds = [...new Set(pendientes.filter(p => p.user_id).map(p => p.user_id))];
    const sucursales = [...new Set(pendientes.filter(p => p.sucursal && !p.user_id).map(p => p.sucursal))];

    let tokenRows = [];
    if (userIds.length) {
      const rows = await supaGet("push_tokens", `?user_id=in.(${userIds.join(",")})`);
      if (Array.isArray(rows)) tokenRows.push(...rows);
    }
    for (const suc of sucursales) {
      const rows = await supaGet("push_tokens", `?sucursal=eq.${encodeURIComponent(suc)}`);
      if (Array.isArray(rows)) tokenRows.push(...rows);
    }

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
            body: `Límite: ${notif.hora} — Abre la app para registrar.`
          },
          android: { priority: "high" },
          apns: { payload: { aps: { sound: "default" } } }
        });
        sent++;
      } catch (e) {
        console.error("[notify] FCM send error:", e.code, e.message);
        if (e.code?.includes("invalid-registration-token") || e.code?.includes("not-registered")) {
          await supaDelete("push_tokens", `?token=eq.${encodeURIComponent(token)}`);
        }
      }
    }

    return res.json({ sent, total: uniqueTokens.length });
  } catch (e) {
    console.error("[notify] handler error:", e.message);
    return res.status(500).json({ error: e.message });
  }
};
