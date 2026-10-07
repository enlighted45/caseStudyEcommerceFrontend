// Shared HTTP helper: JSON bodies, bearer authentication, and safe 204 handling.
export async function requestApi(
  config,
  getToken,
  path,
  { method = "GET", body, publicRequest = false, signal } = {},
) {
  if (!config.apiBaseUrl)
    throw new Error("Set VITE_API_BASE_URL in your .env file.");
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (!publicRequest) {
    const token = await getToken();
    if (!token) throw new Error("Please log in first.");
    headers.Authorization = `Bearer ${token}`;
  }
  let response;
  try {
    response = await fetch(`${config.apiBaseUrl.replace(/\/$/, "")}${path}`, {
      method,
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      signal,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error(
      "Cannot reach the backend. Check its URL, whether it is running, and its CORS configuration.",
    );
  }
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  // HTTP status is authoritative: this backend sometimes puts a different code in JSON.
  if (!response.ok) {
    const fallback =
      response.status === 401
        ? "Login expired or the token is invalid."
        : response.status === 403
          ? "Your account does not have permission for this operation."
          : response.statusText || "Request failed.";
    const error = new Error(
      typeof data?.message === "string" ? data.message : fallback,
    );
    error.status = response.status;
    error.fieldErrors = data?.fieldError || {};
    error.response = data;
    throw error;
  }
  return data;
}
