# sortIndex
<!-- @starci/seperator -->
1
<!-- @starci/seperator -->
# title
<!-- @starci/seperator -->
Build a CRUD resource that respects the HTTP verb and status code contract
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
Build a `users` resource with full CRUD that follows REST semantics: a plural-noun URL, the right verb for each operation, and the right status code for each outcome — `201` on create, `200` on read, `204` on delete, `404` when missing. Split the HTTP adapter (controller/handler) from the business logic (service). Pick your language; every language returns the same output contract.
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
Model the `users` resource with a plural-noun URL and split controller from service
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

Design a `users` resource that follows REST naming: the URL is the plural noun `/users`, never a verb in the path. Keep the HTTP adapter (`UserController`) separate from the business logic (`UserService`).

:::muted
Technical constraints
:::

- URLs use the plural noun `/users` and `/users/:id` — NO `/getUsers`, `/createUser`, `/deleteUser` style verbs in the path.
- `UserController` only maps verb → handler and sets status codes; it holds NO business logic and never touches the store directly.
- `UserService` owns the in-memory store and exposes a method per operation (`create`, `findAll`, `findOne`, `replace`, `patch`, `remove`).
- Register `UserModule` (controller + service provider) into `AppModule`.

:::muted
Hints
:::

`@Controller("users")` sets the path prefix; handlers declare only sub-paths (`""` or `":id"`). Generate with `nest g module/controller/service user` to keep the folder convention.
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
Model the `users` resource with a plural-noun URL and split controller from service
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

Design a `users` resource that follows REST naming: the URL is the plural noun `/users`, never a verb in the path. Keep the HTTP adapter (`UserController`) separate from the business logic (`UserService`).

:::muted
Technical constraints
:::

- URLs use the plural noun `/users` and `/users/{id}` — NO verbs like `/getUsers`, `/createUser` in the path.
- `UserController` (`@RestController`) only maps verb → handler and sets status codes; NO business logic, never touches the store directly.
- `UserService` (`@Service`) owns the in-memory store and exposes a method per operation (`create`, `findAll`, `findOne`, `replace`, `patch`, `remove`).
- `UserController` receives `UserService` via constructor injection (Spring auto-wires the single constructor).

:::muted
Hints
:::

Use `@RequestMapping("/users")` on the controller; map verbs with `@PostMapping`/`@GetMapping`/`@PutMapping`/`@PatchMapping`/`@DeleteMapping`. Scaffold via Spring Initializr (`spring-boot-starter-web`).
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
Model the `users` resource with a plural-noun URL and split the handler from the service
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

Design a `users` resource that follows REST naming: the URL is the plural noun `/users`, never a verb in the path. Keep the HTTP adapter separate from the business logic (`UserService`).

:::muted
Technical constraints
:::

- URLs use the plural noun `/users` and `/users/{id}` — NO verbs like `/getUsers`, `/createUser` in the path.
- The HTTP adapter (minimal-API endpoints in `Program.cs` or a `UsersController`) only maps verb → handler and sets status codes; NO business logic, never touches the store directly.
- `UserService` owns the in-memory store and exposes a method per operation (`Create`, `FindAll`, `FindOne`, `Replace`, `Patch`, `Remove`).
- `UserService` is registered into the IoC container with `AddSingleton` and resolved by the container (no `new UserService()`).

:::muted
Hints
:::

`dotnet new web` for the minimal API; map verbs with `MapPost`/`MapGet`/`MapPut`/`MapPatch`/`MapDelete` under the `/users` prefix.
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
Model the `users` resource with a plural-noun URL and split the handler from the service
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

Design a `users` resource that follows REST naming: the URL is the plural noun `/users`, never a verb in the path. Keep the HTTP handler separate from the business logic (`UserService`).

:::muted
Technical constraints
:::

- URLs use the plural noun `/users` and `/users/:id` — NO verbs like `/getUsers`, `/createUser` in the path.
- The HTTP handler only maps verb → operation and sets status codes; NO business logic, never touches the store directly.
- `UserService` owns the in-memory store (guarded by a mutex) and exposes a method per operation (`Create`, `FindAll`, `FindOne`, `Replace`, `Patch`, `Remove`).
- The handler receives `*UserService` via a constructor function `NewHandler(svc *UserService)`; wiring lives in `main`.

:::muted
Hints
:::

