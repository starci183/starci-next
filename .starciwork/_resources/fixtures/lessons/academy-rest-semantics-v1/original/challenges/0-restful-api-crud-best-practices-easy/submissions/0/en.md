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
A public repo with the code (in the language you chose) + a 6-section README with real Smoke Test output showing the status codes.
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
**Create returns 201 with the resource.** `POST /users` with `{"name":"Ada Lovelace","email":"ada@example.com"}` must return HTTP `201` (NOT the NestJS default `200`) and a JSON body with the exact shape `{id, name, email}` — no missing, no extra fields. `id` is a UUID v4 matching `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`; `name`/`email` echo the input exactly. Returning `200`, a wrong shape, or a non-UUID id → FAIL.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Create returns 201 with the resource.** `POST /users` with `{"name":"Ada Lovelace","email":"ada@example.com"}` must return HTTP `201` (NOT the Spring default `200`) and a JSON body with the exact shape `{id, name, email}` — no missing, no extra fields. `id` is a UUID v4 matching `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`; `name`/`email` echo the input exactly. Returning `200`, a wrong shape, or a non-UUID id → FAIL.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Create returns 201 with the resource.** `POST /users` with `{"name":"Ada Lovelace","email":"ada@example.com"}` must return HTTP `201` and a JSON body with the exact shape `{id, name, email}` — no missing, no extra fields. `id` is a UUID v4 matching `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`; `name`/`email` echo the input exactly. Returning `200`, a wrong shape, or a non-UUID id → FAIL.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Create returns 201 with the resource.** `POST /users` with `{"name":"Ada Lovelace","email":"ada@example.com"}` must return HTTP `201` and a JSON body with the exact shape `{id, name, email}` — no missing, no extra fields. `id` is a UUID v4 matching `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`; `name`/`email` echo the input exactly. Returning `200`, a wrong shape, or a non-UUID id → FAIL.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
10
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
**Missing resource returns 404, not an empty 200 (proof the miss path is wired).** `GET /users/{nonexistent-id}` (and `PUT`/`PATCH`/`DELETE` on a missing id) must return HTTP `404`, NOT `200` with `null`/`[]`/empty body. The 404 must come from `NotFoundException` (or equivalent), so the client can tell "missing" from "present but empty". Any miss returning `200`/`204`/`500` instead of `404` → FAIL.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Missing resource returns 404, not an empty 200 (proof the miss path is wired).** `GET /users/{nonexistent-id}` (and `PUT`/`PATCH`/`DELETE` on a missing id) must return HTTP `404`, NOT `200` with `null`/`[]`/empty body. The 404 must come from a deliberate not-found signal (e.g. `ResponseStatusException(NOT_FOUND)`), so the client can tell "missing" from "present but empty". Any miss returning `200`/`204`/`500` instead of `404` → FAIL.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Missing resource returns 404, not an empty 200 (proof the miss path is wired).** `GET /users/{nonexistent-id}` (and `PUT`/`PATCH`/`DELETE` on a missing id) must return HTTP `404`, NOT `200` with `null`/`[]`/empty body. The 404 must come from a deliberate `Results.NotFound()`, so the client can tell "missing" from "present but empty". Any miss returning `200`/`204`/`500` instead of `404` → FAIL.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Missing resource returns 404, not an empty 200 (proof the miss path is wired).** `GET /users/{nonexistent-id}` (and `PUT`/`PATCH`/`DELETE` on a missing id) must return HTTP `404`, NOT `200` with `null`/empty body. The 404 must come from a deliberate `c.Status(http.StatusNotFound)` after `(User, bool)` reports false, so the client can tell "missing" from "present but empty". Any miss returning `200`/`204`/`500` instead of `404` → FAIL.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
10
<!-- @starci/seperator -->
### critical
<!-- @starci/seperator -->
false
<!-- @starci/seperator -->
## 2
### body
#### 0
##### lang
<!-- @starci/seperator -->
typescript
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Delete returns 204 with an empty body and is idempotent on the contract.** `DELETE /users/{id}` on an existing user must return HTTP `204 No Content` with a completely empty body (NOT `200` with a `{deleted:true}` payload). A follow-up `GET /users/{id}` for the same id must then return `404`, proving the delete actually removed state. A `204` that still leaves the resource readable, or a delete that returns `200` with a body → FAIL.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Delete returns 204 with an empty body.** `DELETE /users/{id}` on an existing user must return HTTP `204 No Content` with a completely empty body (NOT `200` with a payload). A follow-up `GET /users/{id}` for the same id must then return `404`, proving the delete actually removed state. A `204` that still leaves the resource readable, or a delete that returns `200` with a body → FAIL.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Delete returns 204 with an empty body.** `DELETE /users/{id}` on an existing user must return HTTP `204 No Content` (`Results.NoContent()`) with a completely empty body (NOT `200` with a payload). A follow-up `GET /users/{id}` for the same id must then return `404`, proving the delete actually removed state. A `204` that still leaves the resource readable, or a delete returning `200` with a body → FAIL.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Delete returns 204 with an empty body.** `DELETE /users/:id` on an existing user must return HTTP `204 No Content` (`c.Status(http.StatusNoContent)`) with a completely empty body (NOT `200` with a payload). A follow-up `GET /users/:id` for the same id must then return `404`, proving the delete actually removed state. A `204` that still leaves the resource readable, or a delete returning `200` with a body → FAIL.
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
**Correct verb-to-operation mapping with no verbs in the URL (verified by reading the code + the routes).** Every operation uses the right HTTP verb on a plural-noun URL: `POST /users` create, `GET /users` + `GET /users/:id` read, `PUT /users/:id` full replace, `PATCH /users/:id` partial, `DELETE /users/:id` remove. Grep the routes: NO verb-in-path like `/getUsers`, `/createUser`, `/deleteUser`, and NO single-verb-for-everything (e.g. `POST /users/update`). Using `POST` (or any one verb) for multiple operations, or putting an action verb in the path → FAIL (critical → zero for the whole challenge).
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Correct verb-to-operation mapping with no verbs in the URL (verified by reading the code + the routes).** Every operation uses the right mapping on a plural-noun URL: `@PostMapping` create, `@GetMapping` read, `@PutMapping` full replace, `@PatchMapping` partial, `@DeleteMapping` remove — all under `/users`. Grep the routes: NO verb-in-path like `/getUsers`, `/createUser`, and NO single-verb-for-everything. Using one verb for multiple operations, or an action verb in the path → FAIL (critical → zero for the whole challenge).
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Correct verb-to-operation mapping with no verbs in the URL (verified by reading the code + the routes).** Every operation uses the right mapping on a plural-noun URL: `MapPost` create, `MapGet` read, `MapPut` full replace, `MapPatch` partial, `MapDelete` remove — all under `/users`. Grep the routes: NO verb-in-path like `/getUsers`, `/createUser`, and NO single-verb-for-everything. Using one verb for multiple operations, or an action verb in the path → FAIL (critical → zero for the whole challenge).
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Correct verb-to-operation mapping with no verbs in the URL (verified by reading the code + the routes).** Every operation uses the right method on a plural-noun URL: `r.POST("/users")` create, `r.GET("/users")` + `r.GET("/users/:id")` read, `r.PUT("/users/:id")` full replace, `r.PATCH("/users/:id")` partial, `r.DELETE("/users/:id")` remove. Grep the routes: NO verb-in-path like `/getUsers`, `/createUser`, and NO single-method-for-everything. Using one method for multiple operations, or an action verb in the path → FAIL (critical → zero for the whole challenge).
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
**Clean controller/service split + PUT vs PATCH semantics + evidence (verified by reading the code + README).** The controller holds only routing + `@HttpCode`; the in-memory `Map` is touched ONLY inside `UserService`. PUT must overwrite the whole resource (a field omitted from the PUT body resets to default/empty), while PATCH must change only the sent fields (omitted fields keep their previous values, distinguished via `!== undefined` not `??`) — prove it by `PUT` with one field then `PATCH` with the other and observing the difference. README has all 6 sections (Challenge description, How to run, Architecture/Stack, Smoke Test, Code Execution Trace, Design Decisions); the Smoke Test pastes REAL output. Controller touching the store directly, PUT and PATCH behaving identically, or fabricated output → FAIL.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Clean controller/service split + PUT vs PATCH semantics + evidence (verified by reading the code + README).** The controller holds only routing + status; the in-memory `Map` is touched ONLY inside `@Service UserService`, injected via the constructor. PUT must overwrite the whole resource (a field omitted from the PUT body resets to default/empty), while PATCH must change only the sent fields (omitted fields keep their previous values, non-null check) — prove it by `PUT` with one field then `PATCH` with the other. README has all 6 sections; the Smoke Test pastes REAL output. Controller touching the store directly, PUT and PATCH behaving identically, or fabricated output → FAIL.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Clean handler/service split + PUT vs PATCH semantics + evidence (verified by reading the code + README).** The endpoint handlers hold only routing + `Results.*`; the in-memory `Dictionary` is touched ONLY inside `UserService` (resolved from the container). PUT must overwrite the whole resource (a field omitted from the PUT body resets to default/empty), while PATCH must change only the sent fields (non-null check) — prove it by `PUT` with one field then `PATCH` with the other. README has all 6 sections; the Smoke Test pastes REAL output. Endpoint touching the store directly, PUT and PATCH behaving identically, or fabricated output → FAIL.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Clean handler/service split + PUT vs PATCH semantics + evidence (verified by reading the code + README).** The handler holds only routing + status; the `map` is touched ONLY inside `UserService` (received via `NewHandler`, wired in `main`). PUT must overwrite the whole resource (a field omitted from the PUT body resets to default/empty), while PATCH must change only the sent fields (use `*string` pointers so an omitted field stays unchanged) — prove it by `PUT` with one field then `PATCH` with the other. README has all 6 sections; the Smoke Test pastes REAL output. Handler touching the map directly, PUT and PATCH behaving identically, or fabricated output → FAIL.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
30
<!-- @starci/seperator -->
### critical
<!-- @starci/seperator -->
false
<!-- @starci/seperator -->
