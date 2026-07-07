# Poultry Implementation Strategy

Date: 2026-03-20

## Status

Accepted

## Context

Due to time constraints, we need to rapidly develop the poultry scheme whilst avoiding any regressions to the existing livestock scheme.

## Decision

- Poultry will reuse the existing data models used for livestock.
- Reuse the existing endpoints for poultry agreements and claims.

## Consequences

- No regressions are introduced into the existing livestock journey
- Duplication of code in the poultry and livestock journeys
- The concept of a "site" in the domain model is mapped to a `herd` in the data model and the reporting events, which could cause some confusion
- Contact information is stored against the application, so a business applying for both livestock and poultry will have its contact information duplicated across two applications.
