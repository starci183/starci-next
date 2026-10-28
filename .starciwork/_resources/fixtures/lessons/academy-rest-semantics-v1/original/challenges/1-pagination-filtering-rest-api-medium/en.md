# sortIndex
<!-- @starci/seperator -->
2
<!-- @starci/seperator -->
# title
<!-- @starci/seperator -->
Paginate, filter and search a collection endpoint
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
Extend `GET /users` to support pagination (`page`/`limit`), a status filter and a name search, returning the standard envelope `{ data: [], meta: { total, page, limit, totalPages } }`. Pick your language; every language returns the same output contract.
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
Validate query params (page, limit, status, search) with sane defaults
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

Accept the pagination, filter and search inputs as typed, validated query params so the endpoint never trusts raw strings from the client.

:::muted
Technical constraints
:::

- `GET /users` accepts query params: `page` (default `1`, integer `>= 1`), `limit` (default `10`, integer `1..50`), `status` (optional, one of `active`/`inactive`), `search` (optional, matches `name`).
- Declare a `QueryUsersDto` with `class-validator` decorators and enable `ValidationPipe({ transform: true, whitelist: true })`; query strings are cast to numbers via `@Type(() => Number)`.
- `limit > 50` or `page < 1` returns HTTP `400`; omitted `page`/`limit` fall back to the defaults.

:::muted
Hints
:::

Query values arrive as strings — without `@Type(() => Number)` the `@IsInt()` check fails on every request. Use `@IsIn(['active','inactive'])` for `status`.
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
35
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Validate query params (page, limit, status, search) with sane defaults
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

Accept the pagination, filter and search inputs as typed, validated query params so the endpoint never trusts raw strings from the client.

:::muted
Technical constraints
:::

- `GET /users` accepts query params: `page` (default `1`, integer `>= 1`), `limit` (default `10`, integer `1..50`), `status` (optional, one of `active`/`inactive`), `search` (optional, matches `name`).
- Bind params into a `QueryUsersDto` POJO with Jakarta Bean Validation (`@Min`, `@Max`), defaults via field initializers, and validate with `@Valid` on the controller parameter.
- `limit > 50` or `page < 1` returns HTTP `400`; omitted `page`/`limit` fall back to the defaults.

:::muted
Hints
:::

Add `@Validated` on the controller class to activate parameter-level constraints; Spring binds query strings to `int` automatically.
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
35
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Validate query params (page, limit, status, search) with sane defaults
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

Accept the pagination, filter and search inputs as typed, validated query params so the endpoint never trusts raw strings from the client.

:::muted
Technical constraints
:::

- `GET /users` accepts query params: `page` (default `1`, integer `>= 1`), `limit` (default `10`, integer `1..50`), `status` (optional, one of `active`/`inactive`), `search` (optional, matches `name`).
- Bind params into a `QueryUsersDto` with `System.ComponentModel.DataAnnotations` (`[Range(1, int.MaxValue)]`, `[Range(1, 50)]`); `[ApiController]` auto-returns `400` when `ModelState` is invalid.
- `limit > 50` or `page < 1` returns HTTP `400`; omitted `page`/`limit` fall back to the defaults.

:::muted
Hints
:::

Set defaults via property initializers (`public int Page { get; set; } = 1;`). The query binds to the DTO when it is an action parameter.
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
35
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Validate query params (page, limit, status, search) with sane defaults
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

Accept the pagination, filter and search inputs as typed, validated query params so the endpoint never trusts raw strings from the client.

:::muted
Technical constraints
:::

- `GET /users` accepts query params: `page` (default `1`, integer `>= 1`), `limit` (default `10`, integer `1..50`), `status` (optional, one of `active`/`inactive`), `search` (optional, matches `name`).
- Bind params into a `QueryUsersDto` struct with `form` + `binding` tags (`go-playground/validator`); `c.ShouldBindQuery(&dto)` returns an error → respond `400`.
- `limit > 50` or `page < 1` returns HTTP `400`; omitted `page`/`limit` fall back to the defaults.

:::muted
Hints
:::

