# DriveShare staging deployment

Use this guide from the **codex/online-deployment** checkout. The staging topology is a Vercel frontend, a Render Express service and private Render PostgreSQL in the same region as the service. The existing classroom checkout is independent.

## Why the existing URL returns 404

Vercel returned its own `NOT_FOUND` for `/`, `/explore` and `/api/health`. GitHub records a successful Vercel deployment for `main` commit `c7f863b`. That commit contains only `README.md`, so it cannot produce an `index.html` or serve DriveShare. The source is on `codex/ui-redesign`, which had no Vercel deployment status when inspected. Vercel project access is needed to read the existing dashboard's exact root and output overrides. [GitHub deployment status](https://api.github.com/repos/Siddharth1968/driveshare/commits/c7f863bc5c131667380fe8e3896371473619b571/status) · [Vercel 404 documentation](https://vercel.com/kb/guide/why-is-my-deployed-project-giving-404).

## Provision a separate staging project

1. Sign in to Vercel and create a **new** staging project with an available name, for example `driveshare-staging-siddharth1968`. Record its assigned public HTTPS domain. Leave the existing `driveshare` project, `driveshare-two.vercel.app` and its Git production branch in place. You can use the Vercel CLI from the deployment checkout. Replace the example name throughout with the project you created. [Vercel project CLI](https://vercel.com/docs/cli/project).

   ```sh
   vercel project add driveshare-staging-siddharth1968
   vercel link --project driveshare-staging-siddharth1968
   ```

2. In Render, choose **New > Blueprint**, select `Siddharth1968/driveshare`, and choose **codex/online-deployment**. Review the paid compute, database and disk before applying the Blueprint. Set `APP_ORIGIN` to the exact staging frontend origin, including `https://` and without a trailing slash. The Blueprint generates the session secret, attaches a persistent upload disk, and supplies the private `DATABASE_URL` for `driveshare_online`. Its pre-deploy command checks the database target and applies both existing migrations. Wait for **Live** and a JSON response from the Render service's `/api/health`. [Render Blueprints](https://render.com/docs/infrastructure-as-code) · [Render pricing](https://render.com/pricing).

3. In the Render service shell at the repository root, set three unique passwords of at least 16 characters and at most 72 UTF-8 bytes using private environment input. Use `DRIVESHARE_ONLINE_DRIVER_PASSWORD`, `DRIVESHARE_ONLINE_HOST_PASSWORD` and `DRIVESHARE_ONLINE_ADMIN_PASSWORD`. On Bash you can read them without echo or command history. Bootstrap seeds the three accounts, the driver's car and the fictional Sahyadri parking spaces in one transaction. It preserves existing rows on a successful rerun. [Render service shell](https://render.com/docs/ssh).

   ```bash
   read -rsp 'Online driver password: ' DRIVESHARE_ONLINE_DRIVER_PASSWORD; printf '\n'
   read -rsp 'Online host password: ' DRIVESHARE_ONLINE_HOST_PASSWORD; printf '\n'
   read -rsp 'Online admin password: ' DRIVESHARE_ONLINE_ADMIN_PASSWORD; printf '\n'
   export DRIVESHARE_ONLINE_DRIVER_PASSWORD DRIVESHARE_ONLINE_HOST_PASSWORD DRIVESHARE_ONLINE_ADMIN_PASSWORD
   DRIVESHARE_BOOTSTRAP=true node --import tsx apps/api/prisma/bootstrap-hosted.ts
   unset DRIVESHARE_ONLINE_DRIVER_PASSWORD DRIVESHARE_ONLINE_HOST_PASSWORD DRIVESHARE_ONLINE_ADMIN_PASSWORD
   ```

   The account emails are `driver@driveshare.demo`, `owner@driveshare.demo` and `admin@driveshare.demo`. Share the online passwords privately.

4. In the **new staging Vercel project**, set `DRIVESHARE_API_ORIGIN` to the Render service's public HTTPS origin. The Git and Vercel CLI project root is the repository root. The Vite install, build, and output values are `npm ci --include=dev`, `npm run build -w apps/web`, and `apps/web/dist`. Vercel rewrites API and upload requests to Render and serves the SPA for direct navigation to client routes. The browser keeps the session cookie on the staging frontend origin. [Vercel programmatic configuration](https://vercel.com/docs/project-configuration/vercel-ts) · [External rewrites](https://vercel.com/docs/routing/rewrites).

   With the new staging project linked and the variable set in its Production environment, run:

   ```sh
   vercel deploy --prod --project driveshare-staging-siddharth1968
   ```

   This assigns the stable public domain of the separate staging project. If the assigned origin differs from `APP_ORIGIN`, correct the Render variable, redeploy that service, and verify again before testing sign-in.

## Verify staging

From the deployment checkout, run `npm ci` and `npx playwright install chromium`. Set `DRIVESHARE_STAGING_URL` to the public staging frontend origin. Supply the same three hosted passwords as private process variables, then run `node scripts/smoke-hosted.mjs`. The script verifies the Vite assets and deep links, database health through the API proxy, Secure cookies, separate role sessions, booking ID matching, cancellation and released availability. It creates and cancels a simulated reservation in staging. Use the staging URL on a phone to confirm reachability outside the hosting dashboards.

For regression tests against a disposable database, set `TEST_DATABASE_URL` and `DATABASE_URL` to the dedicated test PostgreSQL URL with a database name ending in `_test`, then run `npm run db:migrate`, `npm run check` and `npm run test:e2e` in that order. The existing browser and database suites reset their selected test database. The staging smoke script uses HTTP and leaves the cancelled booking in staging history.

Get the repository owner's approval for the production switch after staging passes. The original Vercel URL still serves its previous deployment until the owner approves that switch.

## Verification record

- The original checkout served the home and explore routes, database health, and seven Adyar listings during a native read-only smoke check. PostgreSQL reported `default_transaction_read_only=on` for the API session. Its temporary verification processes were stopped afterward. The Docker CLI was unavailable for this check.
- The deployment checkout passed type checks, production builds, **92 API and database tests**, and **12 browser tests**. npm audit reported zero known vulnerabilities.
- The Render Blueprint passed Render's published JSON schema. Vercel's route parser verified the home, direct React routes, static assets, API and upload routing.
- In a separate HTTPS rehearsal, the three hosted accounts logged in with Secure cookies. The driver selected 24 hours in IST and booked Riverside Court on a mobile viewport. The desktop host saw the same booking ID and cancellation. The original interval reopened, and direct SQL verified the cancelled booking, the amount of ₹840, and the eight business tables in the rehearsal database. An authenticated upload also round-tripped through the proxy and configured disk directory. Both existing migrations applied to the disposable database, and the hosted bootstrap rerun preserved data.
- The public frontend, backend and managed database await provider provisioning. Run the same browser smoke script against the real staging URL before approving any switch.
