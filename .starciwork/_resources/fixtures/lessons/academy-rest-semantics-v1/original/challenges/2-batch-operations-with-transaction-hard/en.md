# sortIndex
<!-- @starci/seperator -->
3
<!-- @starci/seperator -->
# title
<!-- @starci/seperator -->
Batch insert many resources inside one atomic transaction (all-or-nothing)
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
Add a `POST /users/batch` endpoint that accepts an array of users and writes the whole batch inside ONE database transaction: if any record fails (duplicate email, missing field), the entire batch is rolled back — no partial write. Return `{ created, failed: [{ index, reason }] }` so the client knows exactly which record failed. Pick your language; every language returns the same contract output.
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
Validate the batch payload and define the batch response contract
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

Design `POST /users/batch` to accept `{ users: [{ name, email }, ...] }` and return a response that clearly describes the batch outcome — how many records were created and which records failed and why.

:::muted
Technical constraints
:::

- `POST /users/batch` accepts body `{ users: CreateUserDto[] }`; an empty array or missing `users` → 400.
- The `email` column must be UNIQUE at the database level (not just an in-memory check) — this constraint is what catches duplicates.
- A successful response → 201 with shape `{ created: number, failed: [] }` (the `failed` array is empty when the whole batch is OK).
- When the batch is rolled back due to an error → return `{ created: 0, failed: [{ index, reason }] }`, where `index` is the record's position in the submitted array.
- `UserController` only maps verb → handler; all transaction logic lives in the service layer.

:::muted
Hints
:::

Use a `BatchCreateUsersDto` with `@ValidateNested()` + `@Type(() => CreateUserDto)` to validate each element. Put `@Column({ unique: true })` on the TypeORM entity's `email`.
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
Validate the batch payload and define the batch response contract
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

Design `POST /users/batch` to accept `{ users: [{ name, email }, ...] }` and return a response that clearly describes the batch outcome — how many records were created and which records failed and why.

:::muted
Technical constraints
:::

- `POST /users/batch` accepts body `{ users: CreateUserRequest[] }`; an empty or null list → 400.
- The `email` column must be UNIQUE at the database level (`@Column(unique = true)` on the JPA entity).
- A successful response → 201 with shape `{ created: number, failed: [] }`.
- When the batch is rolled back due to an error → `{ created: 0, failed: [{ index, reason }] }`, `index` being the record's position in the list.
- `UserController` only maps verb → handler; transaction logic lives in the service.

:::muted
Hints
:::

Use `@Valid` + `@NotEmpty` on the list inside the request DTO. Put `@Column(unique = true)` (and `@Table(uniqueConstraints = ...)`) on `email`. Catch `DataIntegrityViolationException` to map it to a failed record.
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
Validate the batch payload and define the batch response contract
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

Design `POST /users/batch` to accept `{ users: [{ name, email }, ...] }` and return a response that clearly describes the batch outcome — how many records were created and which records failed and why.

:::muted
Technical constraints
:::

- `POST /users/batch` accepts body `{ users: CreateUserDto[] }`; an empty or null array → 400.
- The `Email` column must be UNIQUE at the database level (a unique index configured in EF Core).
- A successful response → 201 with shape `{ created: number, failed: [] }`.
- When the batch is rolled back due to an error → `{ created: 0, failed: [{ index, reason }] }`, `index` being the record's position in the array.
- The HTTP adapter only maps verb → handler; transaction logic lives in the service.

:::muted
Hints
:::

Configure the unique index with `modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique()`. Catch `DbUpdateException` (unique violation) to know the batch failed and must roll back.
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
Validate the batch payload and define the batch response contract
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

Design `POST /users/batch` to accept `{ users: [{ name, email }, ...] }` and return a response that clearly describes the batch outcome — how many records were created and which records failed and why.

:::muted
Technical constraints
:::

- `POST /users/batch` accepts body `{ users: []CreateUserInput }`; an empty or missing slice → 400.
- The `email` column must be UNIQUE at the database level (`gorm:"uniqueIndex"` on the struct model).
- A successful response → 201 with shape `{ created: number, failed: [] }`.
- When the batch is rolled back due to an error → `{ created: 0, failed: [{ index, reason }] }`, `index` being the record's position in the slice.
- The HTTP handler only maps verb → operation; transaction logic lives in the service.

:::muted
Hints
:::

Put a `gorm:"uniqueIndex"` tag on the model's `Email` field. Use `binding:"required,dive"` so gin validates each element of the slice.
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
Wrap the whole batch in one all-or-nothing transaction
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

