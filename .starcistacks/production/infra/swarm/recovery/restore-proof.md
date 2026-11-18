# Production recovery record

Status: no restore performed yet.

- `postgres` (`next-production-postgres-data`): the authoritative data (learners, progress, purchases, and Keycloak's database). No backup job runs
  yet: the owner provisions an encrypted off-host dump (`pg_dump` of `starci_next` and `keycloak` through `docker exec` on the manager) and records it here.
- `storage` (`next-production-storage-data`): uploaded objects (avatars, learner uploads); the statics are rebuilt from the storage image.

Before relying on recovery, restore a dump and a volume snapshot into isolated infrastructure and attach the dated result here.
