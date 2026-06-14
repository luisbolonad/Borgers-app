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
    console.error("[test-notify] Firebase init error:", e.message);
  }
}

module.exports = async function handler(req, res) {
  if (req.query.secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const r = await fetch(`${SUPA_URL}/rest/v1/push_tokens?select=*`, {
    headers: { "apikey": SUPA_KEY, "Authorization": `Bearer ${SUPA_KEY}` }
  });
  const tokens = await r.json();

  if (!Array.isArray(tokens) || !tokens.length) {
    return res.json({ error: "No tokens found", tokens });
  }

  const results = [];
  for (const { token, user_id } of tokens) {
    try {
      const msgId = await admin.messaging().send({
        token,
        notification: {
          title: "🔔 Prueba de notificación",
          body: `Notificación de prueba para user_id: ${user_id}`
        },
        android: { priority: "high" },
        apns: { payload: { aps: { sound: "default" } } }
      });
      results.push({ user_id, status: "sent", msgId });
    } catch (e) {
      results.push({ user_id, status: "error", code: e.code, msg: e.message });
    }
  }

  return res.json({ results });
};
