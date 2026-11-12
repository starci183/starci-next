# Environment key roster

This roster declares names only. Store credential values in sealed custody and materialize private KEY files outside the repository.

| Key | Consumer |
| --- | --- |
| `PORT` | API listener |
| `HTTP_SECURITY_ALLOWED_ORIGINS` | API origin allowlist |
| `PRIMARY_DB_URL` | API and CLI primary database connection; in dev `up` hands the native processes `PRIMARY_DB_URL_FILE`, a host-local file holding the loopback URL of the environment's own role |
| `NEXT_PUBLIC_SITE_URL` | Product front-end site URL |
| `CORE_INTERNAL_ORIGIN` | Product front-end native `next dev` only (the dev ingress already routes those paths before they reach it; this serves a direct visit to its port): server-side origin of the core API its `/api/*` and `/graphql` rewrites proxy to, the dev stack sets it to the native core API; unset in every image, where the ingress routes those paths |
| `NEXT_PUBLIC_APP_URL` | Landing front-end product link |
| `IDENTITY_KEYCLOAK_ISSUER` | Core API Keycloak realm issuer URL |
| `IDENTITY_KEYCLOAK_CLIENT_ID` | Core API Keycloak confidential client id |
| `IDENTITY_KEYCLOAK_CLIENT_SECRET` | Core API Keycloak client secret; the API reads `IDENTITY_KEYCLOAK_CLIENT_SECRET_FILE`, a host-local file `up` materializes from the sealed member `keycloak-client-secret` |
| `IDENTITY_KEYCLOAK_CLIENT_SECRET_FILE` | Host-local path of the Keycloak client secret file |
| `IDENTITY_SOCIAL_CALLBACK_URI` | Core API registered social sign-in callback URL (the front end `/sign-in/callback` page) |
| `IDENTITY_PROVIDER_TIMEOUT_MS` | Core API identity provider request deadline in milliseconds |
| `IDENTITY_SESSION_ENCRYPTION_KEY` | Core API session sealing key, at least 32 characters; the API reads `IDENTITY_SESSION_ENCRYPTION_KEY_FILE` from the sealed member `identity-session-encryption-key` |
| `IDENTITY_SESSION_ENCRYPTION_KEY_FILE` | Host-local path of the session sealing key file |
| `IDENTITY_SESSION_MAX_SECONDS` | Core API absolute session lifetime in seconds; 0 leaves only the provider refresh lifetime |
| `IDENTITY_CHALLENGE_TTL_SECONDS` | Core API sign-in, sign-up and password-reset code lifetime in seconds |
| `IDENTITY_CHALLENGE_MAX_ATTEMPTS` | Core API wrong-code attempts allowed per challenge |
| `RELAY_MANIFEST_SIGNING_KEY` | Core API Ed25519 PEM (pkcs8) the task manifests of the learner relay are signed with; the core reads `RELAY_MANIFEST_SIGNING_KEY_FILE`; in dev the stack points it at `<stack data>/relay-dev/manifest-signing.pem`, made by `node scripts/relay-manifest-key.mjs`; any other mode refuses to boot without it |
| `RELAY_MANIFEST_SIGNING_KEY_FILE` | Host-local path of the manifest signing key file |
| `STARCI_NEXT_MANIFEST_KEY` | Learner CLI (`starci-next`) only: the SPKI PEM of the public half, which it verifies manifests with; in dev `export STARCI_NEXT_MANIFEST_KEY="$(cat <stack data>/relay-dev/manifest-public.pem)"` |
| `STARCI_NEXT_URL` | Learner CLI only: the StarCi origin (dev: `http://localhost:3080`, the ingress, which routes `/api`, `/graphql` and `/socket.io` to the core api) |
| `STARCI_NEXT_DATA_DIR` | Learner CLI only: a starci-next-data checkout `starci-next init` reads the kit from when `--from` is not given |
| `CAREER_DEV_SEED` | CLI `career seed` only: `true` lets the development seed create sample experience items; never declared in production, where the seed is refused `CAREER_DEV_SEED_DISABLED` |
| `ENTITLEMENT_DEV_GRANT` | CLI `entitlement dev-grant` only: `true` lets the development command grant Premium to a learner with no purchase; set on the dev cli run by hand, never declared in production or on a core process, where the command is refused `ENTITLEMENT_DEV_GRANT_DISABLED` |
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
| `CONTENT_GIT_URL` | CLI `content sync` only: the content repository the git mount pulls (optional integration; set together with `CONTENT_DATASOURCES_DIR`, unset means local directories only) |
| `CONTENT_GIT_REF` | CLI `content sync` only: branch, tag or pinned sha of the content repository (optional) |
| `CONTENT_GIT_TOKEN` | CLI `content sync` only: access token of the content repository; read from `CONTENT_GIT_TOKEN_FILE`, a sealed member once the repository is private |
| `CONTENT_GIT_TOKEN_FILE` | Host-local path of the content repository token file |
| `CONTENT_DATA_GIT_URL` | CLI `content sync` only: the teacher's data repository (optional; unset pulls the content repository alone) |
| `CONTENT_DATA_GIT_REF` | CLI `content sync` only: branch, tag or pinned sha of the data repository (optional) |
| `CONTENT_DATA_GIT_TOKEN` | CLI `content sync` only: access token of the data repository; read from `CONTENT_DATA_GIT_TOKEN_FILE`, a sealed member once the repository is private |
| `CONTENT_DATA_GIT_TOKEN_FILE` | Host-local path of the data repository token file |
| `CONTENT_DATASOURCES_DIR` | CLI `content sync` only: the directory the versioned content snapshots live in |
| `PRACTICE_FREE_PER_PATTERN` | Core API problems of each pattern open without Premium (non-secret, default 1) |
| `PRACTICE_JUDGE_CONCURRENCY` | Core API most submissions judged at once on one instance (non-secret, default 4) |
| `PRACTICE_SUBMISSIONS_PER_MINUTE` | Core API most runs and submits one learner may make in a minute (non-secret, default 10) |
| `PRACTICE_MAX_SOURCE_BYTES` | Core API largest source a learner may send (non-secret, default 65536) |
| `PRACTICE_WAIT` | Core API most time a run or submit waits for its verdict before answering still judging (non-secret, default 25s) |
| `ATTEMPT_COACH_DAILY_LIMIT` | Core API fair-use cap of AI gradings per learner per UTC day (default 100); no credits are shown to the learner |

In dev every key above is set on the native process by `environments.dev.local.processes` of `application-stacks.yaml` (`env` for names with a value, `files` for the sealed keys, which become `<KEY>_FILE`). The `/run/secrets/...` paths and `core:3001` container names of the earlier all-compose model no longer exist.

Public front-end configuration is supplied at build time (images) or in the process environment (dev) and stays outside sealed custody.
