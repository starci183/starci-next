# Production prerequisite record

## DNS

Zone `starci.org` on Cloudflare. A records, not proxied, each to `103.130.216.201` (the IP `edge-traefik` owns on sv-hk-1): `next.starci.org`,
`api.next.starci.org`, `minio.next.starci.org`. Created 2026-11-19 through the Cloudflare API by the lane deploy-next-sv-hk-1.

## TLS

The shared `edge-traefik` (Traefik v3.1, plain `docker run`, swarm provider on network `edge`) issues and renews the certificates with its resolver
`cf` (ACME DNS-01 on Cloudflare); this stack only declares the routers. Keycloak's internal https certificate is self-signed per environment and
sealed in the member `keycloak` (rotation: a new pair, sealed, redeployed).

## Server

sv-hk-1 (103.130.216.216, SSH 9999) is shared hosting (DirectAdmin) and a one-manager swarm. This environment uses only: the user `deploy-next`
(key only, docker group, no sudo; shared by staging and production of starci-next), `/srv/next-production` (made by root, owned by deploy-next), the stack
`next-production`, its two volumes, its versioned secrets and configs, and the server identity `/root/.config/sops/age/keys.txt` (the recipient
`deploy.remote.serverRecipient`, shared by the tenants of the box). Nothing of DirectAdmin, its web servers, MariaDB, mail, DNS, CSF or the host
PostgreSQL is used.
