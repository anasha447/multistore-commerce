# ADR-0010: Storefronts run on the VPS, not Vercel

Status: accepted, 24 November 2026

## Context

Vercel was considered. Its free plan is for personal or non-commercial use, it advises against Cloudflare's proxy in front (which Access needs), request bodies are limited to 4.5 MB by default, and the API would have to be public.

## Decision

Storefront images run next to the apps. The API is never published.

## Consequences

About 250 MB per storefront. Pages come from one location; Cloudflare caches static files.
