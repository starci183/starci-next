# type
<!-- @starci/seperator -->
githubUrl
<!-- @starci/seperator -->
# title
<!-- @starci/seperator -->
GitHub Repository Link
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
A public repo with the code (in the language you chose) + a 6-section README whose Smoke Test proves the batch rolled back (row count unchanged) and whose SQL log shows BEGIN → INSERT → ROLLBACK.
<!-- @starci/seperator -->
# score
<!-- @starci/seperator -->
100
<!-- @starci/seperator -->

# outcomeCriterias
## 0
### body
#### 0
##### lang
<!-- @starci/seperator -->
typescript
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**A fully valid batch is created and returns the right shape.** `POST /users/batch` with N distinct, valid users must return HTTP `201` and a body `{ created: N, failed: [] }`. A follow-up `GET /users` must show exactly N more rows than before. Returning a wrong `created` count, a non-empty `failed` for a valid batch, or fewer than N rows persisted → FAIL.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**A fully valid batch is created and returns the right shape.** `POST /users/batch` with N distinct, valid users must return HTTP `201` and a body `{ created: N, failed: [] }`. A follow-up `GET /users` must show exactly N more rows than before. Returning a wrong `created` count, a non-empty `failed` for a valid batch, or fewer than N rows persisted → FAIL.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**A fully valid batch is created and returns the right shape.** `POST /users/batch` with N distinct, valid users must return HTTP `201` and a body `{ created: N, failed: [] }`. A follow-up `GET /users` must show exactly N more rows than before. Returning a wrong `created` count, a non-empty `failed` for a valid batch, or fewer than N rows persisted → FAIL.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**A fully valid batch is created and returns the right shape.** `POST /users/batch` with N distinct, valid users must return HTTP `201` and a body `{ created: N, failed: [] }`. A follow-up `GET /users` must show exactly N more rows than before. Returning a wrong `created` count, a non-empty `failed` for a valid batch, or fewer than N rows persisted → FAIL.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
15
<!-- @starci/seperator -->
### critical
<!-- @starci/seperator -->
false
<!-- @starci/seperator -->
## 1
### body
#### 0
##### lang
<!-- @starci/seperator -->
typescript
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**The failed record is reported with its index and a reason.** When a batch contains a duplicate-email (or otherwise invalid) record, the response body must include `failed: [{ index, reason }]` where `index` is the exact position of the offending record in the submitted array and `reason` is a human-readable cause (e.g. "duplicate email"). A response that reports the wrong index, omits the reason, or returns a generic `500` with no per-record detail → FAIL.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**The failed record is reported with its index and a reason.** When a batch contains a duplicate-email (or otherwise invalid) record, the response body must include `failed: [{ index, reason }]` where `index` is the exact position of the offending record in the submitted list and `reason` is a human-readable cause (e.g. "duplicate email"). A response that reports the wrong index, omits the reason, or returns a generic `500` with no per-record detail → FAIL.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**The failed record is reported with its index and a reason.** When a batch contains a duplicate-email (or otherwise invalid) record, the response body must include `failed: [{ index, reason }]` where `index` is the exact position of the offending record in the submitted array and `reason` is a human-readable cause (e.g. "duplicate email"). A response that reports the wrong index, omits the reason, or returns a generic `500` with no per-record detail → FAIL.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**The failed record is reported with its index and a reason.** When a batch contains a duplicate-email (or otherwise invalid) record, the response body must include `failed: [{ index, reason }]` where `index` is the exact position of the offending record in the submitted slice and `reason` is a human-readable cause (e.g. "duplicate email"). A response that reports the wrong index, omits the reason, or returns a generic `500` with no per-record detail → FAIL.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
15
<!-- @starci/seperator -->
### critical
<!-- @starci/seperator -->
false
<!-- @starci/seperator -->

