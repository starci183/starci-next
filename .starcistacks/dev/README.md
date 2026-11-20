# Development stack

The development stack is native-process: Docker Compose runs only the infrastructure (the app's own PostgreSQL (the db image: postgres, pgvector and pgmq), Redis, Qdrant, the Mailpit mail sink, the object store and the Caddy dev ingress), and the core API, the product app and the landing run as processes on the host, started by `starci app stack up`. Open the product on the app origin (`http://localhost:3200`, or the tunnel host `https://starci-next-app-dev.starci.org`): the browser calls the core API origin directly with credentials (`NEXT_PUBLIC_API_URL`, and `NEXT_PUBLIC_LOCAL_API_URL` = `http://localhost:3201` when the app is opened on localhost), so the auth doors (`/auth/*`), `/graphql` and the refresh cookie live on the core origin, the cookie host-only on the api host. The dev ingress `http://localhost:3280` is kept for the MCP endpoint, the device socket (`/socket.io`), `/graphql` and the webhooks: it sends those to the native core API (`host.docker.internal:3201`) and every other path to the native app (`host.docker.internal:3200`) (`infra/compose/Caddyfile`). The app (`:3200`), the core API (`:3201`) and the landing (`:3202`) also answer on their own loopback ports, for webhook simulations and tests. Mails land in Mailpit at `http://localhost:8025`. Trust authentication is gone: the database has the sealed superuser password and the environment's own role, on loopback only.

What runs is the `local` block of `environments.dev` in `.starcistacks/application-stacks.yaml` and `.starcistacks/dev/infra/compose/compose.yaml` (PROJECT-STACKS-6): the setup steps (`npm ci` when `node_modules` is absent, `codegen`, the build of the fe workspace packages, `build:be`), the compose services, the database role, the TypeORM migrations (`cli migrate run`, a `local.seed` command after the harness `db migrate`, which finds no SQL migrations here), then the three processes. Their environment, and which sealed keys reach each as a `<KEY>_FILE`, are declared on the process; the key names are in `runtime/env/KEYS.md`. Nobody runs docker by hand.

| Command | Operation |
| --- | --- |
| prepare | `starci app stack prepare --env dev --execute`: opens the sealed custody and runs the setup steps (codegen, package and core builds). |
| doctor | `starci app stack doctor --env dev`: read-only table of host prerequisites, custody, compose render and ports. |
| up | `starci app stack up --env dev --execute`: prepare, then the compose infrastructure, the database role, migrations, the seed levels, the native processes and readiness; prints the origins. |
| status | `starci app stack status --env dev`: desired against running and every readiness probe. |
| logs | `starci app stack logs --env dev --service core` (core, app, landing, or db, redis, qdrant, mail, ingress): bounded and redacted; never prints credentials. |
| down | `starci app stack down --env dev --execute`: ends the native processes and stops the compose project; volumes and sealed values stay. |
| verification | `starci app stack verify --env dev`: the API `/health/live` and `/health/ready` probes, the auth door on the core (a signed-out `GET /auth/session` answers 401) and the JWKS (`/auth/jwks`), then `npm run lint` from the app root. |

Keep real sealed members under `.starcistacks/dev/secrets/*.enc`, add them to the manifest after sealing and inventory their key names in the environment record. The scaffold creates no fake secret or successful proof.

## Public hosts (the dev tunnel)

`environments.dev.local.tunnel` publishes the stack on the machine's `nivo-dev` Cloudflare tunnel; `up --execute` writes the ingress rules into `~/.cloudflared/nivo-dev.yml` and makes the DNS records. If it says the connector must be restarted, restart it (`nivo-dev.cmd`).

| Host | Reaches |
| --- | --- |
| `https://starci-next-app-dev.starci.org` | the ingress (`:3280`): `/api/*`, `/graphql`, `/mcp`, `/socket.io/*` to the core api, the rest to the app; the one origin of the browser and its host-only session cookie |
| `https://starci-next-api-dev.starci.org` | the core api (`:3201`): the MCP endpoint `/mcp` shown on `/connect` and the learner CLI (`STARCI_NEXT_URL`) |
| `https://starci-next-dev.starci.org` | the landing (`:3202`) |
| `https://starci-next-gallery-dev.starci.org` | the screenshot gallery (`:3250`) |


## Signing in (the app-owned auth)

The core api signs its own access tokens (passport kit, sealed `AUTH_JWT_PRIVATE_KEY` of member `auth`) and serves the JWKS; there is no external identity provider. Sign-up and password reset send an emailed link to Mailpit.

1. Open `http://localhost:3280/sign-in` (or any protected page: a signed-out read sends you there with `returnTo`).
2. Choose "Đăng ký", enter an email and a password of 8 to 72 characters, accept the terms and submit.
3. Open Mailpit at `http://localhost:3292`, open the newest mail to that address and open its link (`/auth/confirm?token=…`, which lands on `/sign-in/confirm`).
4. The page says the email is confirmed; sign in with the email and password. A forgotten password goes the same way: "Quên mật khẩu?" sends a link to `/sign-in/reset`.

## Dự án: chạy trên máy học viên

The learner CLI runs a project's tests on the learner's own machine and relays the results as practice ("Đang luyện"). The core api signs every manifest, so the dev core needs a key pair that outlives its process:

1. Once per machine: `node scripts/integration/relay-manifest-key.mjs` (writes `manifest-signing.pem` and `manifest-public.pem` into `<stack data>/relay-dev/`; never overwrites). Then `starci app stack up --env dev --execute` (or restart the core api) so it reads `RELAY_MANIFEST_SIGNING_KEY_FILE`.
2. In the learner's shell: `export STARCI_NEXT_URL=http://localhost:3280 STARCI_NEXT_MANIFEST_KEY="$(cat <stack data>/relay-dev/manifest-public.pem)"`.
   To reach the stack from another machine, point the CLI at the tunnel instead: `export STARCI_NEXT_URL=https://starci-next-api-dev.starci.org` (or `npx @starci/next` with that variable set); the pairing page is then `https://starci-next-app-dev.starci.org/devices`. The manifest key is the same file.
3. `starci-next login` pairs the machine (confirm the code at `/devices`), `starci-next init --from <starci-next-seed-standard checkout> --project <project id>` copies the kit, `starci-next run <milestone>` runs `test.command` of the project file in the kit's own `starci` folder, reads the JUnit XML for tests tagged `[concept]` and posts one result per concept. Open the project page to see "Đang luyện".

## Thử Premium

In dev the SePay and payOS secrets are sandbox placeholders, so a real gateway can never call back. `scripts/integration/simulate-sepay-ipn.mjs` stands in for SePay: it posts the paid-order IPN the gateway would post to the core API's webhook door (`POST http://localhost:3201/webhooks/sepay`, authenticated by the `x-secret-key` header the sepay client compares with the IPN secret key; amount = the order's amount).

