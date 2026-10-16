# Z1 OneDrive app-folder adapter

This adapter provides text-file reads and writes inside the Z1 application's
own OneDrive folder. It does not read the user's whole drive, perform OAuth,
store access tokens, or synchronize Z1 databases automatically.

## Microsoft setup required

1. Register Z1 as an application in Microsoft Entra ID.
2. Configure the delegated Microsoft Graph permission
   `Files.ReadWrite.AppFolder` and obtain user consent through Microsoft's
   sign-in flow.
3. Add the application's OAuth callback and secure token-refresh handling to
   the Z1 server. Keep tokens out of source control and logs.
4. Supply a `getAccessToken()` callback from that server-side authentication
   layer to `createOneDriveAppFolderStore()`.
5. Add explicit Z1 API routes and audit events before exposing storage actions
   to the web or Android clients.

The adapter deliberately uses only the OneDrive special app folder and never
accepts arbitrary Graph URLs or stores the delegated token. The app-folder
scope limits the application's file access to its own OneDrive folder.

## Example

```js
import { createOneDriveAppFolderStore } from "./onedrive-app-folder.mjs";

const store = createOneDriveAppFolderStore({
  getAccessToken: () => tokenVault.getDelegatedAccessToken(userId),
});

await store.writeText("exports/status.json", JSON.stringify(report), {
  contentType: "application/json; charset=utf-8",
});
```

Run the isolated unit tests with:

```sh
node --test tests/onedrive-app-folder.test.mjs
```

No live OneDrive connection is claimed until the app registration, OAuth flow,
API routes, audit events, and authenticated end-to-end test are completed.
