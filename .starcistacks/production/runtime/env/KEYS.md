# Production environment key roster

This inventory declares names, consumers and mounted file paths. Scaffolding seals a generated database placeholder to this app's own recipient. Replace it with the real credential before use; no successful deployment is claimed by scaffolding.

| Key | Consumer |
| --- | --- |
| `PORT` | Core API listener |
| `HTTP_SECURITY_ALLOWED_ORIGINS` | Core API origin allowlist |
| `PRIMARY_DB_URL` | Core API and CLI primary database connection; the API reads `PRIMARY_DB_URL_FILE` at `/run/secrets/primary-db-url` |
| `NEXT_PUBLIC_SITE_URL` | Product front-end site URL |
| `NEXT_PUBLIC_APP_URL` | Landing front-end product link |
| `IDENTITY_KEYCLOAK_ISSUER` | Core API Keycloak realm issuer URL |
| `IDENTITY_KEYCLOAK_CLIENT_ID` | Core API Keycloak confidential client id |
| `IDENTITY_KEYCLOAK_CLIENT_SECRET` | Core API Keycloak client secret; the API reads `IDENTITY_KEYCLOAK_CLIENT_SECRET_FILE` at `/run/secrets/keycloak-client-secret` |
| `IDENTITY_KEYCLOAK_CLIENT_SECRET_FILE` | Mounted path of the Keycloak client secret file |
| `IDENTITY_SOCIAL_CALLBACK_URI` | Core API registered social sign-in callback URL (the front end `/sign-in/callback` page) |
| `IDENTITY_PROVIDER_TIMEOUT_MS` | Core API identity provider request deadline in milliseconds |
| `IDENTITY_SESSION_ENCRYPTION_KEY` | Core API session sealing key, at least 32 characters; the API reads `IDENTITY_SESSION_ENCRYPTION_KEY_FILE` at `/run/secrets/identity-session-encryption-key` |
| `IDENTITY_SESSION_ENCRYPTION_KEY_FILE` | Mounted path of the session sealing key file |
| `IDENTITY_SESSION_MAX_SECONDS` | Core API absolute session lifetime in seconds; 0 leaves only the provider refresh lifetime |
| `IDENTITY_CHALLENGE_TTL_SECONDS` | Core API sign-in, sign-up and password-reset code lifetime in seconds |
| `IDENTITY_CHALLENGE_MAX_ATTEMPTS` | Core API wrong-code attempts allowed per challenge |
| `MAIL_HOST` | Core API outgoing mail server host |
| `MAIL_PORT` | Core API outgoing mail server port |
| `MAIL_SECURITY` | Core API mail transport security: `tls`, `starttls` or `none` |
| `MAIL_USER` | Core API mail login user; unset means no login |
| `MAIL_PASSWORD` | Core API mail login password; the API reads `MAIL_PASSWORD_FILE` at `/run/secrets/mail-password` |
| `MAIL_PASSWORD_FILE` | Mounted path of the mail password file |
| `MAIL_FROM` | Core API sender address |
| `MAIL_FROM_NAME` | Core API sender display name and mail brand |
| `MAIL_DEFAULT_LANGUAGE` | Core API default mail language: `vi` or `en` |
| `PAYOS_CLIENT_ID` | Core API payOS channel client id (non-secret; sent as `x-client-id`) |
| `PAYOS_CHECKSUM_KEY` | Core API payOS channel checksum key; the API reads `PAYOS_CHECKSUM_KEY_FILE` at `/run/secrets/payos-checksum-key` |
| `PAYOS_CHECKSUM_KEY_FILE` | Mounted path of the payOS checksum key file |
| `PAYOS_API_KEY` | Core API payOS API key; the API reads `PAYOS_API_KEY_FILE` at `/run/secrets/payos-api-key` |
| `PAYOS_API_KEY_FILE` | Mounted path of the payOS API key file |
| `SEPAY_MERCHANT_ID` | Core API SePay merchant id (non-secret) |
| `SEPAY_IPN_SECRET_KEY` | Core API SePay IPN secret key; the API reads `SEPAY_IPN_SECRET_KEY_FILE` at `/run/secrets/sepay-ipn-secret-key` |
| `SEPAY_IPN_SECRET_KEY_FILE` | Mounted path of the SePay IPN secret key file |
| `SEPAY_SIGNING_SECRET_KEY` | Core API SePay form signing secret; the API reads `SEPAY_SIGNING_SECRET_KEY_FILE` at `/run/secrets/sepay-signing-secret-key` |
| `SEPAY_SIGNING_SECRET_KEY_FILE` | Mounted path of the SePay signing secret file |
| `OPENROUTER_API_KEY` | Core API OpenRouter key of the AI coach (owner-provided; sealed placeholder until then); the API reads `OPENROUTER_API_KEY_FILE` from the sealed member `ai`; unset means no AI pool and written answers are saved but not graded (ATTEMPT_COACH_UNCONFIGURED) |
| `OPENROUTER_API_KEY_FILE` | Mounted path of the OpenRouter key file at `/run/secrets/openrouter-api-key` |
| `AI_GATEWAY_MODEL` | Core API preferred coach model id on OpenRouter (non-secret, default `deepseek/deepseek-v4.1-flash`) |
| `AI_GATEWAY_FALLBACK_MODEL` | Core API model the coach falls back to (non-secret, default the preferred model, i.e. no fallback) |
| `AI_GATEWAY_BASE_URL` | Core API OpenAI-compatible endpoint of the pool (non-secret, default `https://openrouter.ai/api/v1`) |
| `AI_GATEWAY_MAX_OUTPUT_TOKENS` | Core API most tokens one grading may produce (non-secret, default 2048) |
| `JUDGE0_BASE_URL` | Core API origin of the self-hosted Judge0 that runs learner code (owner-provisioned; placeholder until then); unset together with the token means no judge and a run ends as an internal error (PRACTICE_JUDGE_UNAVAILABLE) |
| `JUDGE0_AUTH_TOKEN` | Core API Judge0 auth token sent as `X-Auth-Token` (owner-provided placeholder; never a real value in the repository); the API reads `JUDGE0_AUTH_TOKEN_FILE` |
| `JUDGE0_AUTH_TOKEN_FILE` | Mounted path of the Judge0 token file at `/run/secrets/judge0-auth-token` |
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

Public front-end configuration is supplied at build time and stays outside sealed custody. Replace the generated private placeholder only in `.starcistacks/production/secrets/primary-db-url.enc`, already declared by the manifest. The versioned external database secret is `starci-next-production-primary-db-url-v1`.
