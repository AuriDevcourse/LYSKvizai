"use client";

/**
 * Client half of the editor gate (server half: `src/lib/auth.ts`).
 *
 * The editor password is held in sessionStorage — it lives for the tab, not
 * forever — and attached to every editor write as a bearer token.
 */

const KEY = "quizmo-editor-secret";

export function getEditorSecret(): string {
  if (typeof window === "undefined") return "";
  try {
    return sessionStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

export function setEditorSecret(secret: string): void {
  try {
    sessionStorage.setItem(KEY, secret);
  } catch {
    /* private mode — the user will just be asked again */
  }
}

export function clearEditorSecret(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* no-op */
  }
}

/** Headers for an editor write. Spread into a fetch init. */
export function editorHeaders(extra?: Record<string, string>): Record<string, string> {
  const secret = getEditorSecret();
  return {
    ...(extra ?? {}),
    ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
  };
}

/**
 * fetch() for editor writes. Throws a typed error on 401/403 so callers can
 * prompt for the password instead of showing a generic failure.
 */
export class EditorAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EditorAuthError";
  }
}

export async function editorFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(input, {
    ...init,
    headers: editorHeaders(init.headers as Record<string, string> | undefined),
  });
  if (res.status === 401 || res.status === 403) {
    clearEditorSecret();
    let msg = "Editor password required";
    try {
      msg = (await res.clone().json()).error ?? msg;
    } catch {
      /* keep default */
    }
    throw new EditorAuthError(msg);
  }
  return res;
}
