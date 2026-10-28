# sortIndex
<!-- @starci/seperator -->
4
<!-- @starci/seperator -->
# title
<!-- @starci/seperator -->
Asynchronous, idempotent CSV import with an Idempotency-Key and chunked processing
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
Build `POST /users/import` that accepts a CSV file upload + an `Idempotency-Key` header, returns `202 Accepted` + `{ jobId }`, and processes asynchronously in chunks; the client polls `GET /users/import/{jobId}` for progress (`{ status, processed, total, errors }`). Resending the SAME `Idempotency-Key` must return the cached result from Redis and insert nothing twice. Pick your language; every language returns the same contract output.
<!-- @starci/seperator -->
# requirements
## 0
### langs
#### 0
##### lang
<!-- @starci/seperator -->
typescript
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Accept the upload and return 202 + jobId immediately, process asynchronously
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

`POST /users/import` does not process synchronously inside the request — it only records a job and returns `202 Accepted` + `{ jobId }` right away, letting the import run in the background. This is the standard pattern for long-running work (large files) to avoid holding the HTTP connection open too long.

:::muted
Technical constraints
:::

- `POST /users/import` accepts `multipart/form-data` containing a CSV file (columns `name,email`) + a required `Idempotency-Key` header; a missing key or file → 400.
- The endpoint must return 202 Accepted + body `{ jobId }` IMMEDIATELY, WITHOUT waiting for parsing/inserting to finish.
- Parsing + inserting runs on a background worker/queue, NOT blocking the request handler's event loop.
- `GET /users/import/{jobId}` returns `{ status, processed, total, errors }` with `status ∈ { queued, processing, done, failed }`.

:::muted
Hints
:::

Use BullMQ (`Queue` + `Worker` over ioredis) for the background job; `@Post("import")` only `queue.add(...)` then `return { jobId }` with `@HttpCode(202)`. Read the file via `@UseInterceptors(FileInterceptor("file"))`.
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
30
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Accept the upload and return 202 + jobId immediately, process asynchronously
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

`POST /users/import` does not process synchronously inside the request — it only records a job and returns `202 Accepted` + `{ jobId }` right away, letting the import run in the background. This is the standard pattern for long-running work (large files) to avoid holding the HTTP connection open too long.

:::muted
Technical constraints
:::

- `POST /users/import` accepts `multipart/form-data` containing a CSV file (columns `name,email`) + a required `Idempotency-Key` header; a missing key or file → 400.
- The endpoint must return 202 Accepted + body `{ jobId }` IMMEDIATELY, WITHOUT waiting for parsing/inserting to finish.
- Parsing + inserting runs on a background thread/task (`@Async` or an executor), NOT blocking the request thread.
- `GET /users/import/{jobId}` returns `{ status, processed, total, errors }` with `status ∈ { queued, processing, done, failed }`.

:::muted
Hints
:::

Use `@Async` (enable `@EnableAsync`) for the import method; the `@PostMapping` controller accepts `@RequestParam MultipartFile file` + `@RequestHeader("Idempotency-Key")`, calls the async service, then returns `ResponseEntity.accepted().body(...)`.
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
30
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Accept the upload and return 202 + jobId immediately, process asynchronously
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

`POST /users/import` does not process synchronously inside the request — it only records a job and returns `202 Accepted` + `{ jobId }` right away, letting the import run in the background. This is the standard pattern for long-running work (large files) to avoid holding the HTTP connection open too long.

:::muted
Technical constraints
:::

- `POST /users/import` accepts `multipart/form-data` containing a CSV file (columns `name,email`) + a required `Idempotency-Key` header; a missing key or file → 400.
- The endpoint must return 202 Accepted (`Results.Accepted(...)`) + body `{ jobId }` IMMEDIATELY, WITHOUT waiting for parsing/inserting to finish.
- Parsing + inserting runs on a background service (`IHostedService`/`BackgroundService` + a queue, or Hangfire), NOT blocking the request.
- `GET /users/import/{jobId}` returns `{ status, processed, total, errors }` with `status ∈ { queued, processing, done, failed }`.

:::muted
Hints
:::

Use a `BackgroundService` reading jobs from a `Channel<ImportJob>`, or Hangfire `BackgroundJob.Enqueue`. The endpoint accepts `IFormFile file` + `Request.Headers["Idempotency-Key"]`, enqueues, then `return Results.Accepted($"/users/import/{jobId}", new { jobId });`.
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
30
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Accept the upload and return 202 + jobId immediately, process asynchronously
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

