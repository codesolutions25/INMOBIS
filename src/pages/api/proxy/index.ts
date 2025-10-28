import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Recargamos .env en cada request (runtime)
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const parsed = dotenv.parse(fs.readFileSync(envPath));
    Object.assign(process.env, parsed);
  }
}

// Lista de servicios que requieren manejo especial
const SPECIAL_SERVICES = [
  'estado_plan_pago_pendiente',
  'estado_plan_pago_cancelado',
  'estado_caja_abierta',
  'estado_caja_cerrada',
  'estado_cotizacion_cancelada_url',
  'estado_atencion_cancelada_url',
  'estado_cotizacion_aprobada_url',
  'canales_comunicacion_presencial_url',
  'estado_cotizacion_pendiente_url'
];

// Disable body parsing for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to read the raw body as a buffer
function streamToBuffer(readable: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readable.on("data", (chunk: any) => chunks.push(Buffer.from(chunk)));
    readable.on("error", reject);
    readable.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Recargar env variables dinámicamente
    loadEnv();

    const SERVICE_MAP: Record<string, string | undefined> = {
      auth: process.env.AUTH_SERVICE_URL,
      caja: process.env.CAJA_SERVICE_URL,
      inmobiliaria: process.env.INMOBILIARIA_SERVICE_URL,
      archivos: process.env.ARCHIVOS_SERVICE_URL,
      atencion: process.env.ATENCION_SERVICE_URL,
      planes: process.env.PLAN_PAGOS_SERVICE_URL,
      ventas: process.env.VENTA_SERVICE_URL,
      config: process.env.CONFIG_SERVICE_URL,
      files: process.env.ARCHIVOS_SERVICE_URL,
      estado_plan_pago_pendiente: process.env.ESTADO_PLAN_PAGO_PENDIENTE,
      estado_plan_pago_cancelado: process.env.ESTADO_PLAN_PAGO_CANCELADO,
      estado_caja_abierta: process.env.ESTADO_CAJA_ABIERTA_URL,
      estado_caja_cerrada: process.env.ESTADO_CAJA_CERRADA_URL,
      plan_pago_al_contado_url: process.env.PLAN_PAGO_AL_CONTADO_URL,
      plan_pago_por_partes_url: process.env.PLAN_PAGO_POR_PARTES_URL,
      estado_atencion_finalizada_url: process.env.ESTADO_ATENCION_FINALIZADA_URL,
      estado_atencion_en_curso_url: process.env.ESTADO_ATENCION_EN_CURSO_URL,
      estado_atencion_consulta_url: process.env.ESTADO_ATENCION_CONSULTA_URL,
      estado_atencion_reclamo_url: process.env.ESTADO_ATENCION_RECLAMO_URL,
      tipo_atencion_cotizacion_url: process.env.TIPO_ATENCION_COTIZACION_URL,
      tipo_atencion_consulta_url: process.env.TIPO_ATENCION_CONSULTA_URL,
      tipo_atencion_reclamo_url: process.env.TIPO_ATENCION_RECLAMO_URL,
      estado_cotizacion_cancelada_url: process.env.ESTADO_COTIZACION_CANCELADA_URL,
      estado_atencion_cancelada_url: process.env.ESTADO_ATENCION_CANCELADA_URL,
      estado_cotizacion_aprobada_url: process.env.ESTADO_COTIZACION_APROBADA_URL,
      canales_comunicacion_presencial_url: process.env.CANALES_COMUNICACION_PRESENCIAL_URL,
      estado_cotizacion_pendiente_url: process.env.ESTADO_COTIZACION_PENDIENTE_URL,
    };

    const { service, ...restParams } = req.query;

    let pathSegments: string[] = [];
    const queryParams = new URLSearchParams();

    if (typeof service !== "string") {
      return res.status(400).json({ error: "Servicio inválido" });
    }

    // Verificar si es un servicio especial
    if (SPECIAL_SERVICES.includes(service)) {
      const targetUrl = SERVICE_MAP[service];
      
      if (!targetUrl) {
        return res.status(400).json({ 
          error: `URL no configurada para ${service}` 
        });
      }

      try {
        const response = await fetch(targetUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Error en la respuesta: ${response.status} ${response.statusText}`);
        }

        try {
          const data = await response.json();
          return res.status(200).json(data);
        } catch (jsonError) {
          const text = await response.text();
          return res.status(200).send(text);
        }
      } catch (error) {
        console.error(`Error al llamar a ${service}:`, error);
        return res.status(500).json({ 
          error: `Error al llamar al servicio ${service}`,
          details: error instanceof Error ? error.message : String(error) 
        });
      }
    }

    // Continuar con el flujo normal para servicios no especiales
    const baseUrl = SERVICE_MAP[service];
    if (!baseUrl) {
      return res.status(400).json({ error: `Servicio ${service} no configurado` });
    }

    // Separate path segments from query parameters
    Object.entries(restParams).forEach(([key, value]) => {
      if (key === "path") {
        pathSegments = Array.isArray(value) ? value : [value];
      } else if (key.startsWith("path")) {
        pathSegments.push(value?.toString() || "");
      } else if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach((v) => v && queryParams.append(key, v));
        } else {
          queryParams.append(key, value as string);
        }
      }
    });

    const cleanBaseUrl = baseUrl.replace(/\/+$/, "");
    const cleanPath = pathSegments.filter(Boolean).join("/");
    const queryString = queryParams.toString();
    const targetUrl = queryString
      ? `${cleanBaseUrl}/${cleanPath}?${queryString}`
      : `${cleanBaseUrl}/${cleanPath}`;

    console.log("🔗 Proxying to:", targetUrl);

    // CORS headers
    const origin = req.headers.origin || "*";
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    // Handle body
    let requestBody: any = undefined;
    if (req.method !== "GET" && req.method !== "HEAD") {
      if (req.body) {
        requestBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
      } else {
        try {
          const rawBody = await streamToBuffer(req);
          if (rawBody.length > 0) {
            requestBody = rawBody;
          }
        } catch (error) {
          console.error("Error reading request body:", error);
        }
      }
    }

    // Forward request
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'content-type': 'application/json',
        'accept': 'application/json',
        'authorization': req.headers.authorization,
        host: new URL(targetUrl).host,
      } as any,
      body: requestBody,
    });

    const text = await response.text();

    try {
      const json = JSON.parse(text);
      return res.status(response.status).json(json);
    } catch {
      return res.status(response.status).send(text);
    }
  } catch (err) {
    console.error("❌ Error en proxy:", err);
    return res.status(500).json({
      error: "Error en el proxy",
      details: err instanceof Error ? err.message : String(err),
    });
  }
}
