/** Engine.IO / Socket.IO server may respond with JSON `{ code: 1, message: "Session ID unknown" }`. */
export function isEngineIoSessionUnknownError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  if (/session id unknown/i.test(msg)) return true;
  if (/\"code\"\s*:\s*1/.test(msg)) return true;

  if (typeof err === "object" && err !== null && "data" in err) {
    const data = (err as { data: unknown }).data;
    if (typeof data === "object" && data !== null) {
      const m = (data as { message?: unknown }).message;
      if (typeof m === "string" && /session id unknown/i.test(m)) return true;
      const c = (data as { code?: unknown }).code;
      if (c === 1) return true;
    }
  }
  return false;
}
