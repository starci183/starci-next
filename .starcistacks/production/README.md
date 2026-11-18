# Production stack (sv-hk-1)

`next-production` runs on sv-hk-1 (103.130.216.216), a one-manager Docker Swarm on a shared DirectAdmin hosting box. The stack touches nothing of the
hosting: its services sit on its own overlay `app`, and the three public ones also join the shared external network `edge`, where `edge-traefik`
(103.130.216.201:80/443, resolver `cf`) routes the hosts declared in `environments.production.ingress.hosts`:

| Host | Service |
| --- | --- |
| https://next.starci.org | app (Next standalone, 3000); `/api/*`, `/graphql`, `/mcp` and `/socket.io/*` go to core (3001) |
| https://api.next.starci.org | core (3001): MCP, the learner CLI, payment webhooks |
| https://minio.next.starci.org | storage, the S3 port only (9000); statics are public-read under `starci-next-production/statics` |

`postgres` (PostgreSQL 16: the databases `starci_next` and `keycloak`), `keycloak` (production mode, https on the overlay only) and `storage`
(MinIO) keep their data on `next-production-postgres-data` and `next-production-storage-data`; no port is published. `cli` applies the TypeORM migrations when
its task starts and idles for `stack task`. The landing site is not deployed (no host is declared for it). Every service has CPU and memory limits.

The operator reaches the manager as `deploy-next` through the sealed member `vps` (the host listens on SSH port 9999: the operator machine's
`~/.ssh/config` maps `Host 103.130.216.216` to `Port 9999`, and `Host sv-hk-1-next` to the same key for the docker transport (`ssh://sv-hk-1-next`)).

| Operation | Command | Acceptance |
| --- | --- | --- |
| prepare | `starci app stack prepare --env production --execute` | every check `ok`: swarm manager, the two volumes, `/srv/next-production` writable |
| doctor | `starci app stack doctor --env production`; `starci app stack render --env production --image ... --sha ...` | read-only; names and counts only |
| up | tag the commit (`v<version>`), `starci app stack build --env production --push --execute`, then `starci app stack deploy --env production --image <svc>=<ref>@sha256:<digest> ... --sha <sha> --execute` | render, provision, converge (the cli task migrates first), post-deploy `migrate` (a no-op receipt), verify, accept |
| status | `starci app stack status --env production`; `starci app stack converge --env production --since <ISO time>` | desired equals running, no failed task, the release pointer on the manager |
| logs | `docker service logs --since 10m --tail 200 next-production_core` on the manager as `deploy-next` | bounded; never print environment or secrets |
| down | owner decision only: `docker stack rm next-production` | never removes volumes, secrets of other stacks or the edge |
| verification | `starci app stack verify --env production` | core `/health/live` and `/health/ready`, the app home, the cookie door and the device socket through the app host, all over TLS |

Data: production is born from the seed levels production applies (`production/seeds`, empty today); the product content set `content` is declared for dev only, so production starts empty (no lessons) until the owner declares it for production. It never receives a copy of another environment's data.
Backups: `infra/swarm/recovery/restore-proof.md`. Prerequisites and receipts: `infra/swarm/owner-actions.md`. Keys: `runtime/env/KEYS.md`.
