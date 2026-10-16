# Z1 Android

Android client for the Z1 platform.

Architecture: Z1 Control Plane → Zoë Core → Council of 33 → MCP → Model Runtime.

The Android client never stores production API keys or signing secrets.

## Internal communication prototype

The mobile client includes an in-app communication view for Z1 Core, Zoë Core,
the specialist modules, and the Council of 33. The first implementation uses a
bounded in-memory message bus on the device. Messages are not persisted and are
not yet delivered to the server or to remote agents. The screen labels this
limitation directly.

A server connection must be added through an authenticated Z1 API endpoint
before messages can be exchanged across devices or services. Do not place
provider keys or long-lived production tokens in the Android source.