`go mod init`; `go get` gin + `github.com/google/uuid`. Use method-specific routes (`r.POST("/users", ...)`, `r.GET("/users/:id", ...)`).
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
Implement all five operations with the correct verb and status code
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

Wire each HTTP verb to its CRUD operation and return the exact status code the REST contract expects for every outcome.

:::muted
Technical constraints
:::

- `POST /users` accepts `{name, email}` → returns HTTP 201 + the created user `{id, name, email}`; `id` is a UUID v4 generated by `crypto.randomUUID()`.
- `GET /users` → 200 + an array; `GET /users/:id` → 200 + the user when found, 404 when missing.
- `PUT /users/:id` → 200 + the fully replaced user; `PATCH /users/:id` → 200 + the partially updated user (only sent fields change); both → 404 when missing.
- `DELETE /users/:id` → 204 No Content (empty body) on success, 404 when missing.
- A missing id NEVER returns `200` with `null` or an empty body — it throws `NotFoundException` → 404.

:::muted
Hints
:::

NestJS defaults to `200`; force `@HttpCode(201)` on create and `@HttpCode(204)` on delete. Throw `new NotFoundException(...)` for misses; distinguish PATCH fields with `!== undefined`, not `??`.
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
Implement all five operations with the correct verb and status code
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

Wire each HTTP verb to its CRUD operation and return the exact status code the REST contract expects for every outcome.

:::muted
Technical constraints
:::

- `POST /users` accepts `{name, email}` → returns HTTP 201 + the created user `{id, name, email}`; `id` = `UUID.randomUUID().toString()`.
- `GET /users` → 200 + a list; `GET /users/{id}` → 200 + the user when found, 404 when missing.
- `PUT /users/{id}` → 200 + the fully replaced user; `PATCH /users/{id}` → 200 + the partially updated user (only sent fields change); both → 404 when missing.
- `DELETE /users/{id}` → 204 No Content (empty body) on success, 404 when missing.
- A missing id NEVER returns `200` with `null` — it returns a `404` (e.g. `ResponseStatusException(HttpStatus.NOT_FOUND)`).

:::muted
Hints
:::

Set the create status with `@ResponseStatus(HttpStatus.CREATED)` and delete with `@ResponseStatus(HttpStatus.NO_CONTENT)`, or return `ResponseEntity.status(...)`. For PATCH, only overwrite a field when its incoming value is non-null.
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
Implement all five operations with the correct verb and status code
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

Wire each HTTP verb to its CRUD operation and return the exact status code the REST contract expects for every outcome.

:::muted
Technical constraints
:::

- `POST /users` accepts `{name, email}` → returns HTTP 201 + the created user `{id, name, email}`; `id` = `Guid.NewGuid().ToString()`.
- `GET /users` → 200 + a list; `GET /users/{id}` → 200 + the user when found, 404 when missing.
- `PUT /users/{id}` → 200 + the fully replaced user; `PATCH /users/{id}` → 200 + the partially updated user (only sent fields change); both → 404 when missing.
- `DELETE /users/{id}` → 204 No Content (empty body) on success, 404 when missing.
- A missing id NEVER returns `200` with `null` — it returns `Results.NotFound()` → 404.

:::muted
Hints
:::

In a minimal API use `Results.Created(...)`, `Results.Ok(...)`, `Results.NoContent()`, `Results.NotFound()` — each helper sets the right status code. For PATCH, only overwrite a field when its incoming value is non-null.
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
Implement all five operations with the correct verb and status code
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

Wire each HTTP verb to its CRUD operation and return the exact status code the REST contract expects for every outcome.

:::muted
Technical constraints
:::

- `POST /users` accepts `{name, email}` → returns HTTP 201 + the created user `{id, name, email}`; `id` = `uuid.NewString()`.
- `GET /users` → 200 + an array; `GET /users/:id` → 200 + the user when found, 404 when missing.
- `PUT /users/:id` → 200 + the fully replaced user; `PATCH /users/:id` → 200 + the partially updated user (only sent fields change); both → 404 when missing.
- `DELETE /users/:id` → 204 No Content (empty body) on success, 404 when missing.
- A missing id NEVER returns `200` with `null` — return `c.JSON(http.StatusNotFound, ...)` or `c.Status(http.StatusNotFound)`.

:::muted
Hints
:::