Use `form:"page,default=1"` for defaults and `binding:"min=1,max=50"` for bounds; `binding:"omitempty,oneof=active inactive"` for the optional status.
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
35
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
Push filter and search down to the data layer, paginate, return the meta envelope
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

Apply the filter and search at the query layer (not in memory), then paginate, and return a `{ data, meta }` envelope so the client can render pager controls without a second round-trip.

:::muted
Technical constraints
:::

- Filtering and search run before pagination; never fetch everything then `.filter()` in application code.
- Response shape is exactly `{ data: User[], meta: { total, page, limit, totalPages } }`; `totalPages = ceil(total / limit)`; an empty result is `total = 0`, `data = []`.
- `status` maps to `WHERE status = :status`; `search` matches `name` case-insensitively (`ILIKE`/`LOWER(...) LIKE`); each clause is only appended when the param is present.

:::muted
Hints
:::

`getManyAndCount()` returns `[data, total]` in one call — the natural fit for the `{ data, meta }` envelope. Apply `.skip((page-1)*limit).take(limit)` after the conditional `andWhere`s.
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
40
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Push filter and search down to the data layer, paginate, return the meta envelope
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

Apply the filter and search at the query layer (not in memory), then paginate, and return a `{ data, meta }` envelope so the client can render pager controls without a second round-trip.

:::muted
Technical constraints
:::

- Filtering and search run before pagination; never `findAll()` then filter in Java.
- Response shape is exactly `{ data: User[], meta: { total, page, limit, totalPages } }`; `totalPages = ceil(total / limit)`; an empty result is `total = 0`, `data = []`.
- Build a `Specification<User>` chaining `status` equality and a case-insensitive `name` `like`; each predicate is only added when the param is present.

:::muted
Hints
:::

`Page<User>` already exposes `getTotalElements()` and `getContent()`; remember `PageRequest.of(page-1, limit)` because Spring pages are 0-based.
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
40
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Push filter and search down to the data layer, paginate, return the meta envelope
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

Apply the filter and search at the query layer (not in memory), then paginate, and return a `{ data, meta }` envelope so the client can render pager controls without a second round-trip.

:::muted
Technical constraints
:::

- Filtering and search run before pagination; never `ToListAsync()` everything then filter with LINQ-to-objects.
- Response shape is exactly `{ data: User[], meta: { total, page, limit, totalPages } }`; `totalPages = ceil(total / limit)`; an empty result is `total = 0`, `data = []`.
- Chain `IQueryable.Where(...)` for `status` and a case-insensitive `name` match (`EF.Functions.ILike`); each `Where` is only added when the param is present.

:::muted
Hints
:::

LINQ is deferred — `CountAsync()` then `Skip().Take().ToListAsync()` on the same `IQueryable` runs two SQL statements with the same filters. Use `AsNoTracking()` for the read.
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
40
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Push filter and search down to the data layer, paginate, return the meta envelope
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

Apply the filter and search at the query layer (not in memory), then paginate, and return a `{ data, meta }` envelope so the client can render pager controls without a second round-trip.

:::muted
Technical constraints
:::

- Filtering and search run before pagination; never `Find(&all)` then filter the slice in Go.
- Response shape is exactly `{ data: User[], meta: { total, page, limit, totalPages } }`; `totalPages = ceil(total / limit)`; an empty result is `total = 0`, `data = []`.
- Reassign the chained query (`tx = tx.Where(...)`) for `status` equality and a case-insensitive `name` `ILIKE`; each clause is only added when the param is present.

:::muted
Hints
:::

Clone the GORM session between `Count(&total)` and `Find(&data)` so the `Limit`/`Offset` is not applied to the count query.
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
40
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
Seed data, smoke-test every flow and document a README with evidence
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

Produce reproducible evidence that pagination, filtering and search actually run end-to-end against a populated dataset.

:::muted
Technical constraints
:::

