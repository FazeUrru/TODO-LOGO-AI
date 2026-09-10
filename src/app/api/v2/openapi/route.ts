/**
 * GET /api/v2/openapi — contrato OpenAPI 3.1 de la API pública v2.
 * Máquina-legible: importa el JSON en Postman, Insomnia o Swagger UI.
 */

import { jsonCors, preflightCors } from "@/lib/v2-cors";
import { PRODUCCION_URL as APP_URL } from "@/lib/static-mode";

export function OPTIONS() {
  return preflightCors();
}

export async function GET() {
  const base = APP_URL.replace(/\/$/, "");
  const doc = {
    openapi: "3.1.0",
    info: {
      title: "todólogo.ai — API pública v2",
      version: "1.20.0",
      description:
        "La API del arena de IA en español. Lectura abierta (ranking, catálogo, campeones, jurados) y generación por clave personal (duelos anónimos + votos). Las claves se crean en /api-publica con una cuenta de todólogo.ai.",
      contact: { name: "todólogo.ai", url: base },
    },
    servers: [{ url: base }],
    components: {
      securitySchemes: {
        ApiKey: { type: "apiKey", in: "header", name: "X-Api-Key" },
      },
      schemas: {
        FilaLeaderboard: {
          type: "object",
          properties: {
            rank: { type: "integer" },
            id: { type: "string" },
            name: { type: "string" },
            provider: { type: "string" },
            elo: { type: "integer" },
            wins: { type: "integer" },
            losses: { type: "integer" },
            ties: { type: "integer" },
            battles: { type: "integer" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
    paths: {
      "/api/v2/leaderboard": {
        get: {
          summary: "Ranking ELO público del arena",
          description:
            "Idéntico al Leaderboard de la web. `category` acepta las arenas de texto (global, codigo, razonamiento, escritura, agente, matematicas, datos, traduccion, educacion, negocios) y las generativas (imagen, video, audio).",
          parameters: [
            { name: "category", in: "query", schema: { type: "string", default: "global" } },
            { name: "limit", in: "query", schema: { type: "integer", default: 10, maximum: 100 } },
          ],
          responses: {
            "200": {
              description: "Ranking",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      ok: { type: "boolean" },
                      category: { type: "string" },
                      rows: { type: "array", items: { $ref: "#/components/schemas/FilaLeaderboard" } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/v2/models": {
        get: {
          summary: "Catálogo de modelos del arena",
          parameters: [
            { name: "category", in: "query", schema: { type: "string" } },
            { name: "limit", in: "query", schema: { type: "integer", default: 100 } },
          ],
          responses: { "200": { description: "Catálogo (JSON)" } },
        },
      },
      "/api/v2/campeones": {
        get: {
          summary: "Últimos campeones de la Copa Todólogo",
          responses: { "200": { description: "Lista de campeones (Salón de la Fama)" } },
        },
      },
      "/api/v2/jurados": {
        get: {
          summary: "Ranking público de jurados (ELO de jurado)",
          responses: { "200": { description: "Top de personas que votan" } },
        },
      },
      "/api/v2/battle": {
        post: {
          summary: "Crea un duelo anónimo (requiere clave)",
          security: [{ ApiKey: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["prompt"],
                  properties: {
                    prompt: { type: "string", maxLength: 4000 },
                    category: {
                      type: "string",
                      description: "Arena de texto (las generativas no se sirven por API v1)",
                      default: "global",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Duelo creado: ambas respuestas anónimas" },
            "401": { description: "Falta la clave" },
            "403": { description: "Clave inválida o revocada" },
            "429": { description: "Rate-limit de clave (20/min) o de IP" },
          },
        },
      },
      "/api/v2/vote": {
        post: {
          summary: "Vota un duelo y revela los modelos (requiere clave)",
          security: [{ ApiKey: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["battleId", "winner"],
                  properties: {
                    battleId: { type: "string" },
                    winner: { type: "string", enum: ["A", "B", "tie", "bad"] },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Voto registrado + identidades reveladas" },
            "410": { description: "La batalla expiró de la memoria del servidor" },
          },
        },
      },
      "/api/v2/keys": {
        get: {
          summary: "Lista tus claves (sesión web, no X-Api-Key)",
          responses: { "200": { description: "Claves enmascaradas" }, "401": { description: "Sin sesión" } },
        },
        post: {
          summary: "Crea una clave (sesión web)",
          responses: { "200": { description: "Secreto generado (solo se muestra una vez)" } },
        },
        delete: {
          summary: "Revoca una clave (sesión web)",
          responses: { "200": { description: "Revocada" } },
        },
      },
    },
  };
  return jsonCors(doc);
}