`POST /users/import` does not process synchronously inside the request — it only records a job and returns `202 Accepted` + `{ jobId }` right away, letting the import run in the background. This is the standard pattern for long-running work (large files) to avoid holding the HTTP connection open too long.

:::muted
Technical constraints
:::

- `POST /users/import` accepts `multipart/form-data` containing a CSV file (columns `name,email`) + a required `Idempotency-Key` header; a missing key or file → 400.
- The endpoint must return 202 Accepted (`c.JSON(http.StatusAccepted, ...)`) + body `{ jobId }` IMMEDIATELY, WITHOUT waiting for parsing/inserting to finish.
- Parsing + inserting runs on a background goroutine (job sent over a channel to a worker), NOT blocking the handler.
- `GET /users/import/{jobId}` returns `{ status, processed, total, errors }` with `status ∈ { queued, processing, done, failed }`.

:::muted
Hints
:::

Read the file via `c.FormFile("file")` + `c.GetHeader("Idempotency-Key")`. Start a worker pool reading from a `chan ImportJob`; the handler pushes the job to the channel then returns immediately. CAREFUL: copy the file content into a buffer before the handler returns (the original file is closed after the request).
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
30
<!-- @starci/seperator -->
## 1
### langs
#### 0
##### lang
<!-- @starci/seperator -->
typescript
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Idempotency via Redis + chunked processing + per-row error reporting
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

Guarantee that resending the SAME `Idempotency-Key` never inserts duplicates — the first call's result is stored in Redis and the next one returns it verbatim. Large files are processed in chunks (streamed), and each bad row is recorded individually without failing the whole job (partial-success for an import).

:::muted
Technical constraints
:::

- `Idempotency-Key → result` must be stored in Redis (restart-safe), FORBIDDEN to store it in a process-local `Map`/in-memory variable.
- First send of a key: create the job, process it, store the result (`jobId` + summary) in Redis under that key (with a TTL).
- Resend with the SAME key: detect the key already exists in Redis → return the cached result (same `jobId`/summary), do NOT re-parse, do NOT insert any more rows.
- The file must be read/inserted in chunks (e.g. 500 rows at a time), NOT loaded entirely into RAM then inserted at once; update `processed` after each chunk.
- Each invalid row (missing email, bad format) is added to `errors: [{ row, reason }]`; valid rows ARE still inserted (partial-success — DIFFERENT from the all-or-nothing rollback in the hard challenge).

:::muted
Hints
:::

Use Redis `SET <key> <result> NX EX <ttl>` for an atomic check-and-set (guards against a race of two requests with the same key). Stream the CSV with `csv-parse` in stream mode; group rows into chunks then batch-`insert`. Keep the job state (`status/processed/total/errors`) in a Redis hash so `GET .../{jobId}` can read it.
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
70
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Idempotency via Redis + chunked processing + per-row error reporting
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

Guarantee that resending the SAME `Idempotency-Key` never inserts duplicates — the first call's result is stored in Redis and the next one returns it verbatim. Large files are processed in chunks (streamed), and each bad row is recorded individually without failing the whole job (partial-success for an import).

:::muted
Technical constraints
:::

- `Idempotency-Key → result` must be stored in Redis (`RedisTemplate`/Lettuce), FORBIDDEN to store it in a process-local `ConcurrentHashMap`.
- First send: create the job, process it, store the result in Redis under that key (with a TTL).
- Resend with the SAME key: detect the key already exists in Redis → return the cached result (same `jobId`/summary), do NOT re-parse, do NOT insert any more rows.
- The file must be read/inserted in chunks (e.g. 500 rows at a time) — use batched `saveAll` + EntityManager `clear` to avoid OOM; update `processed` after each chunk.
- Each invalid row goes into `errors: [{ row, reason }]`; valid rows ARE still inserted (partial-success — DIFFERENT from the rollback in the hard challenge).

:::muted
Hints
:::

Use `redisTemplate.opsForValue().setIfAbsent(key, result, ttl)` (SET NX EX) for an atomic check-and-set. Parse the CSV with Apache Commons CSV in iterator mode (do not read the whole file into a list). Keep the job state in Redis.
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
70
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Idempotency via Redis + chunked processing + per-row error reporting
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

Guarantee that resending the SAME `Idempotency-Key` never inserts duplicates — the first call's result is stored in Redis and the next one returns it verbatim. Large files are processed in chunks (streamed), and each bad row is recorded individually without failing the whole job (partial-success for an import).

