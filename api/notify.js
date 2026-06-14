const { getAccessToken, sendFCM, getServiceAccount } = require("./fcm");

const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY;

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
    if (!uniqueTokens.length) return res.json({ sent: 0, pendientes: pendientes.length, tokens: 0 });

    const sa = getServiceAccount();
    const accessToken = await getAccessToken(sa);

    let sent = 0;
    for (const { token, user_id, sucursal } of uniqueTokens) {
      const notif = pendientes.find(p =>
        (p.user_id && p.user_id === user_id) || (p.sucursal && p.sucursal === sucursal)
      );
      if (!notif) continue;
      try {
        const result = await sendFCM(accessToken, sa.project_id, token,
          `⏰ En 10 min: ${notif.tipo_nombre}`,
          `Límite: ${notif.hora} — Abre la app para registrar.`
        );
        if (result.name) sent++;
        else if (result.error?.details?.includes("not-registered") || result.error?.details?.includes("invalid-registration-token")) {
          await supaDelete("push_tokens", `?token=eq.${encodeURIComponent(token)}`);
        }
      } catch (e) {}
    }

    return res.json({ sent, total: uniqueTokens.length });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
