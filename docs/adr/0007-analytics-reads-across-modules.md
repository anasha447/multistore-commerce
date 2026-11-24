# ADR-0007: Analytics may read other modules' tables

Status: accepted, 24 November 2026

## Context

Dashboards join orders, items, reviews and stock. Going through interfaces would load everything in memory.

## Decision

`analytics` owns materialized views built on other tables, read-only, refreshed every 2 minutes under ShedLock.

## Consequences

A migration that changes those tables must update the views. Tests cover each view.