:::muted
Technical constraints
:::

- `Idempotency-Key → result` must be stored in Redis via `IDistributedCache` (Redis backend), FORBIDDEN to store it in a process-local `ConcurrentDictionary`.
- First send: create the job, process it, store the result in Redis under that key (with a TTL).
- Resend with the SAME key: detect the key already exists → return the cached result (same `jobId`/summary), do NOT re-parse, do NOT insert any more rows.
- The file must be read/inserted in chunks (e.g. 500 rows at a time) — use `CsvHelper` streaming + batched `AddRange` + `SaveChanges`; update `processed` after each chunk.
- Each invalid row goes into `errors: [{ row, reason }]`; valid rows ARE still inserted (partial-success — DIFFERENT from the rollback in the hard challenge).

:::muted
Hints
:::

Use `StackExchange.Redis` `StringSet(key, value, ttl, when: When.NotExists)` (SET NX EX) for an atomic check-and-set. `CsvHelper.GetRecords<T>()` returns a lazy IEnumerable — group it into chunks. Keep the job state in Redis.
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
70
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Idempotency via Redis + chunked processing + per-row error reporting
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

Guarantee that resending the SAME `Idempotency-Key` never inserts duplicates — the first call's result is stored in Redis and the next one returns it verbatim. Large files are processed in chunks (streamed), and each bad row is recorded individually without failing the whole job (partial-success for an import).

:::muted
Technical constraints
:::

- `Idempotency-Key → result` must be stored in Redis (`go-redis`), FORBIDDEN to store it in a process-local mutex-guarded `map`.
- First send: create the job, process it, store the result in Redis under that key (with a TTL).
- Resend with the SAME key: detect the key already exists → return the cached result (same `jobId`/summary), do NOT re-parse, do NOT insert any more rows.
- The file must be read/inserted in chunks (e.g. 500 rows at a time) — use `encoding/csv` `Reader.Read()` row by row (streaming), group into chunks then `CreateInBatches`; update `processed` after each chunk.
- Each invalid row goes into `errors: [{ row, reason }]`; valid rows ARE still inserted (partial-success — DIFFERENT from the rollback in the hard challenge).

:::muted
Hints
:::

Use `rdb.SetNX(ctx, key, result, ttl)` (SET NX EX) for an atomic check-and-set. `csv.NewReader(r).Read()` reads one record at a time (not `ReadAll`). Keep the job state in Redis.
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
70
<!-- @starci/seperator -->
# steps
## 0
### langs
#### 0
##### lang
<!-- @starci/seperator -->
typescript
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Stand up the queue + Redis infra and the upload endpoint
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** Run Redis via Docker; add `ioredis` `bullmq` `csv-parse` `@nestjs/platform-express`.
- **Step 2:** Define a `Queue("user-import")` + `Worker("user-import", processor)`; register a shared Redis connection.
- **Step 3:** `@Post("import")` with `@HttpCode(202)` + `FileInterceptor("file")`: read the `Idempotency-Key` header, generate a `jobId`, `queue.add(...)` (with the file buffer), return `{ jobId }`.

:::muted
Minimum acceptance criteria
:::

- `POST /users/import` returns `202` + `jobId` immediately.
- The job is actually picked up and processed by the background worker (logs show the worker running).

:::muted
Nice to have
:::

- Validate the file Content-Type is `text/csv`.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Stand up the async + Redis infra and the upload endpoint
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** Run Redis via Docker; add `spring-boot-starter-data-redis` + `commons-csv`; enable `@EnableAsync`.
- **Step 2:** Configure a `RedisTemplate<String, String>`; create an `ImportService` with an `@Async importAsync(...)` method.
- **Step 3:** `@PostMapping("/import")` accepting `MultipartFile` + `@RequestHeader("Idempotency-Key")`: generate a `jobId`, call `importAsync`, return `ResponseEntity.accepted().body(...)`.

:::muted
Minimum acceptance criteria
:::

- `POST /users/import` returns `202` + `jobId` immediately.
- The `@Async` method runs on a thread other than the request thread (logs show a different thread name).

:::muted
Nice to have
:::