Set status explicitly with `c.JSON(http.StatusCreated, user)` and `c.Status(http.StatusNoContent)`. Use a struct with json tags to keep field names stable; for PATCH use `*string` pointer fields to tell "field omitted" from "field set to empty".
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
Scaffold the project and the UserService store
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** `nest new rest-users-crud` then `cd` into the folder.
- **Step 2:** Scaffold the resource: `nest g module user`, `nest g controller user`, `nest g service user`.
- **Step 3:** In `UserService`, back the data with an in-memory `Map<string, User>` and implement `create`, `findAll`, `findOne`, `replace`, `patch`, `remove`; throw `NotFoundException` from `findOne`/`replace`/`patch`/`remove` when the id is absent.

:::muted
Minimum acceptance criteria
:::

- `npm run start:dev` boots with no errors.
- `UserService` is the only place touching the `Map`; the controller never reads/writes it directly.

:::muted
Nice to have
:::

- A `CreateUserDto` + `ValidationPipe` to reject a missing `name`/`email`.
- A separate `User` type/interface instead of an inline object shape.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Scaffold the project and the UserService store
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** Create the project via Spring Initializr (dependency `spring-boot-starter-web`), base-package `com.example`.
- **Step 2:** Create package `com.example.user` with `@Service UserService` and a `record User(String id, String name, String email)`.
- **Step 3:** Back the data with an in-memory `Map<String, User>`; implement `create`, `findAll`, `findOne`, `replace`, `patch`, `remove`; throw a `404` (`ResponseStatusException`) when the id is absent.

:::muted
Minimum acceptance criteria
:::

- `mvn spring-boot:run` boots with no errors.
- `UserService` is `@Service` and is the only place touching the `Map`.

:::muted
Nice to have
:::

- A request DTO + `@Valid` to reject missing fields.
- Extract a `UserStore` interface to prepare for a swap.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Scaffold the minimal API and the UserService store
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** `dotnet new web -o RestUsersCrud` then `cd` into it.
- **Step 2:** Create `Services/UserService.cs` with a `record User(string Id, string Name, string Email)` and an in-memory `Dictionary<string, User>`.
- **Step 3:** Implement `Create`, `FindAll`, `FindOne`, `Replace`, `Patch`, `Remove`; have lookups return a null/`bool` the handler can turn into a `404`. Register `builder.Services.AddSingleton<UserService>()`.

:::muted
Minimum acceptance criteria
:::

- `dotnet run` runs with no errors.
- `UserService` is the only place touching the `Dictionary` and is resolved from the container.

:::muted
Nice to have
:::

- DataAnnotations on the request body to reject missing fields.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Initialize the Go module and the UserService store
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** `go mod init rest-users-crud`; `go get github.com/gin-gonic/gin github.com/google/uuid`.
- **Step 2:** Create a `user` package with `type User struct` (json tags) and `type UserService struct` backed by a `map[string]User` guarded by a `sync.Mutex`.
- **Step 3:** Implement `Create`, `FindAll`, `FindOne`, `Replace`, `Patch`, `Remove`; lookups return `(User, bool)` so the handler can answer `404` when the bool is false.

:::muted
Minimum acceptance criteria
:::

- `go run .` runs with no errors.
- `UserService` is the only place touching the map; access is mutex-guarded.

:::muted
Nice to have
:::

- Define a `Store` interface to prepare for a swap + a mock test.
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
Map verbs to handlers and pin the status codes
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** `@Controller("users")`; inject `UserService` via the constructor.
- **Step 2:** Add handlers: `@Post()` + `@HttpCode(201)` create; `@Get()` list; `@Get(":id")` read; `@Put(":id")` full replace; `@Patch(":id")` partial; `@Delete(":id")` + `@HttpCode(204)` remove.
- **Step 3:** For PUT, overwrite every field; for PATCH, only overwrite fields where the value `!== undefined`.
- **Step 4:** Let `NotFoundException` thrown by the service bubble up — NestJS converts it to a 404 with a JSON body.

:::muted
Minimum acceptance criteria
:::

- Each verb has exactly one handler with the correct `@HttpCode`.
- No business logic lives in the controller.

:::muted
Nice to have
:::

