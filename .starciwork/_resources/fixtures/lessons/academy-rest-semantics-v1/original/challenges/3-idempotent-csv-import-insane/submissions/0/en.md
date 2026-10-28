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
A public repo with the code (in the language you chose) + a 6-section README whose Smoke Test proves: the job reaches done with per-row errors, and resending the same Idempotency-Key returns the old jobId while the user count stays unchanged.
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
**The endpoint returns 202 + jobId immediately and the job completes asynchronously.** `POST /users/import` with a CSV file + an `Idempotency-Key` header must return HTTP `202` and `{ jobId }` without waiting for the import to finish. Polling `GET /users/import/{jobId}` must eventually reach `status: "done"` with `processed`/`total` reflecting the file. Returning `200`/`201` synchronously after the whole import (no async), or a `GET` that never reaches a terminal status → FAIL.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**The endpoint returns 202 + jobId immediately and the job completes asynchronously.** `POST /users/import` with a CSV file + an `Idempotency-Key` header must return HTTP `202` and `{ jobId }` without waiting for the import to finish. Polling `GET /users/import/{jobId}` must eventually reach `status: "done"` with `processed`/`total` reflecting the file. Returning `200`/`201` synchronously after the whole import (no async), or a `GET` that never reaches a terminal status → FAIL.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**The endpoint returns 202 + jobId immediately and the job completes asynchronously.** `POST /users/import` with a CSV file + an `Idempotency-Key` header must return HTTP `202` and `{ jobId }` without waiting for the import to finish. Polling `GET /users/import/{jobId}` must eventually reach `status: "done"` with `processed`/`total` reflecting the file. Returning `200`/`201` synchronously after the whole import (no async), or a `GET` that never reaches a terminal status → FAIL.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**The endpoint returns 202 + jobId immediately and the job completes asynchronously.** `POST /users/import` with a CSV file + an `Idempotency-Key` header must return HTTP `202` and `{ jobId }` without waiting for the import to finish. Polling `GET /users/import/{jobId}` must eventually reach `status: "done"` with `processed`/`total` reflecting the file. Returning `200`/`201` synchronously after the whole import (no async), or a `GET` that never reaches a terminal status → FAIL.
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
**Partial success: bad rows are reported per-row while valid rows are still inserted.** With a file containing at least one invalid row (missing email / bad format), the finished job must report `errors: [{ row, reason }]` for each bad row AND still have inserted every valid row — `GET /users` count must increase by exactly the number of valid rows. A single bad row aborting the whole import (zero rows inserted), or `errors` missing the offending row number → FAIL. (This partial-success behavior is intentionally the OPPOSITE of the hard challenge's all-or-nothing rollback.)
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Partial success: bad rows are reported per-row while valid rows are still inserted.** With a file containing at least one invalid row (missing email / bad format), the finished job must report `errors: [{ row, reason }]` for each bad row AND still have inserted every valid row — `GET /users` count must increase by exactly the number of valid rows. A single bad row aborting the whole import (zero rows inserted), or `errors` missing the offending row number → FAIL. (This partial-success behavior is intentionally the OPPOSITE of the hard challenge's all-or-nothing rollback.)
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Partial success: bad rows are reported per-row while valid rows are still inserted.** With a file containing at least one invalid row (missing email / bad format), the finished job must report `errors: [{ row, reason }]` for each bad row AND still have inserted every valid row — `GET /users` count must increase by exactly the number of valid rows. A single bad row aborting the whole import (zero rows inserted), or `errors` missing the offending row number → FAIL. (This partial-success behavior is intentionally the OPPOSITE of the hard challenge's all-or-nothing rollback.)
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Partial success: bad rows are reported per-row while valid rows are still inserted.** With a file containing at least one invalid row (missing email / bad format), the finished job must report `errors: [{ row, reason }]` for each bad row AND still have inserted every valid row — `GET /users` count must increase by exactly the number of valid rows. A single bad row aborting the whole import (zero rows inserted), or `errors` missing the offending row number → FAIL. (This partial-success behavior is intentionally the OPPOSITE of the hard challenge's all-or-nothing rollback.)
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
**Idempotency is enforced via Redis (restart-safe) so the same key never double-inserts — verified by reading the code + a row-count diff.** The `Idempotency-Key → result` mapping must be stored in Redis with an atomic check-and-set (`SET key value NX EX`), NOT in a process-local `Map`/object. Inject the test: import a ≥200-row file with `Idempotency-Key: imp-001`, wait for `done`, record `GET /users` count C1; resend the EXACT same key + file, wait, record count C2 — C2 must equal C1 (zero new rows) and the second response must carry the SAME `jobId` as the first. Grep the code: the idempotency store must be a Redis client call, not an in-memory collection; and the resend path must short-circuit BEFORE any DB insert. Any of: C2 > C1 (duplicate insert on resend), a new `jobId` on resend, or the idempotency state living in an in-memory map (lost on restart) → FAIL (critical → zero for the whole challenge).
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Idempotency is enforced via Redis (restart-safe) so the same key never double-inserts — verified by reading the code + a row-count diff.** The `Idempotency-Key → result` mapping must be stored in Redis with an atomic check-and-set (`setIfAbsent` = `SET NX EX`), NOT in a process-local `ConcurrentHashMap`. Inject the test: import a ≥200-row file with `Idempotency-Key: imp-001`, wait for `done`, record `GET /users` count C1; resend the EXACT same key + file, wait, record count C2 — C2 must equal C1 (zero new rows) and the second response must carry the SAME `jobId` as the first. Grep the code: the idempotency store must be a `RedisTemplate`/Lettuce call, not an in-memory collection; and the resend path must short-circuit BEFORE any DB insert. Any of: C2 > C1 (duplicate insert on resend), a new `jobId` on resend, or the idempotency state living in an in-memory map (lost on restart) → FAIL (critical → zero for the whole challenge).
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Idempotency is enforced via Redis (restart-safe) so the same key never double-inserts — verified by reading the code + a row-count diff.** The `Idempotency-Key → result` mapping must be stored in Redis with an atomic check-and-set (`StringSet(..., When.NotExists)` = `SET NX EX`), NOT in a process-local `ConcurrentDictionary`. Inject the test: import a ≥200-row file with `Idempotency-Key: imp-001`, wait for `done`, record `GET /users` count C1; resend the EXACT same key + file, wait, record count C2 — C2 must equal C1 (zero new rows) and the second response must carry the SAME `jobId` as the first. Grep the code: the idempotency store must be a `StackExchange.Redis`/`IDistributedCache` (Redis) call, not an in-memory collection; and the resend path must short-circuit BEFORE any DB insert. Any of: C2 > C1 (duplicate insert on resend), a new `jobId` on resend, or the idempotency state living in an in-memory dictionary (lost on restart) → FAIL (critical → zero for the whole challenge).
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Idempotency is enforced via Redis (restart-safe) so the same key never double-inserts — verified by reading the code + a row-count diff.** The `Idempotency-Key → result` mapping must be stored in Redis with an atomic check-and-set (`SetNX` = `SET NX EX`), NOT in a process-local mutex-guarded `map`. Inject the test: import a ≥200-row file with `Idempotency-Key: imp-001`, wait for `done`, record `GET /users` count C1; resend the EXACT same key + file, wait, record count C2 — C2 must equal C1 (zero new rows) and the second response must carry the SAME `jobId` as the first. Grep the code: the idempotency store must be a `go-redis` call, not an in-memory map; and the resend path must short-circuit BEFORE any DB insert. Any of: C2 > C1 (duplicate insert on resend), a new `jobId` on resend, or the idempotency state living in an in-memory map (lost on restart) → FAIL (critical → zero for the whole challenge).
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
**Large files are streamed in chunks (not loaded whole) and the async/poll contract + evidence hold (verified by reading the code + README).** The CSV must be read with a streaming parser and inserted in bounded chunks (e.g. 500 rows) — there must be NO `fs.readFileSync` + `JSON`/array of all rows materialized in memory before insert, and `processed` must advance per chunk (observable by polling mid-import). The HTTP layer only routes; the queue/worker owns the processing. README has all 6 sections (Challenge description, How to run, Architecture/Stack, Smoke Test, Code Execution Trace, Design Decisions) and pastes REAL `202` response, poll snapshots, and the two `GET /users` counts. Reading the entire file into memory at once, `processed` jumping straight from 0 to total, or fabricated evidence → FAIL.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Large files are streamed in chunks (not loaded whole) and the async/poll contract + evidence hold (verified by reading the code + README).** The CSV must be read with a streaming/iterator parser and inserted in bounded chunks (e.g. 500 rows with `saveAll` + flush/clear) — there must be NO reading of all rows into a single `List` before insert, and `processed` must advance per chunk (observable by polling mid-import). The HTTP layer only routes; the `@Async` worker owns the processing. README has all 6 sections and pastes REAL `202` response, poll snapshots, and the two `GET /users` counts. Reading the entire file into memory at once, `processed` jumping straight from 0 to total, or fabricated evidence → FAIL.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Large files are streamed in chunks (not loaded whole) and the async/poll contract + evidence hold (verified by reading the code + README).** The CSV must be read with `CsvHelper`'s lazy `GetRecords` and inserted in bounded chunks (e.g. 500 rows with `AddRange` + `SaveChanges`) — there must be NO `ToList()` of all records before insert, and `processed` must advance per chunk (observable by polling mid-import). The HTTP layer only routes; the `BackgroundService` owns the processing. README has all 6 sections and pastes REAL `202` response, poll snapshots, and the two `GET /users` counts. Reading the entire file into memory at once, `processed` jumping straight from 0 to total, or fabricated evidence → FAIL.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Large files are streamed in chunks (not loaded whole) and the async/poll contract + evidence hold (verified by reading the code + README).** The CSV must be read with `csv.Reader.Read()` row by row and inserted in bounded chunks (e.g. 500 rows with `CreateInBatches`) — there must be NO `csv.ReadAll()` materializing every row before insert, and `processed` must advance per chunk (observable by polling mid-import). The HTTP layer only routes; the worker goroutine owns the processing. README has all 6 sections and pastes REAL `202` response, poll snapshots, and the two `GET /users` counts. Reading the entire file into memory at once, `processed` jumping straight from 0 to total, or fabricated evidence → FAIL.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
30
<!-- @starci/seperator -->
### critical
<!-- @starci/seperator -->
false
<!-- @starci/seperator -->
