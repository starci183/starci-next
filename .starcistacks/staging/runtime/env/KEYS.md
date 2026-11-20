# Staging environment key roster

Names and consumers only; every value is fresh for this environment, sealed under `.starcistacks/staging/secrets/` to the owner key and the server key
of sv-hk-1 (`.sops.yaml`, rule `staging`), and reaches a container as a versioned Swarm secret mounted at `/run/secrets/<KEY>` (the core and the cli read `<KEY>_FILE`).

| Member | Key | Consumer |
| --- | --- | --- |
| `db` | `POSTGRES_PASSWORD` | db (PostgreSQL 17 with pgvector and pgmq): the superuser password (`POSTGRES_PASSWORD_FILE`) |
| `db` | `DB_APP_PASSWORD` | db: the password of the role `app_be` the migrations create; core and cli connect as it |
| `db` | `DB_OWNER_PASSWORD` | postgres: the first start gives the role `starci_next` (owner of the database `starci_next`) this password |
| `db` | `PRIMARY_DB_URL` | core and cli: the role `app_be` on `next-staging-postgres:5432/starci_next` |
| `auth` | `AUTH_JWT_PRIVATE_KEY` | core: the Ed25519 PEM (passport kit) the access tokens are signed with; the JWKS publishes its public half |
| `relay` | `RELAY_MANIFEST_SIGNING_KEY` | core: the Ed25519 key (PKCS8 PEM) that signs learner task manifests |
| `storage` | `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY` | core (S3 client) and storage (MinIO root, `MINIO_ROOT_*_FILE`) |
| `vps` | `VPS_HOST`, `VPS_USER`, `privateKey`, `knownHosts` | the operator's deploy transport (`deploy.remote.sealed`); never granted |

Plain (unsealed) core env that sits beside these members: `AUTH_COOKIE_NAME` (the refresh cookie name, `starci_next_refresh`, so the other app on the shared starci.org hosts cannot overwrite it) and `AUTH_COOKIE_DOMAIN`, declared in application-stacks.yaml.

Not provisioned (owner-provided values; until then the feature is off or refused, typed): SMTP (`MAIL_HOST` is a placeholder: sign-up and reset
codes cannot be mailed), payOS and SePay (no rail declared: no checkout), the AI coach (`OPENROUTER_API_KEY`: written answers are saved ungraded),
Judge0 (code runs end as `PRACTICE_JUDGE_UNAVAILABLE`), Qdrant and the embeddings service (MCP search answers by keywords).

Plain configuration (hosts, ports, bucket) is `environments.staging.deploy.environment` of `application-stacks.yaml`; the app's public values are its
image build values (`deploy.images.app.buildArgs`).

Google sign-in is not configured in : GOOGLE_CLIENT_ID, GOOGLE_CALLBACK_URL and the member google (GOOGLE_CLIENT_SECRET) are deliberately absent, and the front end is built with NEXT_PUBLIC_AUTH_GOOGLE=false; adding them later turns it on.