- Configure a dedicated `ThreadPoolTaskExecutor` for imports.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Stand up the background + Redis infra and the upload endpoint
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** Run Redis via Docker; add `StackExchange.Redis` (or `Microsoft.Extensions.Caching.StackExchangeRedis`) + `CsvHelper`.
- **Step 2:** Register a `BackgroundService` reading jobs from a `Channel<ImportJob>` (or Hangfire).
- **Step 3:** Map `POST /users/import` accepting `IFormFile` + `Idempotency-Key`: generate a `jobId`, enqueue the job, return `Results.Accepted(...)`.

:::muted
Minimum acceptance criteria
:::

- `POST /users/import` returns `202` + `jobId` immediately.
- The `BackgroundService` actually picks up and processes the job (logs show it).

:::muted
Nice to have
:::

- Cap the upload size via `RequestSizeLimit`.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Stand up the worker + Redis infra and the upload endpoint
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** Run Redis via Docker; `go get github.com/redis/go-redis/v9`; use stdlib `encoding/csv` for CSV.
- **Step 2:** Start a `chan ImportJob` + one (or several) worker goroutine(s) reading from the channel; connect via `redis.NewClient`.
- **Step 3:** `r.POST("/users/import", ...)`: `c.FormFile("file")` + `c.GetHeader("Idempotency-Key")`, copy the file into a buffer, generate a `jobId`, push the job to the channel, return `c.JSON(202, gin.H{"jobId": jobId})`.

:::muted
Minimum acceptance criteria
:::

- `POST /users/import` returns `202` + `jobId` immediately.
- The worker goroutine actually picks up and processes the job.

:::muted
Nice to have
:::

- Give each job a `context.Context` with a timeout.
<!-- @starci/seperator -->
## 1
### langs
#### 0
##### lang
<!-- @starci/seperator -->
typescript
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Wire Redis idempotency + chunked processing + the status poll endpoint
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** Before creating the job, call `redis.set("idem:"+key, JSON, "EX", ttl, "NX")`. If it returns `null` (key exists) → read the cached result back from Redis and return it (same `jobId`), do NOT enqueue a new one.
- **Step 2:** In the worker: stream the CSV, group rows into chunks of 500, batch-insert into the DB; after each chunk update `processed` in the job's Redis hash.
- **Step 3:** A bad row → push `{ row, reason }` into `errors`; valid rows are still inserted. When finished, set `status: "done"` + store the summary in the idempotency key.
- **Step 4:** `@Get("import/:jobId")` reads the job's Redis hash and returns `{ status, processed, total, errors }`.

:::muted
Minimum acceptance criteria
:::

- First send of a key → the job runs to `done`, `processed == total - (rows that failed to parse)`.
- Resend with the SAME key → returns the old `jobId`, NO additional row is inserted.

:::muted
Nice to have
:::

- A `replayed: true` flag in the response when returning from the idempotency cache.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Wire Redis idempotency + chunked processing + the status poll endpoint
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** Before creating the job, `setIfAbsent("idem:"+key, JSON, ttl)`. If it returns `false` (key exists) → read the cached result from Redis and return it (same `jobId`), do NOT run a new import.
- **Step 2:** In the `@Async` method: parse the CSV streaming, group into chunks of 500, batched `saveAll` + `entityManager.flush()/clear()`; after each chunk update `processed` in Redis.
- **Step 3:** A bad row → add `{ row, reason }` to `errors`; valid rows are still inserted. When finished, set `status=done` + store the summary in the idempotency key.
- **Step 4:** `@GetMapping("/import/{jobId}")` reads the job state from Redis and returns `{ status, processed, total, errors }`.

:::muted
Minimum acceptance criteria
:::

- First send of a key → the job runs to `done`, `processed` is correct.
- Resend with the SAME key → returns the old `jobId`, NO additional row is inserted.

:::muted
Nice to have
:::

- A `replayed` flag when returning from the idempotency cache.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Wire Redis idempotency + chunked processing + the status poll endpoint
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** Before creating the job, `db.StringSet("idem:"+key, JSON, ttl, when: When.NotExists)`. If it returns `false` → read the cached result and return it (same `jobId`), do NOT run a new import.
- **Step 2:** In the `BackgroundService`: read the CSV streaming with `CsvHelper`, group into chunks of 500, batched `AddRange` + `SaveChangesAsync`; after each chunk update `processed` in Redis.
- **Step 3:** A bad row → add `{ row, reason }` to `errors`; valid rows are still inserted. When finished, set `status=done` + store the summary in the idempotency key.
- **Step 4:** Map `GET /users/import/{jobId}` to read the job state from Redis and return `{ status, processed, total, errors }`.

