# Production environment key roster

Names and consumers only; every value is fresh for this environment, sealed under `.starcistacks/production/secrets/` to the owner key and the server key
of sv-hk-1 (`.sops.yaml`, rule `production`), and reaches a container as a versioned Swarm secret mounted at `/run/secrets/<KEY>` (the core and the cli read `<KEY>_FILE`).

| Member | Key | Consumer |
| --- | --- | --- |
| `db` | `POSTGRES_PASSWORD` | postgres: the superuser password (`POSTGRES_PASSWORD_FILE`) |
| `db` | `DB_OWNER_PASSWORD` | postgres: the first start gives the role `starci_next` (owner of the database `starci_next`) this password |
| `db` | `KEYCLOAK_DB_PASSWORD` | postgres (the role `keycloak`) and keycloak (`KC_DB_PASSWORD`) |
| `db` | `PRIMARY_DB_URL` | core and cli: `starci_next` on `next-production-postgres:5432/starci_next` |
| `keycloak-client-secret` | `IDENTITY_KEYCLOAK_CLIENT_SECRET` | core (the confidential client) and keycloak (the realm import) |
| `identity-session-encryption-key` | `IDENTITY_SESSION_ENCRYPTION_KEY` | core: the session sealing key |
| `keycloak` | `KEYCLOAK_TLS_CERT`, `KEYCLOAK_TLS_KEY` | keycloak (its https pair); core trusts the certificate (`HTTP_TRUSTED_CA_FILE`) |
| `relay` | `RELAY_MANIFEST_SIGNING_KEY` | core: the Ed25519 key (PKCS8 PEM) that signs learner task manifests |
| `storage` | `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY` | core (S3 client) and storage (MinIO root, `MINIO_ROOT_*_FILE`) |
| `vps` | `VPS_HOST`, `VPS_USER`, `privateKey`, `knownHosts` | the operator's deploy transport (`deploy.remote.sealed`); never granted |

Not provisioned (owner-provided values; until then the feature is off or refused, typed): SMTP (`MAIL_HOST` is a placeholder: sign-up and reset
codes cannot be mailed), payOS and SePay (no rail declared: no checkout), the AI coach (`OPENROUTER_API_KEY`: written answers are saved ungraded),
Judge0 (code runs end as `PRACTICE_JUDGE_UNAVAILABLE`), Qdrant and the embeddings service (MCP search answers by keywords).

Plain configuration (hosts, ports, bucket) is `environments.production.deploy.environment` of `application-stacks.yaml`; the app's public values are its
image build values (`deploy.images.app.buildArgs`).
