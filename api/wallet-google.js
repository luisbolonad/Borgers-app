const crypto = require("crypto");

const ISSUER_ID = process.env.GOOGLE_WALLET_ISSUER_ID;
const APP_URL = "https://borgers-app.vercel.app";

// Lee el service account completo del JSON (evita problemas de encoding con la private key)
const SA = JSON.parse(process.env.GOOGLE_WALLET_SERVICE_ACCOUNT || "{}");
const SA_EMAIL = SA.client_email || "";
const SA_KEY = SA.private_key || "";

function signRS256(payload, privateKey) {
  const hdr = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const bod = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(`${hdr}.${bod}`);
  return `${hdr}.${bod}.${sign.sign(privateKey, "base64url")}`;
}

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const signed = signRS256({
    iss: SA_EMAIL,
    scope: "https://www.googleapis.com/auth/wallet_object.issuer",
    aud: "https://oauth2.googleapis.com/token",
    iat: now, exp: now + 3600
  }, SA_KEY);
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${signed}`
  });
  const d = await r.json();
  if (!d.access_token) throw new Error("Token error: " + JSON.stringify(d));
  return d.access_token;
}

async function ensureClass(tok, program) {
  const classId = `${ISSUER_ID}.borgers_prog_${program.id}`;
  const base = "https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass";
  const chk = await fetch(`${base}/${encodeURIComponent(classId)}`, {
    headers: { Authorization: `Bearer ${tok}` }
  });
  if (chk.ok) return classId;
  await fetch(base, {
    method: "POST",
    headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      id: classId,
      issuerName: "BORGERS",
      programName: program.nombre,
      programLogo: {
        sourceUri: { uri: `${APP_URL}/logo192.png` },
        contentDescription: { defaultValue: { language: "es-EC", value: "BORGERS" } }
      },
      reviewStatus: "UNDER_REVIEW",
      loyaltyPoints: { label: program.tipo === "puntos" ? "Puntos" : "Sellos", balance: { int: 0 } },
      hexBackgroundColor: program.config?.color_card || "#1E1A0E"
    })
  });
  return classId;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (!ISSUER_ID || !SA_KEY || !SA_EMAIL) {
    return res.status(503).json({ error: "Google Wallet no configurado aún" });
  }

  const { action, card, customer, program, cardId, balance, label } = req.body || {};

  try {
    // Genera link "Agregar a Google Wallet"
    if (action === "save-link") {
      const objectId = `${ISSUER_ID}.borgers_card_${card.id}`;
      const classId = `${ISSUER_ID}.borgers_prog_${program.id}`;
      const pts = program.tipo === "puntos" ? Math.floor(card.puntos || 0) : (card.sellos || 0);

      const loyaltyObject = {
        id: objectId, classId, state: "ACTIVE",
        loyaltyPoints: { label: program.tipo === "puntos" ? "Puntos" : "Sellos", balance: { int: pts } },
        textModulesData: [
          { header: "Cliente", body: customer.nombre || "Cliente BORGERS", id: "nombre" },
          { header: "Programa", body: program.nombre, id: "programa" }
        ],
        barcode: { type: "QR_CODE", value: `${APP_URL}/c/${customer.token}`, alternateText: customer.token },
        hexBackgroundColor: program.config?.color_card || "#1E1A0E"
      };

      const jwt = signRS256({
        iss: SA_EMAIL, aud: "google", typ: "savetowallet",
        iat: Math.floor(Date.now() / 1000),
        payload: { loyaltyObjects: [loyaltyObject] }
      }, SA_KEY);

      return res.json({ url: `https://pay.google.com/gp/v/save/${jwt}` });
    }

    // Actualiza pase existente (fire-and-forget desde el frontend)
    if (action === "update-pass") {
      const objectId = `${ISSUER_ID}.borgers_card_${cardId}`;
      const tok = await getAccessToken();
      const r = await fetch(
        `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject/${encodeURIComponent(objectId)}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
          body: JSON.stringify({ loyaltyPoints: { label: label || "Sellos", balance: { int: Math.floor(balance || 0) } } })
        }
      );
      if (!r.ok && r.status !== 404) throw new Error("Patch error: " + await r.text());
      return res.json({ ok: true });
    }

    return res.status(400).json({ error: "Acción desconocida" });
  } catch (e) {
    console.error("[wallet-google]", e.message);
    return res.status(500).json({ error: e.message });
  }
};