Write the whole batch inside ONE database transaction so that if any single record fails, every prior insert in the same batch is undone (`ROLLBACK`) — ending with the database in exactly the state it was in before the call.

:::muted
Technical constraints
:::

- Open a REAL database transaction, insert every record inside it, then `COMMIT` once at the end.
- If any insert throws (duplicate email → unique violation, or missing field) → `ROLLBACK` the whole transaction; NO record of the batch may survive.
- FORBIDDEN: "insert each record then manually delete/compensate on failure" — you must use the database's transaction boundary, not manual cleanup.
- On rollback, collect the index + reason of the failing record(s) to return in `failed`.
- The `BEGIN`, the `INSERT`s, and the `COMMIT`/`ROLLBACK` must be visible in the SQL log (enable query logging).

:::muted
Hints
:::

Use `dataSource.createQueryRunner()` → `connect()` → `startTransaction()`; insert via `queryRunner.manager`; `commitTransaction()` in the success branch and `rollbackTransaction()` in `catch`; always `release()` in `finally`. Set `logging: true` in the TypeORM config to see `START TRANSACTION` / `ROLLBACK`.
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
Wrap the whole batch in one all-or-nothing transaction
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

Write the whole batch inside ONE database transaction so that if any single record fails, every prior insert in the same batch is undone (`ROLLBACK`) — ending with the database in exactly the state it was in before the call.

:::muted
Technical constraints
:::

- The service method that handles the batch is annotated `@Transactional` so Spring opens/commits a transaction around the whole method body.
- If any insert throws a runtime exception (unique violation, missing field) → the transaction `ROLLBACK`s entirely; NO record of the batch may survive.
- FORBIDDEN: "insert each record then manually delete/compensate" — let Spring/JPA's transaction boundary do the rollback.
- On rollback, collect the index + reason of the failing record to return in `failed` (handle the exception in an outer layer so the response can still be `201` with the failed list, or catch-and-rethrow correctly to preserve the rollback).
- `BEGIN`/`INSERT`/`ROLLBACK` must be visible in the SQL log.

:::muted
Hints
:::

Put `@Transactional` on the service method that inserts the batch (not on the outer validation wrapper). Enable `spring.jpa.show-sql=true` + `logging.level.org.hibernate.SQL=DEBUG`. Note the exception must propagate out of the `@Transactional` method for rollback to trigger.
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
Wrap the whole batch in one all-or-nothing transaction
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

Write the whole batch inside ONE database transaction so that if any single record fails, every prior insert in the same batch is undone (`ROLLBACK`) — ending with the database in exactly the state it was in before the call.

:::muted
Technical constraints
:::

- Open the transaction with `await dbContext.Database.BeginTransactionAsync()`, insert every record, then `CommitAsync()` at the end.
- If any insert throws (unique violation, missing field) → `RollbackAsync()` (or dispose the uncommitted transaction) → NO record of the batch may survive.
- FORBIDDEN: "insert each record then manually delete/compensate" — you must use EF Core's transaction boundary.
- On rollback, collect the index + reason of the failing record to return in `failed`.
- `BEGIN TRANSACTION`/`INSERT`/`ROLLBACK` must be visible in the SQL log.

:::muted
Hints
:::

Wrap `using var tx = await context.Database.BeginTransactionAsync();` in a `try`; `await context.SaveChangesAsync()` then `await tx.CommitAsync()`; in `catch` do not commit (the transaction rolls back on dispose). Enable EF logging via `optionsBuilder.LogTo(Console.WriteLine)`.
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
Wrap the whole batch in one all-or-nothing transaction
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

Write the whole batch inside ONE database transaction so that if any single record fails, every prior insert in the same batch is undone (`ROLLBACK`) — ending with the database in exactly the state it was in before the call.

:::muted
Technical constraints
:::

- Wrap the entire batch insert in `db.Transaction(func(tx *gorm.DB) error { ... })`; return `nil` to commit, return an `error` to make GORM `ROLLBACK` automatically.
- If any `tx.Create(...)` returns an error (unique violation, missing field) → return that error out of the closure → GORM rolls back everything; NO record of the batch may survive.
- FORBIDDEN: "insert each record then manually delete/compensate" — you must use GORM's `db.Transaction` (or `Begin/Commit/Rollback`).
- On rollback, collect the index + reason of the failing record to return in `failed`.
- `BEGIN`/`INSERT`/`ROLLBACK` must be visible in the SQL log.

:::muted
Hints
:::