:::muted
Minimum acceptance criteria
:::

- First send of a key → the job runs to `done`, `processed` is correct.
- Resend with the SAME key → returns the old `jobId`, NO additional row is inserted.

:::muted
Nice to have
:::

- A `replayed` flag when returning from the idempotency cache.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Wire Redis idempotency + chunked processing + the status poll endpoint
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** Before creating the job, `rdb.SetNX(ctx, "idem:"+key, JSON, ttl)`. If it returns `false` → read the cached result from Redis and return it (same `jobId`), do NOT run a new import.
- **Step 2:** In the worker goroutine: `csv.Reader.Read()` row by row, group into chunks of 500, `CreateInBatches`; after each chunk update `processed` in Redis.
- **Step 3:** A bad row → append `{ row, reason }` to `errors`; valid rows are still inserted. When finished, set `status=done` + store the summary in the idempotency key.
- **Step 4:** `r.GET("/users/import/:jobId", ...)` reads the job state from Redis and returns `{ status, processed, total, errors }`.

:::muted
Minimum acceptance criteria
:::

- First send of a key → the job runs to `done`, `processed` is correct.
- Resend with the SAME key → returns the old `jobId`, NO additional row is inserted.

:::muted
Nice to have
:::

- A `replayed` flag when returning from the idempotency cache.
<!-- @starci/seperator -->
## 2
### langs
#### 0
##### lang
<!-- @starci/seperator -->
typescript
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Prove idempotency + partial-success and write the README
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** Create a CSV file with ≥200 rows (including a few bad rows); import it the first time with a key:
  ```bash
  # Windows (PowerShell)
  curl.exe -i -X POST http://localhost:3000/users/import -H "Idempotency-Key: imp-001" -F "file=@users.csv"

  # macOS / Linux
  curl -i -X POST http://localhost:3000/users/import -H "Idempotency-Key: imp-001" -F "file=@users.csv"
  ```
- **Step 2:** Poll `GET /users/import/{jobId}` until `status: done`; record `processed`, `total`, `errors`.
- **Step 3:** Count `GET /users`. Resend the SAME `Idempotency-Key: imp-001` with the same file → confirm it returns the old `jobId` and the `GET /users` count did NOT increase.
- **Step 4:** Paste the real response, the poll snapshot, and both counts into the README (do not fabricate).

:::muted
Minimum acceptance criteria
:::

- The README has 6 sections: Challenge description, How to run, Architecture/Stack, Smoke Test, Code Execution Trace, Design Decisions.
- The Smoke Test proves: (a) the job is done with partial errors, (b) resending the same key → the count is unchanged.

:::muted
Nice to have
:::

- Benchmark the import time of a 10k-row file.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Prove idempotency + partial-success and write the README
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** Create a CSV file with ≥200 rows (including a few bad rows); import it the first time with a key:
  ```bash
  # Windows (PowerShell)
  curl.exe -i -X POST http://localhost:3000/users/import -H "Idempotency-Key: imp-001" -F "file=@users.csv"

  # macOS / Linux
  curl -i -X POST http://localhost:3000/users/import -H "Idempotency-Key: imp-001" -F "file=@users.csv"
  ```
- **Step 2:** Poll `GET /users/import/{jobId}` until `status: done`; record `processed`, `total`, `errors`.
- **Step 3:** Count `GET /users`. Resend the SAME key with the same file → confirm it returns the old `jobId` and the count did NOT increase.
- **Step 4:** Paste the real response, the poll snapshot, and both counts into the README.

:::muted
Minimum acceptance criteria
:::

- The README has 6 sections.
- The Smoke Test proves: (a) the job is done with partial errors, (b) resending the same key → the count is unchanged.

:::muted
Nice to have
:::

- Benchmark a 10k-row import.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Prove idempotency + partial-success and write the README
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** Create a CSV file with ≥200 rows (including a few bad rows); import it the first time with a key:
  ```bash
  # Windows (PowerShell)
  curl.exe -i -X POST http://localhost:3000/users/import -H "Idempotency-Key: imp-001" -F "file=@users.csv"

  # macOS / Linux
  curl -i -X POST http://localhost:3000/users/import -H "Idempotency-Key: imp-001" -F "file=@users.csv"
  ```
- **Step 2:** Poll `GET /users/import/{jobId}` until `status: done`; record `processed`, `total`, `errors`.
- **Step 3:** Count `GET /users`. Resend the SAME key with the same file → confirm it returns the old `jobId` and the count did NOT increase.
- **Step 4:** Paste the real response, the poll snapshot, and both counts into the README.

