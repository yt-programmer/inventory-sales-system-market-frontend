const BASE = "/api";

// Unified server error: message + status + code + errors (field errors use the same names as the form fields)
export class ApiError extends Error {
  constructor(message, { status = 0, code = "NETWORK_ERROR", errors = {} } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

// The session is in an httpOnly cookie, so every request uses credentials: "include"
export async function api(path, { method = "GET", body } = {}) {
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      credentials: "include",
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Can't reach the server, check your internet and try again");
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    // Session expired (other than login itself): tell the app to go back to the login page
    if (res.status === 401 && path !== "/auth/login") window.dispatchEvent(new Event("mm:unauthorized"));
    throw new ApiError(data?.error || "Something went wrong, please try again", {
      status: res.status,
      code: data?.code,
      errors: data?.errors || {},
    });
  }
  return data;
}

// Converts any error to { fields, message }: field errors show under each field, the rest is a general message
export function splitError(e) {
  const fields = e?.errors || {};
  return {
    fields,
    message: Object.keys(fields).length ? "" : e?.message || "Something went wrong, please try again",
  };
}