Use `db.Transaction(func(tx *gorm.DB) error { for i, u := range input { if err := tx.Create(&u).Error; err != nil { return fmt.Errorf("index %d: %w", i, err) } } return nil })`. Set the GORM logger to `logger.Info` to see `BEGIN`/`ROLLBACK`.
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
Move the store to a real database with a unique constraint
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** Add PostgreSQL (Docker) + `@nestjs/typeorm` `typeorm` `pg`; configure `TypeOrmModule.forRoot({ ..., logging: true })`.
- **Step 2:** Create a `User` entity with `@PrimaryGeneratedColumn("uuid")` and `@Column({ unique: true })` on `email`.
- **Step 3:** Keep the single-record CRUD operations (from the prior challenge) running on the repository; run migration/sync to create the table + unique index.

:::muted
Minimum acceptance criteria
:::

- The app boots, connects to the DB, and the `users` table has a unique constraint on `email`.
- Inserting two users with the same email (outside the batch) is also rejected by the DB.

:::muted
Nice to have
:::

- Use an explicit migration instead of `synchronize: true`.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Move the store to a real database with a unique constraint
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** Add PostgreSQL (Docker) + `spring-boot-starter-data-jpa` + the `postgresql` driver.
- **Step 2:** Create an `@Entity User` with a UUID `@Id` and `@Column(unique = true)` on `email`; create a `UserRepository extends JpaRepository`.
- **Step 3:** Configure `spring.jpa.show-sql=true` and let Hibernate create the schema (or Flyway) with a unique index on `email`.

:::muted
Minimum acceptance criteria
:::

- The app boots, connects to the DB, and the `users` table has a unique constraint on `email`.

:::muted
Nice to have
:::

- Use a Flyway/Liquibase migration instead of `ddl-auto=update`.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Move the store to a real database with a unique constraint
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** Add PostgreSQL (Docker) + `Microsoft.EntityFrameworkCore` + `Npgsql.EntityFrameworkCore.PostgreSQL`.
- **Step 2:** Create an `AppDbContext` with `DbSet<User>`; in `OnModelCreating` configure `HasIndex(u => u.Email).IsUnique()`.
- **Step 3:** Create a migration (`dotnet ef migrations add Init`) + `dotnet ef database update`; enable EF query logging.

:::muted
Minimum acceptance criteria
:::

- The app boots, connects to the DB, and the `Users` table has a unique index on `Email`.

:::muted
Nice to have
:::

- Enable logging only in the Development environment.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Move the store to a real database with a unique constraint
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** Add PostgreSQL (Docker) + `gorm.io/gorm` + `gorm.io/driver/postgres`.
- **Step 2:** Define a `User` model with `ID string gorm:"primaryKey"` and `Email string gorm:"uniqueIndex"`.
- **Step 3:** `db.AutoMigrate(&User{})` to create the table + unique index; configure the GORM logger at `Info` level.

:::muted
Minimum acceptance criteria
:::

- The app boots, connects to the DB, and the `users` table has a unique index on `email`.

:::muted
Nice to have
:::

- Move the DSN config into an environment variable.
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
Implement the batch endpoint with a transaction and a failed[] response
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** Add `@Post("batch")` in `UserController`, accepting `BatchCreateUsersDto`.
- **Step 2:** In the service: `const qr = dataSource.createQueryRunner(); await qr.connect(); await qr.startTransaction();`.
- **Step 3:** Loop over `users`, insert each record via `qr.manager`; if one insert throws, catch it, record `{ index, reason }`, `await qr.rollbackTransaction()` and return `{ created: 0, failed }`.
- **Step 4:** If every insert succeeds → `await qr.commitTransaction()` and return `{ created: users.length, failed: [] }`; always `await qr.release()` in `finally`.

:::muted
Minimum acceptance criteria
:::

- A valid batch → every record is committed, `failed` is empty.
- A batch with 1 duplicate-email record → NO record exists afterwards (rollback), `failed` has the correct index + reason.

:::muted
Nice to have
:::

- Return `207 Multi-Status` instead of `201` when there are failures (your design choice — document it in the README).
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Implement the batch endpoint with a transaction and a failed[] response
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** Add `@PostMapping("/batch")` accepting `@Valid BatchCreateRequest`.
- **Step 2:** Create a `@Transactional` service method that loops over the list and `userRepository.save(...)` each record; call `saveAndFlush` so a unique violation surfaces inside the transaction.
- **Step 3:** If one save throws `DataIntegrityViolationException`, let it propagate → `@Transactional` rolls back everything; the outer controller/service layer catches the exception and builds `failed: [{ index, reason }]`.
- **Step 4:** When there is no error → return `{ created: N, failed: [] }`.

