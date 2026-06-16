const { getAccessToken, sendFCM, getServiceAccount } = require("./fcm");

const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (req.headers["x-cron-secret"] !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { sucursal, titulo, autor } = req.body || {};

  try {
    // Get tokens for target users
    let tokenRows = [];
    if (sucursal) {
      // Send to specific sucursal
      const r1 = await fetch(`${SUPA_URL}/rest/v1/push_tokens?sucursal=eq.${encodeURIComponent(sucursal)}`, {
        headers: { "apikey": SUPA_KEY, "Authorization": `Bearer ${SUPA_KEY}` }
      });
      const rows = await r1.json();
      if (Array.isArray(rows)) tokenRows.push(...rows);

      // Also users from that sucursal who registered by user_id
      const r2 = await fetch(`${SUPA_URL}/rest/v1/users?sucursal=eq.${encodeURIComponent(sucursal)}&activo=eq.true&select=id`, {
        headers: { "apikey": SUPA_KEY, "Authorization": `Bearer ${SUPA_KEY}` }
      });
      const users = await r2.json();
      if (Array.isArray(users) && users.length) {
        const ids = users.map(u => u.id).join(",");
        const r3 = await fetch(`${SUPA_URL}/rest/v1/push_tokens?user_id=in.(${ids})`, {
          headers: { "apikey": SUPA_KEY, "Authorization": `Bearer ${SUPA_KEY}` }
        });
        const rows3 = await r3.json();
        if (Array.isArray(rows3)) tokenRows.push(...rows3);
      }
    } else {
      // Send to all
      const r = await fetch(`${SUPA_URL}/rest/v1/push_tokens?select=*`, {
        headers: { "apikey": SUPA_KEY, "Authorization": `Bearer ${SUPA_KEY}` }
      });
      const rows = await r.json();
      if (Array.isArray(rows)) tokenRows.push(...rows);
    }

    const uniqueTokens = [...new Map(tokenRows.map(r => [r.token, r])).values()];
    if (!uniqueTokens.length) return res.json({ sent: 0 });

    const sa = getServiceAccount();
    const accessToken = await getAccessToken(sa);

    let sent = 0;
    for (const { token } of uniqueTokens) {
      try {
        const result = await sendFCM(accessToken, sa.project_id, token,
          `📢 ${autor || "Borgers"}`,
          titulo || "Tienes un nuevo comunicado"
        );
        if (result.name) sent++;
      } catch (e) {}
    }

    return res.json({ sent, total: uniqueTokens.length });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
