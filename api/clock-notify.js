const { getAccessToken, sendFCM, getServiceAccount } = require("./fcm");

const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY;

async function supaGet(table, query) {
  const r = await fetch(`${SUPA_URL}/rest/v1/${table}${query}`, {
    headers: { "apikey": SUPA_KEY, "Authorization": `Bearer ${SUPA_KEY}` }
  });
  return r.json();
}

module.exports = async function handler(req, res) {
  if (req.headers["x-cron-secret"] !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Hora actual Ecuador (UTC-5)
    const now = new Date(Date.now() - 5 * 60 * 60 * 1000);
    const ahoraMins = now.getUTCHours() * 60 + now.getUTCMinutes();
    const hoyNum = now.getUTCDay() === 0 ? 7 : now.getUTCDay(); // 1=Lunes..7=Domingo
    const hoyFecha = now.toISOString().slice(0, 10);

    // Cargar horarios activos para hoy
    const horarios = await supaGet("horarios_sucursal", `?dia_semana=eq.${hoyNum}&activo=eq.true`);
    if (!Array.isArray(horarios) || !horarios.length) return res.json({ sent: 0, reason: "no horarios" });

    // Cargar usuarios y tokens
    const [usuarios, tokens] = await Promise.all([
      supaGet("users", "?activo=eq.true&select=id,nombre,sucursal"),
      supaGet("push_tokens", "?select=*"),
    ]);

    const sa = getServiceAccount();
    const accessToken = await getAccessToken(sa);

    let sent = 0;
    const notificados = new Set();

    for (const h of horarios) {
      const [heH, heM] = h.hora_entrada.slice(0, 5).split(":").map(Number);
      const [hsH, hsM] = h.hora_salida.slice(0, 5).split(":").map(Number);
      const entradaMins = heH * 60 + heM;
      const salidaMins = hsH * 60 + hsM;

      // Empleados de esta sucursal
      const empsSuc = usuarios.filter(u => u.sucursal === h.sucursal);
      if (!empsSuc.length) continue;

      // Registros de asistencia de hoy para esta sucursal
      const userIds = empsSuc.map(u => u.id).join(",");
      const registros = await supaGet("clock_registros",
        `?user_id=in.(${userIds})&fecha=eq.${hoyFecha}&select=user_id,tipo`
      );

      for (const emp of empsSuc) {
        const key = `${emp.id}`;
        if (notificados.has(key + "_entrada") && notificados.has(key + "_salida")) continue;

        const empRecs = registros.filter(r => r.user_id === emp.id);
        const tieneEntrada = empRecs.some(r => r.tipo === "entrada");
        const tieneSalida = empRecs.some(r => r.tipo === "salida");

        const empTokens = tokens.filter(t => String(t.user_id) === String(emp.id));
        if (!empTokens.length) continue;

        // Notificación entrada: 15 min después si no marcó
        if (!tieneEntrada && ahoraMins >= entradaMins + 15 && ahoraMins <= entradaMins + 20) {
          for (const { token } of empTokens) {
            await sendFCM(accessToken, sa.project_id, token,
              "⚠️ No registraste tu entrada",
              `Debías ingresar a las ${h.hora_entrada.slice(0,5)}. El no registro puede generar multas o sanciones.`
            ).catch(() => {});
          }
          notificados.add(key + "_entrada");
          sent++;
        }

        // Recordatorio salida: 15 min antes de la hora de salida
        if (!tieneSalida && ahoraMins >= salidaMins - 15 && ahoraMins <= salidaMins - 10) {
          for (const { token } of empTokens) {
            await sendFCM(accessToken, sa.project_id, token,
              "🔔 Recuerda marcar tu salida",
              `Tu hora de salida es a las ${h.hora_salida.slice(0,5)}. Recuerda registrarla en el app.`
            ).catch(() => {});
          }
          notificados.add(key + "_salida");
          sent++;
        }
      }
    }

    return res.json({ sent, hora_ec: `${now.getUTCHours()}:${String(now.getUTCMinutes()).padStart(2,"0")}` });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
