import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { AwsClient } from "https://esm.sh/aws4fetch@1.0.17";

const REGION = Deno.env.get("AWS_REGION") || "us-east-1";
const aws = new AwsClient({
  accessKeyId: Deno.env.get("AWS_ACCESS_KEY_ID")!,
  secretAccessKey: Deno.env.get("AWS_SECRET_ACCESS_KEY")!,
  region: REGION,
  service: "rekognition",
});

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function rek(target: string, body: object) {
  const res = await aws.fetch(`https://rekognition.${REGION}.amazonaws.com/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": `RekognitionService.${target}`,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text);
  return JSON.parse(text);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { action, ...p } = await req.json();
    let result;

    switch (action) {

      // Crear colección por sucursal (llamar una sola vez al configurar)
      case "createCollection":
        result = await rek("CreateCollection", { CollectionId: p.collectionId });
        break;

      // Registrar rostro de un empleado (onboarding — 3 veces, una por foto)
      case "indexFace":
        result = await rek("IndexFaces", {
          CollectionId: p.collectionId,
          Image: { Bytes: p.imageBase64 },
          ExternalImageId: String(p.userId),
          MaxFaces: 1,
          DetectionAttributes: [],
          QualityFilter: "AUTO",
        });
        break;

      // Identificar quién es la persona en la foto (clock-in/out y kiosko)
      case "searchFace":
        result = await rek("SearchFacesByImage", {
          CollectionId: p.collectionId,
          Image: { Bytes: p.imageBase64 },
          MaxFaces: 1,
          FaceMatchThreshold: 90,
        });
        break;

      // Eliminar rostros de un empleado (si se re-registra o se elimina)
      case "deleteFaces":
        result = await rek("DeleteFaces", {
          CollectionId: p.collectionId,
          FaceIds: p.faceIds,
        });
        break;

      // Listar colecciones existentes
      case "listCollections":
        result = await rek("ListCollections", {});
        break;

      default:
        throw new Error(`Acción desconocida: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
