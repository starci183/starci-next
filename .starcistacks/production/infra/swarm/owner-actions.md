# Production prerequisite record

## DNS

Zone `starci.org` on Cloudflare. A records, not proxied, each to `103.130.216.201` (the IP `edge-traefik` owns on sv-hk-1): `next.starci.org`,
`api.next.starci.org`, `minio.next.starci.org`. Created 2026-11-19 through the Cloudflare API by the lane deploy-next-sv-hk-1.

## TLS

The shared `edge-traefik` (Traefik v3.1, plain `docker run`, swarm provider on network `edge`) issues and renews the certificates with its resolver
`cf` (ACME DNS-01 on Cloudflare); this stack only declares the routers. The access tokens are signed by the app itself (member `auth`, `AUTH_JWT_PRIVATE_KEY`; rotation: a new key, sealed, redeployed).

## Server

sv-hk-1 (103.130.216.216, SSH 9999) is shared hosting (DirectAdmin) and a one-manager swarm. This environment uses only: the user `deploy-next`
(key only, docker group, no sudo; shared by staging and production of starci-next), `/srv/next-production` (made by root, owned by deploy-next), the stack
`next-production`, its two volumes, its versioned secrets and configs, and the server identity `/root/.config/sops/age/keys.txt` (the recipient
`deploy.remote.serverRecipient`, shared by the tenants of the box). Nothing of DirectAdmin, its web servers, MariaDB, mail, DNS, CSF or the host
PostgreSQL is used.

## Secrets to provision before the first deploy of the one-edition shape

Sealed to the `production` rule of .sops.yaml (the owner key and the sv-hk-1 server key); this lane did not touch any production custody.

- Member `db`: re-seal `PRIMARY_DB_URL` so the core and the cli connect as `app_be` (it needs the real db passwords). Sealed already (owner approved, generated in memory and never printed, sealed to the server public recipient only): member `auth` (`AUTH_JWT_PRIVATE_KEY`). **Server-side re-seal list:** `db` `DB_APP_PASSWORD` (the role app_be password) is NOT in the repo's `db.enc.yaml`: the owner adds it when re-sealing the `db` member on the server, together with `PRIMARY_DB_URL` for app_be.
- The Keycloak members (`keycloak`, `keycloak-client-secret`, `identity-session-encryption-key`) are deleted from the repo and no longer declared; a rollback uses the stored release record and its versioned Swarm secrets, not these files (git history keeps the deleted ciphertext). Still inside the `db` member: `KEYCLOAK_DB_PASSWORD`, which goes when the owner re-seals that member (`starci app secret unset --env production db KEYCLOAK_DB_PASSWORD`).
- A mail member for SMTP (sign-up, verification and reset mails are sent by the app).