1. Sign in (see "Signing in"), open the Premium page and click "Tiếp tục thanh toán". The redirect to `pay.sepay.vn` fails (sandbox placeholder merchant); that is expected. The order stays `verifying`.
2. From the repo root run `node scripts/integration/simulate-sepay-ipn.mjs`. It picks the newest pending sepay order in the dev database; `--order-id <uuid>` (the id `startPremiumCheckout` returned) or `--order-code <SE-n>` names one.
3. `/premium/result` turns `active` within a few seconds, `myPremium.isPremium` is true and the locked lesson phases open.

The script reads the IPN secret through `npx starci app secret get --env dev sepay SEPAY_IPN_SECRET_KEY --to-file` and the dev database URL the stack materialized beside it (never printed), and refuses anything but a loopback core API (a 200 or 204 answer counts as accepted; `--core` defaults to `http://localhost:3201`), the dev custody and a loopback database. The core must be running (`starci app stack status --env dev`). payOS has no simulator; start checkout on the sepay rail.

## Lessons content

The seed level holds the seven V2 concept lessons of starci-lab/data at commit 231d8cc57 (`seeds/sql/primary-lessons.sql`, folders 0 to 6), so the dev app lists and opens them after `up`. To import more concepts from a local checkout of that repository, run the cli app with the same database connection: `cli lessons import --dir <checkout>/concepts --ref <commit> [--only <folder>,<folder>]`. It logs one line per folder (counts, version and hashes, never an answer), leaves an identical version alone, refuses other bytes under a stored version and keeps the live version when a folder fails.

## The migrations and the loader

The harness `db migrate` step of `up` reads `db/migrations/*.sql`; this app has none (its migrations are TypeORM), and an absent folder is an empty chain, so no empty folder is created. The `migrate-typeorm` seed step of `environments.dev.local` declares `mode: always`: it runs right after `db migrate` on every `up`, before the `data.sets` loader writes the content standard into the tables, so a database with no tables yet is migrated first. The seed door (`cli data database`) applies no migration of its own.

## Gallery seed (states one fresh learner cannot reach)

`node scripts/integration/gallery-seed.mjs [--hold] [--only <key>,...] [--out <dir>]` puts the running dev stack into the gallery states that need history, a paired machine or a role, with real data and through the core's own doors: sign-up and sign-in with the mail-sink code, the relay pairing doors, the device socket and the `relayCheck*` uploads, the `review*` mutations, the career doors, `createProject`; Premium and the sample experience items go through the cli app's dev-only `entitlement dev-grant` and `career seed` (the script sets their dev switches for that child only),. It refuses anything but the loopback core, mail sink and database and the dev custody, and is safe to re-run (learners are reused, a re-paired device replaces the old one, the manifest is merged). Learners are `gallery-<key>@example.test`, a random password each, kept in the states folder; it writes a Playwright storage state per learner and a manifest into the gitignored `.tmp-*` states folder. `scripts/integration/gallery-capture.mjs` reads that manifest and shoots the named screens as those learners.

A device is online only while its socket is open: run the seed with `--hold` (it stays in the foreground until Ctrl+C) and capture meanwhile. `review/session-conflict` is done by the capture itself: it flips the first card, runs `node scripts/integration/gallery-seed.mjs --grade-elsewhere` (a second session grades that card "good") and then grades "Lại" in the browser; each run uses up one card of the 30 the learner holds. `/incidents` shows an authored row because the dev core declares `INCIDENT_AUTHORED` (production declares none); the stack must be restarted once for it.