- Seed `>= 50` users (a committed script, not manual inserts) with a mix of `active`/`inactive` statuses so pagination spans multiple pages.
- The README has the 6 sections (Challenge description, How to run, Architecture/Stack, Smoke Test, Code Execution Trace, Design Decisions); the Smoke Test pastes raw output for `page=1`, `page=2`, `status=active`, `search=<word>`, and a `limit=999` → `400` case.
- The Code Execution Trace lists `>= 4` touchpoints for the GET flow (controller → validation → service → query → response shape) with `file:line`.

:::muted
Hints
:::

Use `@faker-js/faker` in `scripts/seed.ts`. Enable the query logger so you can paste the real SQL `WHERE`/`ILIKE` into the Smoke Test as proof the filter ran at the data layer.
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
25
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Seed data, smoke-test every flow and document a README with evidence
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

Produce reproducible evidence that pagination, filtering and search actually run end-to-end against a populated dataset.

:::muted
Technical constraints
:::

- Seed `>= 50` users (a committed `CommandLineRunner` or SQL script, not manual inserts) with a mix of `active`/`inactive` statuses so pagination spans multiple pages.
- The README has the 6 sections (Challenge description, How to run, Architecture/Stack, Smoke Test, Code Execution Trace, Design Decisions); the Smoke Test pastes raw output for `page=1`, `page=2`, `status=active`, `search=<word>`, and a `limit=999` → `400` case.
- The Code Execution Trace lists `>= 4` touchpoints for the GET flow (controller → validation → service → query → response shape) with `file:line`.

:::muted
Hints
:::

Enable `spring.jpa.show-sql=true` so you can paste the real SQL `where`/`lower(...) like` into the Smoke Test as proof the filter ran at the data layer.
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
25
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Seed data, smoke-test every flow and document a README with evidence
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

Produce reproducible evidence that pagination, filtering and search actually run end-to-end against a populated dataset.

:::muted
Technical constraints
:::

- Seed `>= 50` users (a committed seeding routine on startup, not manual inserts) with a mix of `active`/`inactive` statuses so pagination spans multiple pages.
- The README has the 6 sections (Challenge description, How to run, Architecture/Stack, Smoke Test, Code Execution Trace, Design Decisions); the Smoke Test pastes raw output for `page=1`, `page=2`, `status=active`, `search=<word>`, and a `limit=999` → `400` case.
- The Code Execution Trace lists `>= 4` touchpoints for the GET flow (controller → validation → service → query → response shape) with `file:line`.

:::muted
Hints
:::

Set `LogLevel` for `Microsoft.EntityFrameworkCore.Database.Command` to `Information` so you can paste the real SQL `WHERE`/`ILIKE` into the Smoke Test as proof the filter ran at the data layer.
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
25
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Seed data, smoke-test every flow and document a README with evidence
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

Produce reproducible evidence that pagination, filtering and search actually run end-to-end against a populated dataset.

:::muted
Technical constraints
:::

- Seed `>= 50` users (a committed seeding routine, not manual inserts) with a mix of `active`/`inactive` statuses so pagination spans multiple pages.
- The README has the 6 sections (Challenge description, How to run, Architecture/Stack, Smoke Test, Code Execution Trace, Design Decisions); the Smoke Test pastes raw output for `page=1`, `page=2`, `status=active`, `search=<word>`, and a `limit=999` → `400` case.
- The Code Execution Trace lists `>= 4` touchpoints for the GET flow (handler → binding → repository → query → response shape) with `file:line`.

:::muted
Hints
:::

Enable GORM `Logger.Info` so you can paste the real SQL `WHERE`/`ILIKE` into the Smoke Test as proof the filter ran at the data layer.
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
25
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
Build the query DTO and wire validation
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** Create `QueryUsersDto` with `page` (`@Type(() => Number) @IsInt() @Min(1)`, default `1`), `limit` (`@IsInt() @Min(1) @Max(50)`, default `10`), `status?` (`@IsOptional() @IsIn(['active','inactive'])`), `search?` (`@IsOptional() @IsString()`).
- **Step 2:** Use `@Query() query: QueryUsersDto` in the controller and enable `app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))`.
- **Step 3:** Verify `GET /users?limit=999` returns `400` with a clear message.

:::muted
Minimum acceptance criteria
:::

