const GRAPH_ROOT = "https://graph.microsoft.com/v1.0";
const GRAPH_ROOT_URL = new URL(GRAPH_ROOT);

function normalizeRelativePath(value) {
  if (typeof value !== "string" || !value.trim()) {
    throw new TypeError("A non-empty OneDrive app-folder path is required");
  }
  const parts = value.replace(/^\/+|\/+$/g, "").split("/");
  if (parts.some((part) => !part || part === "." || part === ".." || part.includes(String.fromCharCode(92)) || part.includes(String.fromCharCode(0)))) {
    throw new TypeError("Invalid OneDrive app-folder path");
  }
  return parts.map(encodeURIComponent).join("/");
}

function graphError(status, payload) {
  const code = typeof payload?.error?.code === "string" ? payload.error.code : "graph_error";
  const error = new Error(`Microsoft Graph request failed (${status}: ${code})`);
  error.status = status;
  error.code = code;
  return error;
}

/**
 * OneDrive storage restricted to the Z1 app's special app folder.
 * The caller supplies a delegated access token on demand. This module does
 * not store tokens or accept arbitrary Graph URLs.
 */
export function createOneDriveAppFolderStore({ getAccessToken, fetchImpl = fetch } = {}) {
  if (typeof getAccessToken !== "function") {
    throw new TypeError("getAccessToken must be a function");
  }
  if (typeof fetchImpl !== "function") {
    throw new TypeError("fetchImpl must be a function");
  }

  async function request(path, options = {}) {
    const url = new URL(String(path).replace(/^\/+/, ""), `${GRAPH_ROOT}/`);
    if (url.origin !== GRAPH_ROOT_URL.origin || !url.pathname.startsWith(`${GRAPH_ROOT_URL.pathname}/`)) {
      throw new TypeError("Only Microsoft Graph v1.0 is allowed");
    }
    const token = await getAccessToken();
    if (typeof token !== "string" || !token.trim()) throw new Error("OneDrive is not connected");
    const response = await fetchImpl(url, {
      ...options,
      headers: {
        authorization: `Bearer ${token}`,
        accept: "application/json",
        ...options.headers,
      },
    });
    if (!response.ok) {
      let payload;
      try { payload = await response.json(); } catch { payload = undefined; }
      throw graphError(response.status, payload);
    }
    return response;
  }

  return Object.freeze({
    async getRoot() {
      const response = await request("/me/drive/special/approot");
      return response.json();
    },

    async listChildren() {
      const response = await request("/me/drive/special/approot/children");
      return response.json();
    },

    async writeText(path, content, { contentType = "text/plain; charset=utf-8" } = {}) {
      if (typeof content !== "string") throw new TypeError("OneDrive content must be text");
      const relativePath = normalizeRelativePath(path);
      const response = await request(`/me/drive/special/approot:/${relativePath}:/content`, {
        method: "PUT",
        headers: { "content-type": contentType },
        body: content,
      });
      return response.json();
    },

    async readText(path) {
      const relativePath = normalizeRelativePath(path);
      const response = await request(`/me/drive/special/approot:/${relativePath}:/content`, {
        headers: { accept: "text/plain, application/octet-stream" },
      });
      return response.text();
    },
  });
}
