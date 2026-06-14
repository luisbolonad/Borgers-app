const { getAccessToken, sendFCM, getServiceAccount } = require("./fcm");

const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY;

module.exports = async function handler(req, res) {
  if (req.query.secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const sa = getServiceAccount();
    const accessToken = await getAccessToken(sa);

    const r = await fetch(`${SUPA_URL}/rest/v1/push_tokens?select=*`, {
      headers: { "apikey": SUPA_KEY, "Authorization": `Bearer ${SUPA_KEY}` }
    });
    const tokens = await r.json();

    if (!Array.isArray(tokens) || !tokens.length) {
      return res.json({ error: "No tokens found", raw: tokens });
    }

    const results = [];
    for (const { token, user_id } of tokens) {
      const result = await sendFCM(accessToken, sa.project_id, token,
        "🔔 Prueba Borgers",
        `Notificación de prueba — usuario ${user_id}`
      );
      results.push({ user_id, result });
    }

    return res.json({ sent: results.length, results });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
