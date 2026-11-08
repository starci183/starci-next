# Development stack

The development stack is native-process: Docker Compose runs only the infrastructure (a pinned local PostgreSQL, the Mailpit mail sink and the Caddy dev ingress), and the core API, the product app and the landing run as processes on the host, started by `starci app stack up`. Open the product at the ingress origin `http://localhost:3080`: it routes `/api/*` and `/graphql` to the native core API (`host.docker.internal:3001`) and every other path to the native app (`host.docker.internal:3000`), so the host-only session cookie reaches the doors exactly as in production (`infra/compose/Caddyfile`). The app (`:3000`), the core API (`:3001`) and the landing (`:3002`) also answer on their own loopback ports, for webhook simulations and tests; a direct visit to `:3000` still reaches the core through the dev rewrite of the app's Next config (`CORE_INTERNAL_ORIGIN`). Mails land in Mailpit at `http://localhost:8025`. Trust authentication is gone: the database has the sealed superuser password and the environment's own role, on loopback only.

What runs is the `local` block of `environments.dev` in `.starcistacks/application-stacks.yaml` and `.starcistacks/dev/infra/compose/compose.yaml` (PROJECT-STACKS-6): the setup steps (`npm ci` when `node_modules` is absent, `codegen`, the build of the fe workspace packages, `build:be`), the compose services, the database role, the TypeORM migrations (`cli migrate run`, a `local.seed` command after the harness `db migrate`, which finds no SQL migrations here), then the three processes. Their environment, and which sealed keys reach each as a `<KEY>_FILE`, are declared on the process; the key names are in `runtime/env/KEYS.md`. Nobody runs docker by hand.

| Command | Operation |
| --- | --- |
| prepare | `starci app stack prepare --env dev --execute`: opens the sealed custody and runs the setup steps (codegen, package and core builds). |
| doctor | `starci app stack doctor --env dev`: read-only table of host prerequisites, custody, compose render and ports. |
| up | `starci app stack up --env dev --execute`: prepare, then the compose infrastructure, the database role, migrations, the seed levels, the native processes and readiness; prints the origins. |
| status | `starci app stack status --env dev`: desired against running and every readiness probe. |
| logs | `starci app stack logs --env dev --service core` (core, app, landing, or postgres, mail, ingress): bounded and redacted; never prints credentials. |
| down | `starci app stack down --env dev --execute`: ends the native processes and stops the compose project; volumes and sealed values stay. |
| verification | `starci app stack verify --env dev`: the API `/health/live` and `/health/ready` probes, the identity session door through the ingress (a signed-out `GET /api/identity/session` answers 401), then `npm run lint` from the app root. |

Keep real sealed members under `.starcistacks/dev/secrets/*.enc`, add them to the manifest after sealing and inventory their key names in the environment record. The scaffold creates no fake secret or successful proof.

## Signing in (the dev Keycloak)

Compose also runs a dev Keycloak (`keycloak`, a digest-pinned image) with the realm `starci-next-identity` imported from `.starcistacks/dev/infra/compose/realm-starci-next-identity.json`: the confidential client `starci-next-identity-lane` has Direct Access Grants and a service account holding the realm-management roles `manage-users` and `view-users`, which is what the core api's OIDC broker needs for the password grant and the sign-up and reset calls. The client secret is the sealed `IDENTITY_KEYCLOAK_CLIENT_SECRET` (member `keycloak-client-secret`), mounted into the container through the least grant `keycloak`. The core api requires an https issuer, so Keycloak serves `https://localhost:8089` with a self-signed certificate it makes on its first start; its public part is written to the data directory named `keycloak-tls` and the core api trusts it through `HTTP_TRUSTED_CA_FILE`. Social sign-in (Facebook, GitHub) is not configured. The master-realm admin has a random password nobody keeps: change the realm in the file and recreate the container instead.

1. Open `http://localhost:3080/sign-in` (or any protected page: a signed-out read of Essentials, a topic or a lesson sends you there with `returnTo`).
2. Choose sign up, enter an email and a password of at least 6 characters, and submit.
3. Open Mailpit at `http://localhost:8025`, open the newest mail to that address and read the six-digit code.
4. Enter the code: the session cookie is set and you land on the page you came from. Signing in later asks for the password, then a new emailed code the same way.

## Thử Premium

In dev the SePay and payOS secrets are sandbox placeholders, so a real gateway can never call back. `scripts/dev/simulate-sepay-ipn.mjs` stands in for SePay: it posts the paid-order IPN the gateway would post to the core API's webhook door (`POST http://localhost:3001/webhooks/sepay`, authenticated by the `x-secret-key` header the sepay client compares with the IPN secret key; amount = the order's amount).

1. Sign in (see "Signing in"), open the Premium page and click "Tiếp tục thanh toán". The redirect to `pay.sepay.vn` fails (sandbox placeholder merchant); that is expected. The order stays `verifying`.
2. From the repo root run `node scripts/dev/simulate-sepay-ipn.mjs`. It picks the newest pending sepay order in the dev database; `--order-id <uuid>` (the id `startPremiumCheckout` returned) or `--order-code <SE-n>` names one.
3. `/premium/result` turns `active` within a few seconds, `myPremium.isPremium` is true and the locked lesson phases open.

The script reads the IPN secret through `npx starci app secret get --env dev sepay SEPAY_IPN_SECRET_KEY --to-file` and the dev database URL the stack materialized beside it (never printed), and refuses anything but a loopback core API (a 200 or 204 answer counts as accepted; `--core` defaults to `http://localhost:3001`), the dev custody and a loopback database. The core must be running (`starci app stack status --env dev`). payOS has no simulator; start checkout on the sepay rail.

## Lessons content

The seed level holds the seven V2 concept lessons of starci-lab/data at commit 231d8cc57 (`seeds/sql/primary-lessons.sql`, folders 0 to 6), so the dev app lists and opens them after `up`. To import more concepts from a local checkout of that repository, run the cli app with the same database connection: `cli lessons import --dir <checkout>/concepts --ref <commit> [--only <folder>,<folder>]`. It logs one line per folder (counts, version and hashes, never an answer), leaves an identical version alone, refuses other bytes under a stored version and keeps the live version when a folder fails.

## Known harness gap: the migrations folder

The harness `db migrate` step of `up` requires a readable `db/migrations` folder, and this app's migrations are TypeORM (run by the `migrate-typeorm` seed command after it), so the folder would stay empty, which the structure gates refuse (`HFS_EMPTY_DIR`, `HFS_ROOT_ENTRY_FORBIDDEN`). Until the harness accepts an app without SQL migrations, an `up` creates the empty folder for its run and removes it afterwards. The seed levels also run before the TypeORM migrations, so a database with no tables yet fails its first seed level; it needs the harness to run `local.seed` migration commands before the seed levels.
