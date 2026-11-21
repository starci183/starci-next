# Staging stack (sv-hk-1)

`next-staging` runs on sv-hk-1 (103.130.216.216), a one-manager Docker Swarm on a shared DirectAdmin hosting box. The stack touches nothing of the
hosting: its services sit on its own overlay `app`, and the three public ones also join the shared external network `edge`, where `edge-traefik`
(103.130.216.201:80/443, resolver `cf`) routes the hosts declared in `environments.staging.ingress.hosts`:

| Host | Service |
| --- | --- |
| https://next.staging.starci.org | app (Next standalone, 3000); `/api/*`, `/graphql`, `/mcp` and `/socket.io/*` go to core (3001) |
| https://api.next.staging.starci.org | core (3001): MCP, the learner CLI, payment webhooks |
| https://minio.next.staging.starci.org | storage, the S3 port only (9000); statics are public-read under `starci-next-staging/statics` |

`db` (the app's own PostgreSQL 17 with pgvector and pgmq, the database `starci_next`), `redis` (the BullMQ queue, AOF) and `storage`
(MinIO) keep their data on `next-staging-db-data-v4` (a fresh first start; the PostgreSQL 16 volume `next-staging-postgres-data` and its copy `next-staging-db-data` are left untouched for rollback), `next-staging-redis-data` and `next-staging-storage-data`; no port is published. `starci app db migrate` applies db/migrations/*.sql at deploy; `cli` idles for `stack task`. The landing site is not deployed (no host is declared for it). Every service has CPU and memory limits.

The operator reaches the manager as `deploy-next` through the sealed member `vps`: the host listens on SSH port 9999, the member carries the port, and the harness's sealed transport passes the port, the key and the pinned host keys to ssh explicitly, so no `--ssh-cmd`, docker host override or `~/.ssh/config` alias is needed.

| Operation | Command | Acceptance |
| --- | --- | --- |
| prepare | `starci app stack prepare --env staging --execute` | every check `ok`: swarm manager, the two volumes, `/srv/next-staging` writable |
| doctor | `starci app stack doctor --env staging`; `starci app stack render --env staging --image ... --sha ...` | read-only; names and counts only |
| up | tag the commit (`v<version>`), `starci app stack build --env staging --push --execute`, then `starci app stack deploy --env staging --image <svc>=<ref>@sha256:<digest> ... --sha <sha> --execute` | render, provision, converge (the cli task migrates first), post-deploy `migrate` (a no-op receipt), verify, accept |
| status | `starci app stack status --env staging`; `starci app stack converge --env staging --since <ISO time>` | desired equals running, no failed task, the release pointer on the manager |
| logs | `docker service logs --since 10m --tail 200 next-staging_core` on the manager as `deploy-next` | bounded; never print environment or secrets |
| down | owner decision only: `docker stack rm next-staging` | never removes volumes, secrets of other stacks or the edge |
| verification | `starci app stack verify --env staging` | core `/health/live` and `/health/ready`, the app home, the cookie door and the device socket through the app host, all over TLS |

Data: staging is born from the seed levels a non-production environment applies (the shared level and `staging/seeds`, both empty today); the product content set `content` is declared for dev only, so staging starts without lessons until the owner adds it to that set's environments. It never receives a copy of another environment's data.
Backups: `infra/swarm/recovery/restore-proof.md`. Prerequisites and receipts: `infra/swarm/owner-actions.md`. Keys: `runtime/env/KEYS.md`.