:::muted
Minimum acceptance criteria
:::

- A valid batch → every record committed, `failed` is empty.
- A batch with 1 duplicate-email record → NO record exists afterwards (rollback), `failed` has the correct index + reason.

:::muted
Nice to have
:::

- Map different error kinds (validation vs unique) to a clear `reason`.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Implement the batch endpoint with a transaction and a failed[] response
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** Map `POST /users/batch` accepting `BatchCreateUsersDto`.
- **Step 2:** `await using var tx = await context.Database.BeginTransactionAsync();` inside `try`; `context.Users.Add(...)` each record then `await context.SaveChangesAsync()`.
- **Step 3:** If `SaveChangesAsync` throws `DbUpdateException` (unique violation) → enter `catch`, do NOT commit (tx dispose = rollback), build `failed: [{ index, reason }]`, return `{ created: 0, failed }`.
- **Step 4:** On success → `await tx.CommitAsync()`, return `{ created: N, failed: [] }`.

:::muted
Minimum acceptance criteria
:::

- A valid batch → every record committed, `failed` is empty.
- A batch with 1 duplicate-email record → NO record exists afterwards (rollback), `failed` has the correct index + reason.

:::muted
Nice to have
:::

- Parse `DbUpdateException.InnerException` to extract a specific reason.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Implement the batch endpoint with a transaction and a failed[] response
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** Register `r.POST("/users/batch", ...)`; bind the body into `struct { Users []CreateUserInput }`.
- **Step 2:** Call `err := db.Transaction(func(tx *gorm.DB) error { ... })`; inside, loop over the slice and `tx.Create(&user)`.
- **Step 3:** If one `tx.Create` returns an error, return `fmt.Errorf("index %d: %w", i, err)` out of the closure → GORM rolls back; outside, parse the index + reason and return `{ created: 0, failed }`.
- **Step 4:** If the closure returns `nil` → it committed, return `{ created: N, failed: [] }`.

:::muted
Minimum acceptance criteria
:::

- A valid batch → every record committed, `failed` is empty.
- A batch with 1 duplicate-email record → NO record exists afterwards (rollback), `failed` has the correct index + reason.

:::muted
Nice to have
:::

- Use `errors.As` to distinguish a unique error from others.
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
Prove atomicity with the SQL log and write the README
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** Send a valid batch (e.g. 3 new users) and a batch with 1 duplicate email:
  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri "http://localhost:3000/users/batch" -Method Post -Body (@{ users = @(@{ name="A"; email="a@x.com" }, @{ name="B"; email="a@x.com" }) } | ConvertTo-Json -Depth 5) -ContentType "application/json"

  # macOS / Linux
  curl -i -X POST http://localhost:3000/users/batch -H "Content-Type: application/json" -d '{"users":[{"name":"A","email":"a@x.com"},{"name":"B","email":"a@x.com"}]}'
  ```
- **Step 2:** After the failing batch, call `GET /users` and confirm the count did NOT increase (real rollback).
- **Step 3:** Copy the SQL log fragment showing `START TRANSACTION` → the `INSERT`s → `ROLLBACK`.
- **Step 4:** Paste both the real response and the SQL log into the README (do not fabricate).

:::muted
Minimum acceptance criteria
:::

- The README has 6 sections: Challenge description, How to run, Architecture/Stack, Smoke Test, Code Execution Trace, Design Decisions.
- The Smoke Test proves the count is unchanged after the failing batch + the SQL log contains `ROLLBACK`.

:::muted
Nice to have
:::

- Benchmark the commit time of a large batch (e.g. 1000 records).
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Prove atomicity with the SQL log and write the README
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** Send a valid batch and a batch with 1 duplicate email:
  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri "http://localhost:3000/users/batch" -Method Post -Body (@{ users = @(@{ name="A"; email="a@x.com" }, @{ name="B"; email="a@x.com" }) } | ConvertTo-Json -Depth 5) -ContentType "application/json"

  # macOS / Linux
  curl -i -X POST http://localhost:3000/users/batch -H "Content-Type: application/json" -d '{"users":[{"name":"A","email":"a@x.com"},{"name":"B","email":"a@x.com"}]}'
  ```
- **Step 2:** After the failing batch, call `GET /users` and confirm the count did NOT increase (real rollback).
- **Step 3:** Copy the SQL log (`show-sql`) fragment showing the `INSERT`s → rollback.
- **Step 4:** Paste both the real response and the SQL log into the README.

