# Production recovery record

Status: no restore performed yet.

- `db` (`next-production-db-data-v2`, a fresh first start; the PostgreSQL 16 volume `next-production-postgres-data` is kept untouched as the rollback, and the encrypted dumps of 2026-11-22 are kept off the host): the authoritative data (learners, progress, purchases). No backup job runs
  yet: the owner provisions an encrypted off-host dump (`pg_dump` of `starci_next` through `docker exec` on the manager) and records it here.
- `storage` (`next-production-storage-data`): uploaded objects (avatars, learner uploads); the statics are rebuilt from the storage image.

Before relying on recovery, restore a dump and a volume snapshot into isolated infrastructure and attach the dated result here.