- An `UpdateUserDto` for PATCH that marks every field optional.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Map verbs to handlers and pin the status codes
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** `@RestController @RequestMapping("/users")`; inject `UserService` via the constructor.
- **Step 2:** Add handlers: `@PostMapping` + `@ResponseStatus(CREATED)` create; `@GetMapping` list; `@GetMapping("/{id}")` read; `@PutMapping("/{id}")` full replace; `@PatchMapping("/{id}")` partial; `@DeleteMapping("/{id}")` + `@ResponseStatus(NO_CONTENT)` remove.
- **Step 3:** For PUT, overwrite every field; for PATCH, only overwrite fields whose incoming value is non-null.
- **Step 4:** When the service signals a miss, return a `404` (let `ResponseStatusException` propagate).

:::muted
Minimum acceptance criteria
:::

- Each verb has exactly one handler with the correct status code.
- No business logic lives in the controller.

:::muted
Nice to have
:::

- A dedicated update DTO for PATCH with optional fields.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Map verbs to endpoints and pin the status codes
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** In `Program.cs`, resolve `UserService` from the container in each endpoint handler.
- **Step 2:** Map endpoints: `MapPost("/users", ...)` → `Results.Created(...)`; `MapGet("/users", ...)` → `Results.Ok(...)`; `MapGet("/users/{id}", ...)`; `MapPut("/users/{id}", ...)`; `MapPatch("/users/{id}", ...)`; `MapDelete("/users/{id}", ...)` → `Results.NoContent()`.
- **Step 3:** For PUT, overwrite every field; for PATCH, only overwrite fields whose incoming value is non-null.
- **Step 4:** When the service signals a miss, return `Results.NotFound()` → 404.

:::muted
Minimum acceptance criteria
:::

- Each verb has exactly one endpoint with the correct `Results.*` status helper.
- No business logic lives in the endpoint handler.

:::muted
Nice to have
:::

- A separate patch DTO with nullable fields.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Map verbs to handlers, wire in main, and pin the status codes
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** Create a `Handler` struct holding `*UserService` via `NewHandler(svc *UserService)`.
- **Step 2:** Register routes: `r.POST("/users", ...)` → `c.JSON(201, ...)`; `r.GET("/users", ...)`; `r.GET("/users/:id", ...)`; `r.PUT("/users/:id", ...)`; `r.PATCH("/users/:id", ...)`; `r.DELETE("/users/:id", ...)` → `c.Status(204)`.
- **Step 3:** For PUT, overwrite every field; for PATCH, use `*string` pointers so an omitted field stays unchanged.
- **Step 4:** In `main`, create `UserService`, build the `Handler`, register routes, and run gin.

:::muted
Minimum acceptance criteria
:::

- Each verb has exactly one route with the correct status code.
- Wiring lives in `main`; no business logic in the handler.

:::muted
Nice to have
:::

- `binding:"required"` tags on the create body.
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
Smoke test the contract and write a README
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** `npm run start:dev`.
- **Step 2:** Run the create → read → delete sequence:
  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri "http://localhost:3000/users" -Method Post -Body (@{ name = "Ada Lovelace"; email = "ada@example.com" } | ConvertTo-Json) -ContentType "application/json"

  # macOS / Linux
  curl -i -X POST http://localhost:3000/users -H "Content-Type: application/json" -d '{"name":"Ada Lovelace","email":"ada@example.com"}'
  ```
- **Step 3:** Read a missing id and confirm a `404`; delete the created id and confirm a `204` with an empty body.
- **Step 4:** Paste the real responses (with status lines) into the README **Smoke Test** section (no fabrication).

:::muted
Minimum acceptance criteria
:::

- `POST` returns `201`, `GET` missing returns `404`, `DELETE` returns `204` with no body — all confirmed by real output.
- README has 6 sections: Challenge description, How to run, Architecture/Stack, Smoke Test, Code Execution Trace, Design Decisions.

:::muted
Nice to have
:::

- A terminal screenshot of the status codes pasted into the README.
- Measure cold-start with `time npm run start`.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Smoke test the contract and write a README
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** `mvn spring-boot:run`.
- **Step 2:** Run the create → read → delete sequence:
  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri "http://localhost:3000/users" -Method Post -Body (@{ name = "Ada Lovelace"; email = "ada@example.com" } | ConvertTo-Json) -ContentType "application/json"

  # macOS / Linux
  curl -i -X POST http://localhost:3000/users -H "Content-Type: application/json" -d '{"name":"Ada Lovelace","email":"ada@example.com"}'
  ```
