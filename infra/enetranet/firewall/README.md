# Firewall baseline

Apply this policy on the gateway/firewall protecting the Entranet segment.

- Default policy: DROP inbound/forward traffic.
- Permit only established/related traffic.
- Permit explicitly declared Z1 internal subnets.
- Permit WireGuard UDP/51820 only where the deployment requires it.
- Do not add an Internet default route to isolated nodes.
- Block forwarding from the Entranet to public interfaces unless a separately approved egress gateway is intentionally deployed.
- Log denied traffic without logging secrets or packet payloads.

This file is a baseline specification, not a claim that the repository can configure the user's physical firewall remotely.
