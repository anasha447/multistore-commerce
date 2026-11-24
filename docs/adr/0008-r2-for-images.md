# ADR-0008: Product images in Cloudflare R2

Status: accepted, 24 November 2026

## Context

MinIO on the VPS uses memory and is lost with the server.

## Decision

R2 through the S3 client, one bucket and token per store. `/media/<store>/<id>.webp` keeps its shape and is served by the app with immutable caching.

## Consequences

Needs a Cloudflare account with billing enabled. Local folder adapter for development.
