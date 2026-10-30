# Z1 Android

Android client for the Z1 platform.

Architecture: Z1 Control Plane → Zoë Core → Council of 33 → MCP → Model Runtime.

The Android client never stores production API keys or signing secrets.

## Windpark dashboard (development)

The dashboard reads the selected month from `GET /api/z1/windparks?month=YYYY-MM`.
Enter the Z1 API base URL and bearer token in the app. The token is kept in memory
for the current app session and is not written to preferences or logs.

For an Android Emulator running on the same computer as the API, use:

```text
http://10.0.2.2:3001
```

Start the API on the computer with Node.js 22 or newer, configure
`Z1_WINDPARK_API_TOKEN` in the API process environment, and run
`npm run z1:api`. The app adds the `/api/z1/windparks` path itself.

Cleartext HTTP is enabled only for the Android debug build and the client only
permits it for localhost, 127.0.0.1 or the emulator host bridge 10.0.2.2.
Release builds require HTTPS.

The existing server token currently authorizes both reads and writes. Do not
put it into a release build or distribute it in the app. Use this screen only
with a trusted development server until the backend provides per-user or
read-only client credentials. The dashboard itself sends GET requests only.
