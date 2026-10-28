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
A public repo with the code (in the language you chose) + a 6-section README with real Smoke Test output proving pagination, filter and search run against a populated dataset.
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
**Checks what.** The envelope shape and pagination math of `GET /users`. **Observable evidence.** `GET /users?page=1&limit=10` returns HTTP `200` with the exact shape `{ data: User[], meta: { total, page, limit, totalPages } }` — no extra, no missing fields. With a seeded `total` of `N`, `meta.totalPages` must equal `ceil(N / limit)`, `meta.page`/`meta.limit` echo the request, and `data.length <= limit`. `GET /users?page=2&limit=10` returns the second window (items 11-20, disjoint from page 1). **Fail if:** wrong HTTP code, shape mismatch, `totalPages != ceil(total/limit)`, or page 2 returns the same rows as page 1.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Checks what.** The envelope shape and pagination math of `GET /users`. **Observable evidence.** `GET /users?page=1&limit=10` returns HTTP `200` with the exact shape `{ data: User[], meta: { total, page, limit, totalPages } }` — no extra, no missing fields. With a seeded `total` of `N`, `meta.totalPages` must equal `ceil(N / limit)`, `meta.page`/`meta.limit` echo the request, and `data.length <= limit`. `GET /users?page=2&limit=10` returns the second window (items 11-20, disjoint from page 1). **Fail if:** wrong HTTP code, shape mismatch, `totalPages != ceil(total/limit)`, or page 2 returns the same rows as page 1.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Checks what.** The envelope shape and pagination math of `GET /users`. **Observable evidence.** `GET /users?page=1&limit=10` returns HTTP `200` with the exact shape `{ data: User[], meta: { total, page, limit, totalPages } }` — no extra, no missing fields. With a seeded `total` of `N`, `meta.totalPages` must equal `ceil(N / limit)`, `meta.page`/`meta.limit` echo the request, and `data.length <= limit`. `GET /users?page=2&limit=10` returns the second window (items 11-20, disjoint from page 1). **Fail if:** wrong HTTP code, shape mismatch, `totalPages != ceil(total/limit)`, or page 2 returns the same rows as page 1.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Checks what.** The envelope shape and pagination math of `GET /users`. **Observable evidence.** `GET /users?page=1&limit=10` returns HTTP `200` with the exact shape `{ data: User[], meta: { total, page, limit, totalPages } }` — no extra, no missing fields. With a seeded `total` of `N`, `meta.totalPages` must equal `ceil(N / limit)`, `meta.page`/`meta.limit` echo the request, and `data.length <= limit`. `GET /users?page=2&limit=10` returns the second window (items 11-20, disjoint from page 1). **Fail if:** wrong HTTP code, shape mismatch, `totalPages != ceil(total/limit)`, or page 2 returns the same rows as page 1.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
20
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
**Checks what.** That `meta.total` reflects the filtered/searched result set, not the whole table. **Observable evidence.** Seed a known mix (e.g. 30 `active`, 20 `inactive`). `GET /users?status=active` returns only `active` rows AND `meta.total === 30` (the filtered count, not 50); paging that filtered set yields `ceil(30/limit)` pages. `GET /users?search=<word>` returns only rows whose `name` contains the word case-insensitively, with `meta.total` equal to the real match count in the DB. **Fail if:** `meta.total` reports the unfiltered table count while `data` is filtered (a classic count/data mismatch), the filter leaks non-matching rows, or search is case-sensitive when it should not be.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Checks what.** That `meta.total` reflects the filtered/searched result set, not the whole table. **Observable evidence.** Seed a known mix (e.g. 30 `active`, 20 `inactive`). `GET /users?status=active` returns only `active` rows AND `meta.total === 30` (the filtered count, not 50); paging that filtered set yields `ceil(30/limit)` pages. `GET /users?search=<word>` returns only rows whose `name` contains the word case-insensitively, with `meta.total` equal to the real match count in the DB. **Fail if:** `meta.total` reports the unfiltered table count while `data` is filtered (a classic count/data mismatch), the filter leaks non-matching rows, or search is case-sensitive when it should not be.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Checks what.** That `meta.total` reflects the filtered/searched result set, not the whole table. **Observable evidence.** Seed a known mix (e.g. 30 `active`, 20 `inactive`). `GET /users?status=active` returns only `active` rows AND `meta.total === 30` (the filtered count, not 50); paging that filtered set yields `ceil(30/limit)` pages. `GET /users?search=<word>` returns only rows whose `name` contains the word case-insensitively, with `meta.total` equal to the real match count in the DB. **Fail if:** `meta.total` reports the unfiltered table count while `data` is filtered (a classic count/data mismatch), the filter leaks non-matching rows, or search is case-sensitive when it should not be.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Checks what.** That `meta.total` reflects the filtered/searched result set, not the whole table. **Observable evidence.** Seed a known mix (e.g. 30 `active`, 20 `inactive`). `GET /users?status=active` returns only `active` rows AND `meta.total === 30` (the filtered count, not 50); paging that filtered set yields `ceil(30/limit)` pages. `GET /users?search=<word>` returns only rows whose `name` contains the word case-insensitively, with `meta.total` equal to the real match count in the DB. **Fail if:** `meta.total` reports the unfiltered table count while `data` is filtered (a classic count/data mismatch), the filter leaks non-matching rows, or search is case-sensitive when it should not be.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
10
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
**Checks what.** That filtering and search execute at the query layer, not in application memory (verified by reading the code + the SQL log). **Observable evidence.** `UsersService.findAll` builds a single `createQueryBuilder` with conditional `.andWhere('user.status = :status', ...)` and `.andWhere('user.name ILIKE :search', ...)` appended only when the param is present, followed by `.skip().take().getManyAndCount()`. The README Smoke Test pastes the TypeORM query log showing the `WHERE ... ILIKE ...` clause reaching the DB. Grep the repo: NO `repo.find()` / `getMany()` of all rows followed by an in-memory `.filter()`/`.slice()`. **Fail if:** the service fetches everything then filters/paginates in JS, the `WHERE`/`ILIKE` clause is absent from the SQL log, or a literal `WHERE status = NULL` is generated because the clause was not made conditional → FAIL (critical → zero for the whole challenge).
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Checks what.** That filtering and search execute at the query layer, not in application memory (verified by reading the code + the SQL log). **Observable evidence.** The service builds a `Specification<User>` adding `cb.equal(root.get("status"), ...)` and `cb.like(cb.lower(root.get("name")), ...)` only when the param is present, then calls `repo.findAll(spec, PageRequest.of(page-1, limit))`. The README Smoke Test pastes the Hibernate `show-sql` log showing the `where ... lower(...) like ...` clause reaching the DB. Grep the repo: NO `findAll()` of all rows then a Java-stream `.filter()`. **Fail if:** the service loads everything then filters/paginates in Java, the `where`/`like` clause is absent from the SQL log, or a predicate is added unconditionally for an empty param → FAIL (critical → zero for the whole challenge).
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Checks what.** That filtering and search execute at the query layer, not in application memory (verified by reading the code + the SQL log). **Observable evidence.** The service chains `IQueryable.Where(u => u.Status == ...)` and `Where(u => EF.Functions.ILike(u.Name, ...))` only when the param is present, then `CountAsync()` + `Skip().Take().ToListAsync()` on the same deferred query. The README Smoke Test pastes the EF Core command log showing the `WHERE ... ILIKE ...` clause reaching the DB. Grep the repo: NO `ToListAsync()` of all rows then a LINQ-to-objects `.Where()`/`.Skip()`. **Fail if:** the service materializes everything then filters/paginates in memory, the `WHERE`/`ILIKE` clause is absent from the SQL log, or a `Where` is added unconditionally for an empty param → FAIL (critical → zero for the whole challenge).
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Checks what.** That filtering and search execute at the query layer, not in application memory (verified by reading the code + the SQL log). **Observable evidence.** The repository reassigns a chained GORM query `tx = tx.Where("status = ?", ...)` and `tx = tx.Where("name ILIKE ?", ...)` only when the param is non-empty, then `Count(&total)` and `Limit().Offset().Find(&data)` (with a cloned session for the count). The README Smoke Test pastes the GORM SQL log showing the `WHERE ... ILIKE ...` clause reaching the DB. Grep the repo: NO `Find(&all)` of all rows then a slice-level filter. **Fail if:** the repo loads everything then filters/paginates in Go, the `WHERE`/`ILIKE` clause is absent from the SQL log, or a `Where` is added unconditionally for an empty param → FAIL (critical → zero for the whole challenge).
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
**Checks what.** That query params are validated through a typed DTO with correct defaults and bounds (validation proof, not happy-path only). **Observable evidence.** A `QueryUsersDto` declares `page`/`limit` with `@Type(() => Number) @IsInt() @Min(1)` and `@Max(50)` on `limit`, plus `@IsOptional() @IsIn(['active','inactive'])` on `status`; `ValidationPipe({ transform: true })` is enabled. `GET /users?limit=999` and `GET /users?page=0` return HTTP `400`; `GET /users` with no params applies `page=1`, `limit=10`. The README Smoke Test pastes the raw `400` response for `limit=999`. **Fail if:** out-of-range `limit`/`page` returns `200` instead of `400`, defaults are hardcoded in the controller instead of validated via the DTO, or the query string is read as a raw `string` without numeric casting.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Checks what.** That query params are validated through a typed DTO with correct defaults and bounds (validation proof, not happy-path only). **Observable evidence.** A `QueryUsersDto` declares `int page = 1` with `@Min(1)` and `int limit = 10` with `@Min(1) @Max(50)`, with `status` constrained to the allowed set; the controller is `@Validated` and the parameter `@Valid`. `GET /users?limit=999` and `GET /users?page=0` return HTTP `400`; `GET /users` with no params applies `page=1`, `limit=10`. The README Smoke Test pastes the raw `400` response for `limit=999`. **Fail if:** out-of-range `limit`/`page` returns `200` instead of `400`, defaults are hardcoded in the controller instead of the DTO, or constraints are missing so invalid input passes.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Checks what.** That query params are validated through a typed DTO with correct defaults and bounds (validation proof, not happy-path only). **Observable evidence.** A `QueryUsersDto` declares `[Range(1, int.MaxValue)] int Page = 1` and `[Range(1, 50)] int Limit = 10`, with `Status` restricted to the allowed set; the `[ApiController]` auto-validates `ModelState`. `GET /users?limit=999` and `GET /users?page=0` return HTTP `400`; `GET /users` with no params applies `Page=1`, `Limit=10`. The README Smoke Test pastes the raw `400` response for `limit=999`. **Fail if:** out-of-range `limit`/`page` returns `200` instead of `400`, defaults are hardcoded in the controller instead of the DTO, or the `[Range]`/`ModelState` check is missing so invalid input passes.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Checks what.** That query params are validated through a typed DTO with correct defaults and bounds (validation proof, not happy-path only). **Observable evidence.** A `QueryUsersDto` struct declares `Page int form:"page,default=1" binding:"min=1"` and `Limit int form:"limit,default=10" binding:"min=1,max=50"`, with `Status` `binding:"omitempty,oneof=active inactive"`; the handler calls `c.ShouldBindQuery(&dto)` and returns `400` on error. `GET /users?limit=999` and `GET /users?page=0` return HTTP `400`; `GET /users` with no params applies `page=1`, `limit=10`. The README Smoke Test pastes the raw `400` response for `limit=999`. **Fail if:** out-of-range `limit`/`page` returns `200` instead of `400`, defaults are hardcoded in the handler instead of the binding tags, or the bind error is ignored so invalid input passes.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
30
<!-- @starci/seperator -->
### critical
<!-- @starci/seperator -->
false
<!-- @starci/seperator -->