:::muted
Minimum acceptance criteria
:::

- The README has 6 sections.
- The Smoke Test proves: (a) the job is done with partial errors, (b) resending the same key → the count is unchanged.

:::muted
Nice to have
:::

- Benchmark a 10k-row import.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Prove idempotency + partial-success and write the README
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** Create a CSV file with ≥200 rows (including a few bad rows); import it the first time with a key:
  ```bash
  # Windows (PowerShell)
  curl.exe -i -X POST http://localhost:3000/users/import -H "Idempotency-Key: imp-001" -F "file=@users.csv"

  # macOS / Linux
  curl -i -X POST http://localhost:3000/users/import -H "Idempotency-Key: imp-001" -F "file=@users.csv"
  ```
- **Step 2:** Poll `GET /users/import/{jobId}` until `status: done`; record `processed`, `total`, `errors`.
- **Step 3:** Count `GET /users`. Resend the SAME key with the same file → confirm it returns the old `jobId` and the count did NOT increase.
- **Step 4:** Paste the real response, the poll snapshot, and both counts into the README.

:::muted
Minimum acceptance criteria
:::

- The README has 6 sections.
- The Smoke Test proves: (a) the job is done with partial errors, (b) resending the same key → the count is unchanged.

:::muted
Nice to have
:::

- Benchmark a 10k-row import.
<!-- @starci/seperator -->
# outputs
## 0
### langs
#### 0
##### lang
<!-- @starci/seperator -->
typescript
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
You can implement real idempotency at the implementation level: the same Idempotency-Key always yields the same result and never writes duplicates, even after a restart (because the state lives in Redis).
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
You can implement real idempotency at the implementation level: the same Idempotency-Key always yields the same result and never writes duplicates, even after a restart (because the state lives in Redis).
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
You can implement real idempotency at the implementation level: the same Idempotency-Key always yields the same result and never writes duplicates, even after a restart (because the state lives in Redis).
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
You can implement real idempotency at the implementation level: the same Idempotency-Key always yields the same result and never writes duplicates, even after a restart (because the state lives in Redis).
<!-- @starci/seperator -->
## 1
### langs
#### 0
##### lang
<!-- @starci/seperator -->
typescript
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
You can handle long-running work with the async-job pattern (202 + polling) and stream a large file in chunks instead of loading it all into RAM, with partial-success reporting per-row errors.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
You can handle long-running work with the async-job pattern (202 + polling) and stream a large file in chunks instead of loading it all into RAM, with partial-success reporting per-row errors.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
You can handle long-running work with the async-job pattern (202 + polling) and stream a large file in chunks instead of loading it all into RAM, with partial-success reporting per-row errors.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
You can handle long-running work with the async-job pattern (202 + polling) and stream a large file in chunks instead of loading it all into RAM, with partial-success reporting per-row errors.
<!-- @starci/seperator -->
# prerequisites
## 0
### langs
#### 0
##### lang
<!-- @starci/seperator -->
typescript
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Completed the hard challenge (batch + transaction) + Docker running PostgreSQL and Redis locally.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Completed the hard challenge (batch + transaction) + Docker running PostgreSQL and Redis locally.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Completed the hard challenge (batch + transaction) + Docker running PostgreSQL and Redis locally.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Completed the hard challenge (batch + transaction) + Docker running PostgreSQL and Redis locally.
<!-- @starci/seperator -->
## 1
### langs
#### 0
##### lang
<!-- @starci/seperator -->
typescript
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Understand idempotency (§2.2.1), the async-job pattern (`202 Accepted` + polling), and Redis basics (`SET NX EX`, TTL).
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Understand idempotency (§2.2.1), the async-job pattern (`202 Accepted` + polling), and Redis basics (`SET NX EX`, TTL).
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Understand idempotency (§2.2.1), the async-job pattern (`202 Accepted` + polling), and Redis basics (`SET NX EX`, TTL).
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Understand idempotency (§2.2.1), the async-job pattern (`202 Accepted` + polling), and Redis basics (`SET NX EX`, TTL).
<!-- @starci/seperator -->
# difficulty
<!-- @starci/seperator -->
insane
<!-- @starci/seperator -->
# score
<!-- @starci/seperator -->
100
<!-- @starci/seperator -->
# verified
<!-- @starci/seperator -->
2026-06-21
<!-- @starci/seperator -->