- The DTO has the 4 fields with validator decorators and number casting.
- `limit > 50` or `page < 1` returns `400`.
- Defaults `page=1`, `limit=10` apply when omitted.

:::muted
Nice to have
:::

- `forbidNonWhitelisted: true` rejects unknown query params with `400`.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Build the query DTO and wire validation
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** Create `QueryUsersDto` with `int page = 1` (`@Min(1)`), `int limit = 10` (`@Min(1) @Max(50)`), `String status` (`@Pattern` or checked against the allowed set), `String search`.
- **Step 2:** Annotate the controller class with `@Validated` and the handler parameter with `@Valid QueryUsersDto q`.
- **Step 3:** Verify `GET /users?limit=999` returns `400`.

:::muted
Minimum acceptance criteria
:::

- The DTO has the 4 fields with constraint annotations.
- `limit > 50` or `page < 1` returns `400`.
- Defaults `page=1`, `limit=10` apply when omitted.

:::muted
Nice to have
:::

- A `@ControllerAdvice` mapping `MethodArgumentNotValidException` to a clean `400` body.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Build the query DTO and wire validation
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** Create `QueryUsersDto` with `[Range(1, int.MaxValue)] int Page = 1`, `[Range(1, 50)] int Limit = 10`, `string? Status`, `string? Search`.
- **Step 2:** Take the DTO as an action parameter on a `[ApiController]` controller (or minimal-API handler) so validation runs automatically.
- **Step 3:** Verify `GET /users?limit=999` returns `400`.

:::muted
Minimum acceptance criteria
:::

- The DTO has the 4 fields with `DataAnnotations`.
- `limit > 50` or `page < 1` returns `400`.
- Defaults `Page=1`, `Limit=10` apply when omitted.

:::muted
Nice to have
:::

- A custom validation attribute restricting `Status` to `active`/`inactive`.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Build the query DTO and wire validation
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** Create `QueryUsersDto` struct: `Page int form:"page,default=1" binding:"min=1"`, `Limit int form:"limit,default=10" binding:"min=1,max=50"`, `Status string form:"status" binding:"omitempty,oneof=active inactive"`, `Search string form:"search"`.
- **Step 2:** In the handler call `c.ShouldBindQuery(&dto)`; on error respond `c.JSON(400, ...)`.
- **Step 3:** Verify `GET /users?limit=999` returns `400`.

:::muted
Minimum acceptance criteria
:::

- The struct binds the 4 fields with `form`/`binding` tags.
- `limit > 50` or `page < 1` returns `400`.
- Defaults `page=1`, `limit=10` apply when omitted.

:::muted
Nice to have
:::

- Translate validator errors into a structured `400` body instead of the raw error string.
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
Implement the service: conditional filters, pagination and meta
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** In `UsersService.findAll(query)` start `repo.createQueryBuilder('user')`.
- **Step 2:** Append `.andWhere('user.status = :status', { status })` only when `query.status` is set; append `.andWhere('user.name ILIKE :search', { search: \`%${query.search}%\` })` only when `query.search` is set.
- **Step 3:** Run `.skip((page-1)*limit).take(limit).getManyAndCount()` → `[data, total]`; return `{ data, meta: { total, page, limit, totalPages: Math.ceil(total/limit) } }`.

:::muted
Minimum acceptance criteria
:::

- `GET /users?page=2&limit=10` returns items 11-20.
- `GET /users?status=active` returns only active users.
- `GET /users?search=foo` returns only names containing "foo" (case-insensitive).
- `meta` carries the 4 fields with accurate values.

:::muted
Nice to have
:::

- A typed `PaginatedResponse<User>` instead of an inline object.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Implement the service: conditional filters, pagination and meta
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** Make `UserRepository` extend `JpaSpecificationExecutor<User>`.
- **Step 2:** Build a `Specification<User>`: add `cb.equal(root.get("status"), status)` only when `status` is set; add `cb.like(cb.lower(root.get("name")), "%"+search.toLowerCase()+"%")` only when `search` is set.
- **Step 3:** Call `repo.findAll(spec, PageRequest.of(page-1, limit))`; map the `Page<User>` into `{ data: getContent(), meta: { total: getTotalElements(), page, limit, totalPages } }`.

