# Implementation Plan: Invoice Drafts

## Technical Context

- TypeScript service layer with controller endpoints.
- Tests live under `tests/invoice/`.
- API code lives under `src/invoice/`.

## Architecture

Add validation in the invoice service and expose a controller endpoint that keeps the existing response envelope.