# approachCriterias
## 0
### body
#### 0
##### lang
<!-- @starci/seperator -->
typescript
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**The whole batch is wrapped in a real database transaction — failure rolls back everything, no partial write and no manual compensation (verified by reading the code + the SQL log).** The submission must open ONE transaction (`dataSource.createQueryRunner()` → `startTransaction()`), insert all records inside it, and `commitTransaction()` only once at the end; on any failure it must `rollbackTransaction()`. Inject failure: a batch where record index 1 duplicates record index 0's email. After that call, `GET /users` (or a `COUNT(*)`) must show ZERO new rows — record 0 must NOT survive. The SQL log must show `START TRANSACTION` → the `INSERT`s → `ROLLBACK` (not `COMMIT`). Grep the code: there must be NO "insert each row in its own commit then DELETE/compensate the already-inserted rows" pattern — that simulates atomicity instead of using the transaction boundary. Any of: record 0 surviving the failed batch, a per-row commit + manual cleanup, or a missing `ROLLBACK` in the log → FAIL (critical → zero for the whole challenge).
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**The whole batch is wrapped in a real database transaction — failure rolls back everything, no partial write and no manual compensation (verified by reading the code + the SQL log).** The batch insert must run inside a single `@Transactional` service method; the violating insert's exception must propagate so Spring rolls the whole transaction back. Inject failure: a batch where record index 1 duplicates record index 0's email. After that call, `GET /users` (or a `COUNT(*)`) must show ZERO new rows — record 0 must NOT survive. The SQL log must show the `INSERT`s followed by a rollback (no `COMMIT`). Grep the code: there must be NO "save each row then DELETE/compensate the already-saved rows" pattern, and no swallowing the exception inside `@Transactional` (which would silently commit). Any of: record 0 surviving the failed batch, per-row commit + manual cleanup, or the exception being swallowed so the transaction commits → FAIL (critical → zero for the whole challenge).
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**The whole batch is wrapped in a real database transaction — failure rolls back everything, no partial write and no manual compensation (verified by reading the code + the SQL log).** The batch insert must run inside ONE `BeginTransactionAsync()` scope, `CommitAsync()` only at the end, and roll back (explicitly or via dispose) on any failure. Inject failure: a batch where record index 1 duplicates record index 0's email. After that call, `GET /users` (or a `COUNT(*)`) must show ZERO new rows — record 0 must NOT survive. The SQL log must show `BEGIN TRANSACTION` → the `INSERT`s → `ROLLBACK` (not `COMMIT`). Grep the code: there must be NO "SaveChanges per row in separate transactions then delete/compensate" pattern. Any of: record 0 surviving the failed batch, per-row commit + manual cleanup, or a missing `ROLLBACK` in the log → FAIL (critical → zero for the whole challenge).
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**The whole batch is wrapped in a real database transaction — failure rolls back everything, no partial write and no manual compensation (verified by reading the code + the SQL log).** The batch insert must run inside `db.Transaction(func(tx *gorm.DB) error { ... })` (or explicit `Begin/Commit/Rollback`); returning an error from the closure must trigger GORM's automatic `ROLLBACK`. Inject failure: a batch where record index 1 duplicates record index 0's email. After that call, `GET /users` (or a `COUNT(*)`) must show ZERO new rows — record 0 must NOT survive. The GORM log must show `BEGIN` → the `INSERT`s → `ROLLBACK` (not `COMMIT`). Grep the code: there must be NO "`db.Create` per row outside a transaction then `db.Delete`/compensate" pattern. Any of: record 0 surviving the failed batch, per-row create + manual cleanup, or a missing `ROLLBACK` in the log → FAIL (critical → zero for the whole challenge).
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
40
<!-- @starci/seperator -->
### critical
<!-- @starci/seperator -->
true
<!-- @starci/seperator -->
## 1
### body
#### 0
##### lang
<!-- @starci/seperator -->
typescript
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Duplicate detection is enforced by a database-level UNIQUE constraint, not an in-memory pre-check, and the controller/service split + evidence hold (verified by reading the code + README).** The `email` column must carry a real `UNIQUE` constraint/index in the schema (migration or entity metadata) — the duplicate must be caught by the DB raising a violation, NOT by a JavaScript `Set`/`Array.some` scan before insert. The controller only routes; the QueryRunner/transaction lives in the service. README has all 6 sections (Challenge description, How to run, Architecture/Stack, Smoke Test, Code Execution Trace, Design Decisions) and pastes REAL response + SQL log. Catching duplicates purely in memory (no DB unique index), the controller owning the transaction, or fabricated logs → FAIL.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Duplicate detection is enforced by a database-level UNIQUE constraint, not an in-memory pre-check, and the controller/service split + evidence hold (verified by reading the code + README).** The `email` column must carry a real `UNIQUE` constraint/index in the schema (`@Column(unique = true)` reflected in the DDL) — the duplicate must surface as `DataIntegrityViolationException` from the DB, NOT from a `Stream`/`Set` scan before save. The controller only routes; the `@Transactional` insert lives in the service. README has all 6 sections and pastes REAL response + SQL log. Catching duplicates purely in memory (no DB unique index), the controller owning the transaction, or fabricated logs → FAIL.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Duplicate detection is enforced by a database-level UNIQUE constraint, not an in-memory pre-check, and the handler/service split + evidence hold (verified by reading the code + README).** The `Email` column must carry a real unique index (`HasIndex(...).IsUnique()` reflected in the migration) — the duplicate must surface as `DbUpdateException` from the DB, NOT from a LINQ/`HashSet` scan before `SaveChanges`. The endpoint only routes; the transaction lives in the service. README has all 6 sections and pastes REAL response + SQL log. Catching duplicates purely in memory (no DB unique index), the endpoint owning the transaction, or fabricated logs → FAIL.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Duplicate detection is enforced by a database-level UNIQUE constraint, not an in-memory pre-check, and the handler/service split + evidence hold (verified by reading the code + README).** The `email` column must carry a real `uniqueIndex` (`gorm:"uniqueIndex"` reflected in the migrated schema) — the duplicate must surface as an error from `tx.Create`, NOT from a `map[string]bool` scan before insert. The handler only routes; the `db.Transaction` lives in the service. README has all 6 sections and pastes REAL response + SQL log. Catching duplicates purely in memory (no DB unique index), the handler owning the transaction, or fabricated logs → FAIL.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
30
<!-- @starci/seperator -->
### critical
<!-- @starci/seperator -->
false
<!-- @starci/seperator -->