:::muted
Minimum acceptance criteria
:::

- `GET /users?page=2&limit=10` returns items 11-20.
- `GET /users?status=active` returns only active users.
- `GET /users?search=foo` returns only names containing "foo" (case-insensitive).
- `meta` carries the 4 fields with accurate values.

:::muted
Nice to have
:::

- A record `Meta(long total, int page, int limit, int totalPages)`.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Implement the service: conditional filters, pagination and meta
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** Start `var query = _ctx.Users.AsNoTracking();`.
- **Step 2:** Add `query = query.Where(u => u.Status == status)` only when `status` is set; add `query = query.Where(u => EF.Functions.ILike(u.Name, $"%{search}%"))` only when `search` is set.
- **Step 3:** `var total = await query.CountAsync(); var data = await query.Skip((page-1)*limit).Take(limit).ToListAsync();` return `{ data, meta: { total, page, limit, totalPages = (int)Math.Ceiling((double)total/limit) } }`.

:::muted
Minimum acceptance criteria
:::

- `GET /users?page=2&limit=10` returns items 11-20.
- `GET /users?status=active` returns only active users.
- `GET /users?search=foo` returns only names containing "foo" (case-insensitive).
- `meta` carries the 4 fields with accurate values.

:::muted
Nice to have
:::

- A `record PagedResult<T>(IReadOnlyList<T> Data, Meta Meta)`.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Implement the service: conditional filters, pagination and meta
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** Start `tx := r.db.Model(&User{})`.
- **Step 2:** Reassign `tx = tx.Where("status = ?", status)` only when `status != ""`; reassign `tx = tx.Where("name ILIKE ?", "%"+search+"%")` only when `search != ""`.
- **Step 3:** `var total int64; tx.Count(&total); var data []User; tx.Limit(limit).Offset((page-1)*limit).Find(&data)`; return `{ data, meta: { total, page, limit, totalPages } }`.

:::muted
Minimum acceptance criteria
:::

- `GET /users?page=2&limit=10` returns items 11-20.
- `GET /users?status=active` returns only active users.
- `GET /users?search=foo` returns only names containing "foo" (case-insensitive).
- `meta` carries the 4 fields with accurate values.

:::muted
Nice to have
:::

- A `Meta` struct + generic `Paginated[T]` wrapper.
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
Seed, smoke-test and write the README
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** Write `scripts/seed.ts` with `@faker-js/faker` inserting `>= 50` users with mixed statuses; document the command (`npm run seed`).
- **Step 2:** Run the app and capture raw output for the 5 flows:
  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri "http://localhost:3000/users?page=1&limit=10"

  # macOS / Linux
  curl -s "http://localhost:3000/users?page=1&limit=10"
  ```
- **Step 3:** Paste all 5 responses + the query-logger SQL into the README **Smoke Test**, and write the **Code Execution Trace** `UsersController -> ValidationPipe -> UsersService -> QueryBuilder -> response` with `file:line`.

:::muted
Minimum acceptance criteria
:::

- Reproducible seed (`npm run seed` inserts `>= 50` users).
- README has the 6 sections.
- Smoke Test has `>= 5` flows with raw output, including the `limit=999` → `400` case.
- SQL log proves `WHERE status` + `ILIKE` ran at the data layer.

:::muted
Nice to have
:::

- A mermaid diagram of the pagination flow.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Seed, smoke-test and write the README
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** Write a `CommandLineRunner` (or `data.sql`) inserting `>= 50` users with mixed statuses; document how it runs.
- **Step 2:** Run the app and capture raw output for the 5 flows:
  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri "http://localhost:3000/users?page=1&limit=10"

  # macOS / Linux
  curl -s "http://localhost:3000/users?page=1&limit=10"
  ```
- **Step 3:** Paste all 5 responses + the `show-sql` log into the README **Smoke Test**, and write the **Code Execution Trace** `UserController -> @Valid -> UserService -> Specification -> response` with `file:line`.

:::muted
Minimum acceptance criteria
:::