- **Step 3:** Read a missing id and confirm a `404`; delete the created id and confirm a `204` with an empty body.
- **Step 4:** Paste the real responses (with status lines) into the README **Smoke Test** section.

:::muted
Minimum acceptance criteria
:::

- `POST` returns `201`, `GET` missing returns `404`, `DELETE` returns `204` with no body — confirmed by real output.
- README has 6 sections.

:::muted
Nice to have
:::

- Terminal screenshot; measure boot time.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Smoke test the contract and write a README
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** `dotnet run`.
- **Step 2:** Run the create → read → delete sequence:
  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri "http://localhost:3000/users" -Method Post -Body (@{ name = "Ada Lovelace"; email = "ada@example.com" } | ConvertTo-Json) -ContentType "application/json"

  # macOS / Linux
  curl -i -X POST http://localhost:3000/users -H "Content-Type: application/json" -d '{"name":"Ada Lovelace","email":"ada@example.com"}'
  ```
- **Step 3:** Read a missing id and confirm a `404`; delete the created id and confirm a `204` with an empty body.
- **Step 4:** Paste the real responses (with status lines) into the README **Smoke Test** section.

:::muted
Minimum acceptance criteria
:::

- `POST` returns `201`, `GET` missing returns `404`, `DELETE` returns `204` with no body — confirmed by real output.
- README has 6 sections.

:::muted
Nice to have
:::

- Terminal screenshot.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Smoke test the contract and write a README
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** `go run .`.
- **Step 2:** Run the create → read → delete sequence:
  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri "http://localhost:3000/users" -Method Post -Body (@{ name = "Ada Lovelace"; email = "ada@example.com" } | ConvertTo-Json) -ContentType "application/json"

  # macOS / Linux
  curl -i -X POST http://localhost:3000/users -H "Content-Type: application/json" -d '{"name":"Ada Lovelace","email":"ada@example.com"}'
  ```
- **Step 3:** Read a missing id and confirm a `404`; delete the created id and confirm a `204` with an empty body.
- **Step 4:** Paste the real responses (with status lines) into the README **Smoke Test** section.

:::muted
Minimum acceptance criteria
:::

- `POST` returns `201`, `GET` missing returns `404`, `DELETE` returns `204` with no body — confirmed by real output.
- README has 6 sections.

:::muted
Nice to have
:::

- Terminal screenshot.
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
You can model a resource the REST way: a plural-noun URL, a clean controller/service split, and one verb per operation.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
You can model a resource the REST way: a plural-noun URL, a clean controller/service split, and one verb per operation.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
You can model a resource the REST way: a plural-noun URL, a clean handler/service split, and one verb per operation.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
You can model a resource the REST way: a plural-noun URL, a clean handler/service split, and one verb per operation.
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
You return the right status code for every outcome — `201` create, `200` read, `204` delete, `404` missing — so the client reads the result from the status line alone.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
You return the right status code for every outcome — `201` create, `200` read, `204` delete, `404` missing — so the client reads the result from the status line alone.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
You return the right status code for every outcome — `201` create, `200` read, `204` delete, `404` missing — so the client reads the result from the status line alone.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
You return the right status code for every outcome — `201` create, `200` read, `204` delete, `404` missing — so the client reads the result from the status line alone.
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
Node.js >= 18 + NestJS CLI (`npm i -g @nestjs/cli`).
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
JDK 21 + Maven.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
.NET SDK 8.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Go 1.22+.
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
Understand HTTP verbs, status codes (`201`/`200`/`204`/`404`), and the difference between `PUT` (full replace) and `PATCH` (partial).
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Understand HTTP verbs, status codes (`201`/`200`/`204`/`404`), and the difference between `PUT` (full replace) and `PATCH` (partial).
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Understand HTTP verbs, status codes (`201`/`200`/`204`/`404`), and the difference between `PUT` (full replace) and `PATCH` (partial).
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Understand HTTP verbs, status codes (`201`/`200`/`204`/`404`), and the difference between `PUT` (full replace) and `PATCH` (partial).
<!-- @starci/seperator -->
# difficulty
<!-- @starci/seperator -->
easy
<!-- @starci/seperator -->
# score
<!-- @starci/seperator -->
100
<!-- @starci/seperator -->
# verified
<!-- @starci/seperator -->
2026-06-02
<!-- @starci/seperator -->
