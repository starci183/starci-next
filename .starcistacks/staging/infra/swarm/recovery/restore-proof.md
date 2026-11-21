# Staging recovery record

Status: no restore performed yet.

- `db` (`next-staging-db-data-v3`, a fresh first start; the PostgreSQL 16 volume `next-staging-postgres-data` and its PostgreSQL 17 copy `next-staging-db-data` are kept untouched as the rollback until the release is accepted): the authoritative data (learners, progress, purchases). No backup job runs
  yet: the owner provisions an encrypted off-host dump (`pg_dump` of `starci_next` through `docker exec` on the manager) and records it here.
- `storage` (`next-staging-storage-data`): uploaded objects (avatars, learner uploads); the statics are rebuilt from the storage image.

Staging holds no business data: it is born from the seed levels and may be reset by the owner's decision.
