# ADR-0009: No open web ports: Cloudflare Tunnel, Access on /admin

Status: accepted, 24 November 2026

## Context

The VPS had ports 80 and 443 open, and the admin login was on the internet.

## Decision

cloudflared connects outward; the firewall allows no inbound web traffic. Access asks staff to prove identity before `/admin`.

## Consequences

Cloudflare is required for the site to be reachable. Staff sign in twice. Access does not cover staff writes on shared paths; roles do.
