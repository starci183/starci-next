/** Liveness probe: `{ status, info, error, details }` from process-local state; it never touches a dependency. A GET handler is answered per request, never prerendered at build time. */
export const GET = (): Response => Response.json({ status: "ok", info: {}, error: {}, details: {} })