:::muted
Minimum acceptance criteria
:::

- The README has 6 sections.
- The Smoke Test proves the count is unchanged after the failing batch + the log shows the rollback.

:::muted
Nice to have
:::

- Benchmark a large batch.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Prove atomicity with the SQL log and write the README
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** Send a valid batch and a batch with 1 duplicate email:
  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri "http://localhost:3000/users/batch" -Method Post -Body (@{ users = @(@{ name="A"; email="a@x.com" }, @{ name="B"; email="a@x.com" }) } | ConvertTo-Json -Depth 5) -ContentType "application/json"

  # macOS / Linux
  curl -i -X POST http://localhost:3000/users/batch -H "Content-Type: application/json" -d '{"users":[{"name":"A","email":"a@x.com"},{"name":"B","email":"a@x.com"}]}'
  ```
- **Step 2:** After the failing batch, call `GET /users` and confirm the count did NOT increase (real rollback).
- **Step 3:** Copy the EF log showing `BEGIN TRANSACTION` → `INSERT` → `ROLLBACK`.
- **Step 4:** Paste both the real response and the SQL log into the README.

:::muted
Minimum acceptance criteria
:::

- The README has 6 sections.
- The Smoke Test proves the count is unchanged after the failing batch + the log shows `ROLLBACK`.

:::muted
Nice to have
:::

- Benchmark a large batch.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Prove atomicity with the SQL log and write the README
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** Send a valid batch and a batch with 1 duplicate email:
  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri "http://localhost:3000/users/batch" -Method Post -Body (@{ users = @(@{ name="A"; email="a@x.com" }, @{ name="B"; email="a@x.com" }) } | ConvertTo-Json -Depth 5) -ContentType "application/json"

  # macOS / Linux
  curl -i -X POST http://localhost:3000/users/batch -H "Content-Type: application/json" -d '{"users":[{"name":"A","email":"a@x.com"},{"name":"B","email":"a@x.com"}]}'
  ```
- **Step 2:** After the failing batch, call `GET /users` and confirm the count did NOT increase (real rollback).
- **Step 3:** Copy the GORM log showing `BEGIN` → `INSERT` → `ROLLBACK`.
- **Step 4:** Paste both the real response and the SQL log into the README.

:::muted
Minimum acceptance criteria
:::

- The README has 6 sections.
- The Smoke Test proves the count is unchanged after the failing batch + the log shows `ROLLBACK`.

:::muted
Nice to have
:::

- Benchmark a large batch.
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
You understand the transaction boundary: a batch write either succeeds completely or leaves no trace at all (atomicity).
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
You understand the transaction boundary: a batch write either succeeds completely or leaves no trace at all (atomicity).
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
You understand the transaction boundary: a batch write either succeeds completely or leaves no trace at all (atomicity).
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
You understand the transaction boundary: a batch write either succeeds completely or leaves no trace at all (atomicity).
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
You can use the database's unique constraint as the mechanism that catches duplicates and turn that violation into a controlled rollback instead of a partial write.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
You can use the database's unique constraint as the mechanism that catches duplicates and turn that violation into a controlled rollback instead of a partial write.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
You can use the database's unique constraint as the mechanism that catches duplicates and turn that violation into a controlled rollback instead of a partial write.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
You can use the database's unique constraint as the mechanism that catches duplicates and turn that violation into a controlled rollback instead of a partial write.
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
Completed the medium challenge (pagination/filter on a real DB) + Docker running PostgreSQL locally.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Completed the medium challenge (pagination/filter on a real DB) + Docker running PostgreSQL locally.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Completed the medium challenge (pagination/filter on a real DB) + Docker running PostgreSQL locally.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Completed the medium challenge (pagination/filter on a real DB) + Docker running PostgreSQL locally.
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
Understand the concept of an ACID transaction (`BEGIN`/`COMMIT`/`ROLLBACK`) and atomicity.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Understand the concept of an ACID transaction (`BEGIN`/`COMMIT`/`ROLLBACK`) and atomicity.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Understand the concept of an ACID transaction (`BEGIN`/`COMMIT`/`ROLLBACK`) and atomicity.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Understand the concept of an ACID transaction (`BEGIN`/`COMMIT`/`ROLLBACK`) and atomicity.
<!-- @starci/seperator -->
# difficulty
<!-- @starci/seperator -->
hard
<!-- @starci/seperator -->
# score
<!-- @starci/seperator -->
100
<!-- @starci/seperator -->
# verified
<!-- @starci/seperator -->
2026-06-21
<!-- @starci/seperator -->
