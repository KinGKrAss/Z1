import test from "node:test";
import assert from "node:assert/strict";
import { createOneDriveAppFolderStore } from "../runtime/onedrive-app-folder.mjs";

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() { return body; },
    async text() { return JSON.stringify(body); },
  };
}

test("reads the Microsoft Graph app root using the delegated token", async () => {
  let requested;
  const store = createOneDriveAppFolderStore({
    getAccessToken: async () => "test-token",
    fetchImpl: async (url, options) => {
      requested = { url: String(url), options };
      return jsonResponse({ id: "app-root", name: "approot" });
    },
  });

  assert.deepEqual(await store.getRoot(), { id: "app-root", name: "approot" });
  assert.equal(requested.url, "https://graph.microsoft.com/v1.0/me/drive/special/approot");
  assert.equal(requested.options.headers.authorization, "Bearer test-token");
});

test("writes text inside the app folder and encodes path segments", async () => {
  let requested;
  const store = createOneDriveAppFolderStore({
    getAccessToken: async () => "test-token",
    fetchImpl: async (url, options) => {
      requested = { url: String(url), options };
      return jsonResponse({ id: "file-1", name: "Status report.json" });
    },
  });

  await store.writeText("reports/Status report.json", "{}", { contentType: "application/json" });
  assert.equal(requested.url, "https://graph.microsoft.com/v1.0/me/drive/special/approot:/reports/Status%20report.json:/content");
  assert.equal(requested.options.method, "PUT");
  assert.equal(requested.options.body, "{}");
  assert.equal(requested.options.headers["content-type"], "application/json");
});

test("rejects path traversal before making a Graph request", async () => {
  let calls = 0;
  const store = createOneDriveAppFolderStore({
    getAccessToken: async () => "test-token",
    fetchImpl: async () => { calls += 1; return jsonResponse({}); },
  });

  await assert.rejects(store.readText("../outside.json"), /Invalid OneDrive app-folder path/);
  assert.equal(calls, 0);
});

test("does not expose provider error response bodies or credentials", async () => {
  const store = createOneDriveAppFolderStore({
    getAccessToken: async () => "secret-token",
    fetchImpl: async () => jsonResponse({ error: { code: "accessDenied", message: "private detail" } }, 403),
  });

  await assert.rejects(store.getRoot(), (error) => {
    assert.equal(error.status, 403);
    assert.equal(error.code, "accessDenied");
    assert.doesNotMatch(error.message, /secret-token|private detail/);
    return true;
  });
});
