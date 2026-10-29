# Execution report — 30 October 2026

This report distinguishes implementation from execution evidence. It is not a claim of public-production certification.

## Environment

Windows / PowerShell; Node.js 24.18.0; npm 11.16.0; isolated real PostgreSQL 17.6 binaries provided by the optional local helper; Playwright Chromium 141. Database and browser integration use separate `driveshare_test`; the ordinary demo uses `driveshare`.

## Executed verification

| Check                                   | Observed result                                                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Prisma generation and TypeScript checks | Passed for backend and frontend                                                                                     |
| Production JavaScript builds            | Passed for API and Vite frontend                                                                                    |
| Both SQL migrations                     | Applied successfully to a new local PostgreSQL database; repeat deploy reports no pending migrations                |
| Fictional seed                          | Created seven accounts, eight spaces, recurring hours and scenario records; repeat seed skipped without overwriting |
| Final expanded backend suite            | 77 passed, 0 failed across 5 test files                                                                             |
| Playwright browser journeys             | 6 passed, 0 failed after fixing editable-schedule serialization and an ambiguous test selector                      |
| npm dependency audit                    | 0 known vulnerabilities after updating dependencies to patched stable releases                                      |
| Local app and API HTTP checks           | Frontend returned 200; database-backed API health succeeded                                                         |
| Visual inspection                       | Desktop landing/discovery screenshots reviewed; mobile discovery fits a 390px viewport                              |
| Clean local Git clone installation      | Pending final source commit and isolated installation check                                                         |

The backend suite uses actual PostgreSQL constraints and transactions. It covers eight-table existence, foreign keys, restricted history deletion, temporal overlap rules, adjacent intervals, terminal/waitlist nonblocking semantics, physical occupancy uniqueness, schedule constraints, payment replay/failure/retry/refunds, fine boundaries/caps/disputes, no-show reversal, next-driver protection, session invalidation, ownership and CSRF. Additional workflows verify listing approval, immutable booking terms, valid schedule saves, completed reviews, HTTP concurrency, multi-day owner blocks, notification read state and production demo/secret gates.

Concurrency tests include twelve simultaneous reservations, eight simultaneous HTTP reservation calls, booking versus cancellation, blocking, payment, stale-hold reclamation, repeated payments, waiter acceptance versus direct booking and payment versus cancellation. They assert safe outcomes in either lock order.

## Failures found and corrected

1. Prisma CLI initially did not load the root environment file. A checked-in Prisma configuration now loads it; migrations and seed subsequently ran.
2. A fine boundary test drifted by milliseconds under a continuing clock. Integration tests now freeze exact times; interactive demo clock still advances normally.
3. Initial browser setup interpreted a root helper as CommonJS. Root package now declares ESM.
4. Host schedule save sent uneditable database metadata into a strict schema. The editor now sends an explicit field allowlist; the browser save journey passed afterward.
5. A browser locator matched both “On map” and “View on map”. The assertion now uses an exact accessible name.
6. Initial dependency pins had audit findings. Updated stable versions and Prisma's PostgreSQL adapter removed all reported vulnerabilities; no force audit upgrade was used.

## Unverified gates and external limits

**Docker is not installed in this execution environment.** `docker version` could not execute. Container builds, Compose startup, container health ordering and a fresh Docker installation have therefore **not** been verified here. Dockerfiles/Compose and a GitHub Actions Docker smoke job are implemented, but a checked-in workflow is not evidence of a completed CI run. Run that job on a Docker-equipped machine before claiming every master-prompt quality gate has passed.

External map tile-provider availability was not relied on; the bundled local fallback was tested. Optional provider licensing, production HTTPS/secret rotation, backups, hardware occupancy sensing, outbound email and real financial integrations are not claimed. No real payment gateway is present.

The project stays on the original `main` history and uses the original origin. No new GitHub repository, remote push, deployment or history rewrite was performed.