- Reproducible seed inserts `>= 50` users.
- README has the 6 sections.
- Smoke Test has `>= 5` flows with raw output, including the `limit=999` → `400` case.
- SQL log proves the `where`/`lower(...) like` ran at the data layer.

:::muted
Nice to have
:::

- A mermaid diagram of the pagination flow.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Seed, smoke-test and write the README
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** Add a startup seeding routine inserting `>= 50` users with mixed statuses; document how it runs.
- **Step 2:** Run the app and capture raw output for the 5 flows:
  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri "http://localhost:3000/users?page=1&limit=10"

  # macOS / Linux
  curl -s "http://localhost:3000/users?page=1&limit=10"
  ```
- **Step 3:** Paste all 5 responses + the EF Core command log into the README **Smoke Test**, and write the **Code Execution Trace** `UsersController -> ModelState -> UsersService -> IQueryable -> response` with `file:line`.

:::muted
Minimum acceptance criteria
:::

- Reproducible seed inserts `>= 50` users.
- README has the 6 sections.
- Smoke Test has `>= 5` flows with raw output, including the `limit=999` → `400` case.
- SQL log proves `WHERE status` + `ILIKE` ran at the data layer.

:::muted
Nice to have
:::

- A mermaid diagram of the pagination flow.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Seed, smoke-test and write the README
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** Add a seeding routine inserting `>= 50` users with mixed statuses; document how it runs.
- **Step 2:** Run the app and capture raw output for the 5 flows:
  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri "http://localhost:3000/users?page=1&limit=10"

  # macOS / Linux
  curl -s "http://localhost:3000/users?page=1&limit=10"
  ```
- **Step 3:** Paste all 5 responses + the GORM SQL log into the README **Smoke Test**, and write the **Code Execution Trace** `handler -> ShouldBindQuery -> repository -> gorm query -> response` with `file:line`.

:::muted
Minimum acceptance criteria
:::

- Reproducible seed inserts `>= 50` users.
- README has the 6 sections.
- Smoke Test has `>= 5` flows with raw output, including the `limit=999` → `400` case.
- SQL log proves `WHERE status` + `ILIKE` ran at the data layer.

:::muted
Nice to have
:::

- A mermaid diagram of the pagination flow.
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
You can implement pagination + filter + search on a REST collection with strict query validation and the standard `{ data, meta }` envelope.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
You can implement pagination + filter + search on a REST collection with strict query validation and the standard `{ data, meta }` envelope.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
You can implement pagination + filter + search on a REST collection with strict query validation and the standard `{ data, meta }` envelope.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
You can implement pagination + filter + search on a REST collection with strict query validation and the standard `{ data, meta }` envelope.
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
You can push filter/search down to the query layer (WHERE/ILIKE) instead of filtering in memory, and reason about the meta-payload contract.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
You can push filter/search down to the query layer (WHERE/ILIKE) instead of filtering in memory, and reason about the meta-payload contract.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
You can push filter/search down to the query layer (WHERE/ILIKE) instead of filtering in memory, and reason about the meta-payload contract.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
You can push filter/search down to the query layer (WHERE/ILIKE) instead of filtering in memory, and reason about the meta-payload contract.
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
Completed the EASY version `restful-api-crud-best-practices-easy`.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Completed the EASY version `restful-api-crud-best-practices-easy`.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Completed the EASY version `restful-api-crud-best-practices-easy`.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Completed the EASY version `restful-api-crud-best-practices-easy`.
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
A relational database reachable locally and the connection string read from a config layer (not hardcoded).
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
A relational database reachable locally and the connection string read from a config layer (not hardcoded).
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
A relational database reachable locally and the connection string read from a config layer (not hardcoded).
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
A relational database reachable locally and the connection string read from a config layer (not hardcoded).
<!-- @starci/seperator -->
# difficulty
<!-- @starci/seperator -->
medium
<!-- @starci/seperator -->
# score
<!-- @starci/seperator -->
100
<!-- @starci/seperator -->
# verified
<!-- @starci/seperator -->
2026-06-02
<!-- @starci/seperator -->
