# Environment key roster

This roster declares names only. Store credential values in sealed custody and materialize private KEY files outside the repository.

| Key | Consumer |
| --- | --- |
| `PORT` | API listener |
| `HTTP_SECURITY_ALLOWED_ORIGINS` | API origin allowlist; the first entry is the learner web origin, the base of the relay pairing page `/devices` |
| `MCP_PUBLIC_URL` | Core API: the MCP endpoint address `/connect` shows learners (dev: the tunnel api host plus `/mcp`); unset shows the page-relative `/mcp` |
| `NEXT_DEV_ALLOWED_ORIGINS` | Product front-end and landing native `next dev` only: comma-separated hosts the dev server serves its dev resources and HMR socket to besides localhost (`allowedDevOrigins`); unset in every image |
| `PRIMARY_DB_URL` | API and CLI primary database connection; in dev `up` hands the native processes `PRIMARY_DB_URL_FILE`, a host-local file holding the loopback URL of the environment's own role |
| `PRIMARY_DB_SCHEMA` | API and CLI: the schema of the primary connection (`public`) |
| `NEXT_PUBLIC_SITE_URL` | Product front-end site URL |
| `NEXT_PUBLIC_API_URL` | Product front-end: the origin of the core api the browser calls directly (GraphQL and the auth doors) |
| `NEXT_PUBLIC_LOCAL_API_URL` | Product front-end (dev): the local core the app opened on localhost calls, so the refresh cookie stays same-site |
| `NEXT_PUBLIC_APP_URL` | Landing front-end product link |
| `AUTH_JWT_PRIVATE_KEY` | Core API passport kit: the Ed25519 PEM the access tokens are signed with (the JWKS publishes its public half); the API reads `AUTH_JWT_PRIVATE_KEY_FILE`, a host-local file `up` materializes from the sealed member `auth` |
| `AUTH_JWT_PRIVATE_KEY_FILE` | Host-local path of the JWT private key file |
| `AUTH_JWT_ISSUER` | Core API: the issuer of the access tokens, the public origin of the app host |
| `AUTH_WEB_ORIGIN` | Core API: the web origin of the app (the return origin of the doors and the links in the mails) |
| `AUTH_JWT_AUDIENCE` | Core API: the audience of the access tokens |
| `AUTH_JWT_KEY_ID` | Core API: the key id the JWKS publishes the signing key under |
| `AUTH_COOKIE_DOMAIN` | Core API: the domain the refresh cookie is set for, shared by the app and api hosts (staging and production only; dev leaves it unset so the cookie is host-only) |
| `AUTH_COOKIE_NAME` | Core API: the name of the refresh cookie (an RFC 6265 token, default `refresh_token`); `starci_next_refresh` here, so the other app on the shared starci.org hosts cannot overwrite it |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CALLBACK_URL` | Core API Google OAuth client and callback (local placeholders in the manifest; Google sign-in is not configured) |
| `GOOGLE_CLIENT_SECRET` | Core API Google OAuth client secret (member `google`, a dev placeholder); the API reads `GOOGLE_CLIENT_SECRET_FILE` |
| `NEXT_PUBLIC_AUTH_GOOGLE` | Product front-end: `false` keeps the Google button off |
| `RELAY_MANIFEST_SIGNING_KEY` | Core API Ed25519 PEM (pkcs8) the task manifests of the learner relay are signed with; the core reads `RELAY_MANIFEST_SIGNING_KEY_FILE`; in dev the stack points it at `<stack data>/relay-dev/manifest-signing.pem`, made by `node scripts/integration/relay-manifest-key.mjs`; any other mode refuses to boot without it |
| `RELAY_MANIFEST_SIGNING_KEY_FILE` | Host-local path of the manifest signing key file |
| `STARCI_NEXT_MANIFEST_KEY` | Learner CLI (`starci-next`) only: the SPKI PEM of the public half, which it verifies manifests with; in dev `export STARCI_NEXT_MANIFEST_KEY="$(cat <stack data>/relay-dev/manifest-public.pem)"` |
| `STARCI_NEXT_URL` | Learner CLI only: the StarCi origin (dev: `https://starci-next-api-dev.starci.org`, the core api on the tunnel, or `http://localhost:3280`, the ingress, which routes `/api`, `/graphql` and `/socket.io` to the core api) |
| `STARCI_NEXT_DATA_DIR` | Learner CLI only: a starci-next-seed-standard checkout `starci-next init` reads the kit from when `--from` is not given |
| `CAREER_DEV_SEED` | CLI `career seed` only: `true` lets the development seed create sample experience items; never declared in production, where the seed is refused `CAREER_DEV_SEED_DISABLED` |
| `ENTITLEMENT_DEV_GRANT` | CLI `entitlement dev-grant` only: `true` lets the development command grant Premium to a learner with no purchase; set on the dev cli run by hand, never declared in production or on a core process, where the command is refused `ENTITLEMENT_DEV_GRANT_DISABLED` |
| `SEED_MEMBER_PASSWORD` | `starci app look` only (`gallery/look.json` `signIn.password`): the sign-in password of the dev seed owner the look signs in as, read from the sealed member `seed`; no app process reads it |
| `QDRANT_API_KEY` | Core API and CLI vector index client (optional: absent on a private network); the secret of the owner-provisioned Qdrant |
| `AI_API_KEY` | Core API MCP embedder: the token of the shared host embeddings service (ai-router kind local); optional for a keyless server |
| `MAIL_HOST` | Core API outgoing mail server host |
| `MAIL_PORT` | Core API outgoing mail server port |
| `MAIL_SECURITY` | Core API mail transport security: `tls`, `starttls` or `none` |
| `MAIL_USER` | Core API mail login user; unset means no login |
| `MAIL_PASSWORD` (unset in dev) | Core API mail login password; the API reads `MAIL_PASSWORD_FILE` |
| `MAIL_PASSWORD_FILE` (unset in dev) | Host-local path of the mail password file |
| `MAIL_FROM` | Core API sender address |
| `MAIL_FROM_NAME` | Core API sender display name and mail brand |
| `MAIL_DEFAULT_LANGUAGE` | Core API default mail language: `vi` or `en` |
| `PAYOS_CLIENT_ID` | Core API payOS channel client id (non-secret; sent as `x-client-id`) |
| `PAYOS_CHECKSUM_KEY` | Core API payOS channel checksum key; the API reads `PAYOS_CHECKSUM_KEY_FILE` from the sealed member `payos` |
| `PAYOS_CHECKSUM_KEY_FILE` | Host-local path of the payOS checksum key file |
| `PAYOS_API_KEY` | Core API payOS API key; the API reads `PAYOS_API_KEY_FILE` from the sealed member `payos` |
| `PAYOS_API_KEY_FILE` | Host-local path of the payOS API key file |
| `SEPAY_MERCHANT_ID` | Core API SePay merchant id (non-secret) |
| `SEPAY_IPN_SECRET_KEY` | Core API SePay IPN secret key; the API reads `SEPAY_IPN_SECRET_KEY_FILE` from the sealed member `sepay` |
| `SEPAY_IPN_SECRET_KEY_FILE` | Host-local path of the SePay IPN secret key file |
| `SEPAY_SIGNING_SECRET_KEY` | Core API SePay form signing secret; the API reads `SEPAY_SIGNING_SECRET_KEY_FILE` from the sealed member `sepay` |
| `SEPAY_SIGNING_SECRET_KEY_FILE` | Host-local path of the SePay signing secret file |
| `OPENROUTER_API_KEY` | Core API OpenRouter key of the AI coach (owner-provided; sealed placeholder until then); the API reads `OPENROUTER_API_KEY_FILE` from the sealed member `ai`; unset means no AI pool and written answers are saved but not graded (ATTEMPT_COACH_UNCONFIGURED) |
| `OPENROUTER_API_KEY_FILE` | Host-local path of the OpenRouter key file |
| `AI_GATEWAY_MODEL` | Core API preferred coach model id on OpenRouter (non-secret, default `deepseek/deepseek-v4.1-flash`) |
| `AI_GATEWAY_FALLBACK_MODEL` | Core API model the coach falls back to (non-secret, default the preferred model, i.e. no fallback) |
| `AI_GATEWAY_BASE_URL` | Core API OpenAI-compatible endpoint of the pool (non-secret, default `https://openrouter.ai/api/v1`) |
| `AI_GATEWAY_MAX_OUTPUT_TOKENS` | Core API most tokens one grading may produce (non-secret, default 2048) |
| `JUDGE0_BASE_URL` | Core API origin of the self-hosted Judge0 that runs learner code (owner-provisioned; placeholder until then); unset together with the token means no judge and a run ends as an internal error (PRACTICE_JUDGE_UNAVAILABLE) |
| `JUDGE0_AUTH_TOKEN` | Core API Judge0 auth token sent as `X-Auth-Token` (owner-provided placeholder; never a real value in the repository); the API reads `JUDGE0_AUTH_TOKEN_FILE` |
| `JUDGE0_AUTH_TOKEN_FILE` | Host-local path of the Judge0 token file |
| `JUDGE0_TIMEOUT` | Core API most time one call to Judge0 may take (non-secret, default 10s) |
| `JUDGE0_POLL_INTERVAL` | Core API wait between two reads of a batch that is still judging (non-secret, default 500ms) |
| `JUDGE0_DEADLINE` | Core API most time a whole batch may take (non-secret, default 60s) |
| `PRACTICE_JUDGE_CONCURRENCY` | Core API most submissions judged at once on one instance (non-secret, default 4) |
| `PRACTICE_SUBMISSIONS_PER_MINUTE` | Core API most runs and submits one learner may make in a minute (non-secret, default 10) |
| `PRACTICE_MAX_SOURCE_BYTES` | Core API largest source a learner may send (non-secret, default 65536) |
| `PRACTICE_WAIT` | Core API most time a run or submit waits for its verdict before answering still judging (non-secret, default 25s) |
| `PRACTICE_SUBMISSIONS_PAGE` | Core API submissions a page of the learner submission history holds when the request names no limit (non-secret, default 20, at most 50) |
| `ATTEMPT_COACH_DAILY_LIMIT` | Core API fair-use cap of AI gradings per learner per UTC day (default 100); no credits are shown to the learner |

In dev every key above is set on the native process by `environments.dev.local.processes` of `application-stacks.yaml` (`env` for names with a value, `files` for the sealed keys, which become `<KEY>_FILE`). The `/run/secrets/...` paths and `core:3001` container names of the earlier all-compose model no longer exist.

Public front-end configuration is supplied at build time (images) or in the process environment (dev) and stays outside sealed custody.
