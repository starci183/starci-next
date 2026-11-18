# Staging recovery record

Status: no restore performed yet.

- `postgres` (`next-staging-postgres-data`): the authoritative data (learners, progress, purchases, and Keycloak's database). No backup job runs
  yet: the owner provisions an encrypted off-host dump (`pg_dump` of `starci_next` and `keycloak` through `docker exec` on the manager) and records it here.
- `storage` (`next-staging-storage-data`): uploaded objects (avatars, learner uploads); the statics are rebuilt from the storage image.

Staging holds no business data: it is born from the seed levels and may be reset by the owner's decision.
