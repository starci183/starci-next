# Development stack

The development Docker Compose model contains the core API, the product and landing front ends, and a pinned local PostgreSQL database. Trust authentication is confined to this local, unpublished database.
Starter release images and external secrets must be prepared before starting the container model. Local source development remains available through the app scripts.

| Command | Operation |
| --- | --- |
| prepare | `starci app stack prepare --env dev --execute`: builds the app images and provides the local database connection through sealed custody. |
| doctor | `starci app stack doctor --env dev`: read-only table of host prerequisites, custody, compose render and ports. |
| up | `starci app stack up --env dev --execute`: prepare, then the services, the database role, the seed levels and readiness; prints the origins. |
| status | `starci app stack status --env dev`: desired against running and every readiness probe. |
| logs | `starci app stack logs --env dev --service core`: bounded and redacted; never prints mounted credentials. |
| down | `starci app stack down --env dev --execute`: stops the compose project; volumes and sealed values stay. |
| verification | `starci app stack verify --env dev`: the API `/health/live` and `/health/ready` probes, then `npm run lint` from the app root. |

Keep real sealed members under `.starcistacks/dev/secrets/*.enc`, add them to the manifest after sealing and inventory their key names in the environment record. The scaffold creates no fake secret or successful proof.
