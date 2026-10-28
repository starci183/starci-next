# sortIndex
<!-- @starci/seperator -->
1
<!-- @starci/seperator -->
# title
<!-- @starci/seperator -->
Xây dựng resource CRUD tôn trọng contract HTTP verb và status code
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
Dựng resource `users` với CRUD đầy đủ theo đúng REST semantics: URL danh từ số nhiều, mỗi operation dùng đúng verb, mỗi outcome trả đúng status code — `201` khi tạo, `200` khi đọc, `204` khi xóa, `404` khi không tìm thấy. Tách HTTP adapter (controller/handler) khỏi business logic (service). Chọn ngôn ngữ của bạn; mọi ngôn ngữ trả cùng một contract output.
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
Mô hình hóa resource `users` với URL danh từ số nhiều và tách controller khỏi service
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

Thiết kế resource `users` theo cách đặt tên REST: URL là danh từ số nhiều `/users`, không bao giờ là verb trong path. Tách HTTP adapter (`UserController`) khỏi business logic (`UserService`).

:::muted
Ràng buộc kỹ thuật
:::

- URL dùng danh từ số nhiều `/users` và `/users/:id` — KHÔNG dùng verb trong path kiểu `/getUsers`, `/createUser`, `/deleteUser`.
- `UserController` chỉ map verb → handler và set status code; KHÔNG chứa business logic và không bao giờ chạm trực tiếp vào store.
- `UserService` sở hữu in-memory store và expose một method cho mỗi operation (`create`, `findAll`, `findOne`, `replace`, `patch`, `remove`).
- Đăng ký `UserModule` (controller + service provider) vào `AppModule`.

:::muted
Gợi ý
:::

`@Controller("users")` đặt path prefix; handler chỉ khai báo sub-path (`""` hoặc `":id"`). Sinh bằng `nest g module/controller/service user` để giữ đúng convention thư mục.
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
Mô hình hóa resource `users` với URL danh từ số nhiều và tách controller khỏi service
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

Thiết kế resource `users` theo cách đặt tên REST: URL là danh từ số nhiều `/users`, không bao giờ là verb trong path. Tách HTTP adapter (`UserController`) khỏi business logic (`UserService`).

:::muted
Ràng buộc kỹ thuật
:::

- URL dùng danh từ số nhiều `/users` và `/users/{id}` — KHÔNG dùng verb trong path kiểu `/getUsers`, `/createUser`.
- `UserController` (`@RestController`) chỉ map verb → handler và set status code; KHÔNG chứa business logic, không bao giờ chạm trực tiếp vào store.
- `UserService` (`@Service`) sở hữu in-memory store và expose một method cho mỗi operation (`create`, `findAll`, `findOne`, `replace`, `patch`, `remove`).
- `UserController` nhận `UserService` qua constructor injection (Spring tự auto-wire vào constructor duy nhất).

:::muted
Gợi ý
:::

Dùng `@RequestMapping("/users")` trên controller; map verb bằng `@PostMapping`/`@GetMapping`/`@PutMapping`/`@PatchMapping`/`@DeleteMapping`. Tạo project nhanh qua Spring Initializr (`spring-boot-starter-web`).
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
Mô hình hóa resource `users` với URL danh từ số nhiều và tách handler khỏi service
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

Thiết kế resource `users` theo cách đặt tên REST: URL là danh từ số nhiều `/users`, không bao giờ là verb trong path. Tách HTTP adapter khỏi business logic (`UserService`).

:::muted
Ràng buộc kỹ thuật
:::

- URL dùng danh từ số nhiều `/users` và `/users/{id}` — KHÔNG dùng verb trong path kiểu `/getUsers`, `/createUser`.
- HTTP adapter (endpoint minimal-API trong `Program.cs` hoặc một `UsersController`) chỉ map verb → handler và set status code; KHÔNG chứa business logic, không bao giờ chạm trực tiếp vào store.
- `UserService` sở hữu in-memory store và expose một method cho mỗi operation (`Create`, `FindAll`, `FindOne`, `Replace`, `Patch`, `Remove`).
- `UserService` được đăng ký vào IoC container bằng `AddSingleton` và được container resolve (không `new UserService()`).

:::muted
Gợi ý
:::

`dotnet new web` cho minimal API; map verb bằng `MapPost`/`MapGet`/`MapPut`/`MapPatch`/`MapDelete` dưới prefix `/users`.
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
Mô hình hóa resource `users` với URL danh từ số nhiều và tách handler khỏi service
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

Thiết kế resource `users` theo cách đặt tên REST: URL là danh từ số nhiều `/users`, không bao giờ là verb trong path. Tách HTTP handler khỏi business logic (`UserService`).

:::muted
Ràng buộc kỹ thuật
:::

- URL dùng danh từ số nhiều `/users` và `/users/:id` — KHÔNG dùng verb trong path kiểu `/getUsers`, `/createUser`.
- HTTP handler chỉ map verb → operation và set status code; KHÔNG chứa business logic, không bao giờ chạm trực tiếp vào store.
- `UserService` sở hữu in-memory store (được bảo vệ bằng mutex) và expose một method cho mỗi operation (`Create`, `FindAll`, `FindOne`, `Replace`, `Patch`, `Remove`).
- Handler nhận `*UserService` qua constructor function `NewHandler(svc *UserService)`; wiring nằm ở `main`.

:::muted
Gợi ý
:::

`go mod init`; `go get` gin + `github.com/google/uuid`. Dùng route theo method cụ thể (`r.POST("/users", ...)`, `r.GET("/users/:id", ...)`).
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
Triển khai cả năm operation với đúng verb và status code
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

Ghép mỗi HTTP verb với operation CRUD của nó và trả đúng status code mà REST contract yêu cầu cho từng outcome.

:::muted
Ràng buộc kỹ thuật
:::

- `POST /users` nhận `{name, email}` → trả HTTP 201 + user vừa tạo `{id, name, email}`; `id` là UUID v4 sinh bằng `crypto.randomUUID()`.
- `GET /users` → 200 + một mảng; `GET /users/:id` → 200 + user khi tìm thấy, 404 khi không tìm thấy.
- `PUT /users/:id` → 200 + user đã thay thế toàn bộ; `PATCH /users/:id` → 200 + user cập nhật một phần (chỉ field được gửi mới đổi); cả hai → 404 khi không tìm thấy.
- `DELETE /users/:id` → 204 No Content (body rỗng) khi thành công, 404 khi không tìm thấy.
- Một id không tồn tại KHÔNG BAO GIỜ trả `200` với `null` hoặc body rỗng — nó throw `NotFoundException` → 404.

:::muted
Gợi ý
:::

NestJS mặc định trả `200`; ép `@HttpCode(201)` khi tạo và `@HttpCode(204)` khi xóa. Throw `new NotFoundException(...)` cho miss; phân biệt field PATCH bằng `!== undefined`, không phải `??`.
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
Triển khai cả năm operation với đúng verb và status code
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

Ghép mỗi HTTP verb với operation CRUD của nó và trả đúng status code mà REST contract yêu cầu cho từng outcome.

:::muted
Ràng buộc kỹ thuật
:::

- `POST /users` nhận `{name, email}` → trả HTTP 201 + user vừa tạo `{id, name, email}`; `id` = `UUID.randomUUID().toString()`.
- `GET /users` → 200 + một list; `GET /users/{id}` → 200 + user khi tìm thấy, 404 khi không tìm thấy.
- `PUT /users/{id}` → 200 + user đã thay thế toàn bộ; `PATCH /users/{id}` → 200 + user cập nhật một phần (chỉ field được gửi mới đổi); cả hai → 404 khi không tìm thấy.
- `DELETE /users/{id}` → 204 No Content (body rỗng) khi thành công, 404 khi không tìm thấy.
- Một id không tồn tại KHÔNG BAO GIỜ trả `200` với `null` — nó trả `404` (ví dụ `ResponseStatusException(HttpStatus.NOT_FOUND)`).

:::muted
Gợi ý
:::

Set status tạo bằng `@ResponseStatus(HttpStatus.CREATED)` và xóa bằng `@ResponseStatus(HttpStatus.NO_CONTENT)`, hoặc trả `ResponseEntity.status(...)`. Với PATCH, chỉ ghi đè field khi giá trị đến là non-null.
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
Triển khai cả năm operation với đúng verb và status code
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

Ghép mỗi HTTP verb với operation CRUD của nó và trả đúng status code mà REST contract yêu cầu cho từng outcome.

:::muted
Ràng buộc kỹ thuật
:::

- `POST /users` nhận `{name, email}` → trả HTTP 201 + user vừa tạo `{id, name, email}`; `id` = `Guid.NewGuid().ToString()`.
- `GET /users` → 200 + một list; `GET /users/{id}` → 200 + user khi tìm thấy, 404 khi không tìm thấy.
- `PUT /users/{id}` → 200 + user đã thay thế toàn bộ; `PATCH /users/{id}` → 200 + user cập nhật một phần (chỉ field được gửi mới đổi); cả hai → 404 khi không tìm thấy.
- `DELETE /users/{id}` → 204 No Content (body rỗng) khi thành công, 404 khi không tìm thấy.
- Một id không tồn tại KHÔNG BAO GIỜ trả `200` với `null` — nó trả `Results.NotFound()` → 404.

:::muted
Gợi ý
:::

Trong minimal API dùng `Results.Created(...)`, `Results.Ok(...)`, `Results.NoContent()`, `Results.NotFound()` — mỗi helper set đúng status code. Với PATCH, chỉ ghi đè field khi giá trị đến là non-null.
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
Triển khai cả năm operation với đúng verb và status code
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

Ghép mỗi HTTP verb với operation CRUD của nó và trả đúng status code mà REST contract yêu cầu cho từng outcome.

:::muted
Ràng buộc kỹ thuật
:::

- `POST /users` nhận `{name, email}` → trả HTTP 201 + user vừa tạo `{id, name, email}`; `id` = `uuid.NewString()`.
- `GET /users` → 200 + một mảng; `GET /users/:id` → 200 + user khi tìm thấy, 404 khi không tìm thấy.
- `PUT /users/:id` → 200 + user đã thay thế toàn bộ; `PATCH /users/:id` → 200 + user cập nhật một phần (chỉ field được gửi mới đổi); cả hai → 404 khi không tìm thấy.
- `DELETE /users/:id` → 204 No Content (body rỗng) khi thành công, 404 khi không tìm thấy.
- Một id không tồn tại KHÔNG BAO GIỜ trả `200` với `null` — trả `c.JSON(http.StatusNotFound, ...)` hoặc `c.Status(http.StatusNotFound)`.

:::muted
Gợi ý
:::

Set status tường minh bằng `c.JSON(http.StatusCreated, user)` và `c.Status(http.StatusNoContent)`. Dùng struct với json tag để giữ tên field ổn định; với PATCH dùng field con trỏ `*string` để phân biệt "field bị bỏ qua" với "field set rỗng".
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
Khởi tạo project và store của UserService
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** `nest new rest-users-crud` rồi `cd` vào thư mục.
- **Bước 2:** Sinh resource: `nest g module user`, `nest g controller user`, `nest g service user`.
- **Bước 3:** Trong `UserService`, lưu dữ liệu bằng in-memory `Map<string, User>` và triển khai `create`, `findAll`, `findOne`, `replace`, `patch`, `remove`; throw `NotFoundException` từ `findOne`/`replace`/`patch`/`remove` khi id không tồn tại.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- `npm run start:dev` khởi động không lỗi.
- `UserService` là nơi DUY NHẤT chạm vào `Map`; controller không bao giờ đọc/ghi trực tiếp.

:::muted
Nice to have
:::

- Một `CreateUserDto` + `ValidationPipe` để từ chối khi thiếu `name`/`email`.
- Một type/interface `User` riêng thay vì shape object inline.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Khởi tạo project và store của UserService
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** Tạo project qua Spring Initializr (dependency `spring-boot-starter-web`), base-package `com.example`.
- **Bước 2:** Tạo package `com.example.user` với `@Service UserService` và một `record User(String id, String name, String email)`.
- **Bước 3:** Lưu dữ liệu bằng in-memory `Map<String, User>`; triển khai `create`, `findAll`, `findOne`, `replace`, `patch`, `remove`; throw `404` (`ResponseStatusException`) khi id không tồn tại.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- `mvn spring-boot:run` khởi động không lỗi.
- `UserService` là `@Service` và là nơi DUY NHẤT chạm vào `Map`.

:::muted
Nice to have
:::

- Một request DTO + `@Valid` để từ chối khi thiếu field.
- Tách interface `UserStore` để chuẩn bị cho việc thay thế impl.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Khởi tạo minimal API và store của UserService
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** `dotnet new web -o RestUsersCrud` rồi `cd` vào.
- **Bước 2:** Tạo `Services/UserService.cs` với một `record User(string Id, string Name, string Email)` và một in-memory `Dictionary<string, User>`.
- **Bước 3:** Triển khai `Create`, `FindAll`, `FindOne`, `Replace`, `Patch`, `Remove`; cho lookup trả về null/`bool` mà handler có thể chuyển thành `404`. Đăng ký `builder.Services.AddSingleton<UserService>()`.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- `dotnet run` chạy không lỗi.
- `UserService` là nơi DUY NHẤT chạm vào `Dictionary` và được resolve từ container.

:::muted
Nice to have
:::

- DataAnnotations trên request body để từ chối khi thiếu field.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Khởi tạo Go module và store của UserService
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** `go mod init rest-users-crud`; `go get github.com/gin-gonic/gin github.com/google/uuid`.
- **Bước 2:** Tạo package `user` với `type User struct` (json tag) và `type UserService struct` lưu bằng `map[string]User` được bảo vệ bằng `sync.Mutex`.
- **Bước 3:** Triển khai `Create`, `FindAll`, `FindOne`, `Replace`, `Patch`, `Remove`; lookup trả `(User, bool)` để handler trả `404` khi bool là false.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- `go run .` chạy không lỗi.
- `UserService` là nơi DUY NHẤT chạm vào map; truy cập được mutex bảo vệ.

:::muted
Nice to have
:::

- Định nghĩa interface `Store` để chuẩn bị cho việc thay thế impl + mock test.
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
Map verb vào handler và chốt cứng status code
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** `@Controller("users")`; inject `UserService` qua constructor.
- **Bước 2:** Thêm handler: `@Post()` + `@HttpCode(201)` create; `@Get()` list; `@Get(":id")` read; `@Put(":id")` full replace; `@Patch(":id")` partial; `@Delete(":id")` + `@HttpCode(204)` remove.
- **Bước 3:** Với PUT, ghi đè mọi field; với PATCH, chỉ ghi đè field có giá trị `!== undefined`.
- **Bước 4:** Để `NotFoundException` mà service throw nổi bọt lên — NestJS chuyển nó thành 404 với body JSON.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- Mỗi verb có đúng một handler với `@HttpCode` đúng.
- Không có business logic trong controller.

:::muted
Nice to have
:::

- Một `UpdateUserDto` cho PATCH đánh dấu mọi field là optional.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Map verb vào handler và chốt cứng status code
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** `@RestController @RequestMapping("/users")`; inject `UserService` qua constructor.
- **Bước 2:** Thêm handler: `@PostMapping` + `@ResponseStatus(CREATED)` create; `@GetMapping` list; `@GetMapping("/{id}")` read; `@PutMapping("/{id}")` full replace; `@PatchMapping("/{id}")` partial; `@DeleteMapping("/{id}")` + `@ResponseStatus(NO_CONTENT)` remove.
- **Bước 3:** Với PUT, ghi đè mọi field; với PATCH, chỉ ghi đè field có giá trị đến là non-null.
- **Bước 4:** Khi service báo miss, trả `404` (để `ResponseStatusException` lan lên).

:::muted
Yêu cầu tối thiểu cần đạt
:::

- Mỗi verb có đúng một handler với status code đúng.
- Không có business logic trong controller.

:::muted
Nice to have
:::

- Một update DTO riêng cho PATCH với field optional.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Map verb vào endpoint và chốt cứng status code
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** Trong `Program.cs`, resolve `UserService` từ container trong mỗi endpoint handler.
- **Bước 2:** Map endpoint: `MapPost("/users", ...)` → `Results.Created(...)`; `MapGet("/users", ...)` → `Results.Ok(...)`; `MapGet("/users/{id}", ...)`; `MapPut("/users/{id}", ...)`; `MapPatch("/users/{id}", ...)`; `MapDelete("/users/{id}", ...)` → `Results.NoContent()`.
- **Bước 3:** Với PUT, ghi đè mọi field; với PATCH, chỉ ghi đè field có giá trị đến là non-null.
- **Bước 4:** Khi service báo miss, trả `Results.NotFound()` → 404.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- Mỗi verb có đúng một endpoint với helper status `Results.*` đúng.
- Không có business logic trong endpoint handler.

:::muted
Nice to have
:::

- Một patch DTO riêng với field nullable.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Map verb vào handler, wiring ở main, và chốt cứng status code
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** Tạo struct `Handler` giữ `*UserService` qua `NewHandler(svc *UserService)`.
- **Bước 2:** Đăng ký route: `r.POST("/users", ...)` → `c.JSON(201, ...)`; `r.GET("/users", ...)`; `r.GET("/users/:id", ...)`; `r.PUT("/users/:id", ...)`; `r.PATCH("/users/:id", ...)`; `r.DELETE("/users/:id", ...)` → `c.Status(204)`.
- **Bước 3:** Với PUT, ghi đè mọi field; với PATCH, dùng con trỏ `*string` để field bị bỏ qua giữ nguyên.
- **Bước 4:** Trong `main`, tạo `UserService`, dựng `Handler`, đăng ký route, và chạy gin.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- Mỗi verb có đúng một route với status code đúng.
- Wiring nằm ở `main`; không có business logic trong handler.

:::muted
Nice to have
:::

- Tag `binding:"required"` trên body create.
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
Smoke test contract và viết README
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** `npm run start:dev`.
- **Bước 2:** Chạy chuỗi create → read → delete:
  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri "http://localhost:3000/users" -Method Post -Body (@{ name = "Ada Lovelace"; email = "ada@example.com" } | ConvertTo-Json) -ContentType "application/json"

  # macOS / Linux
  curl -i -X POST http://localhost:3000/users -H "Content-Type: application/json" -d '{"name":"Ada Lovelace","email":"ada@example.com"}'
  ```
- **Bước 3:** Đọc một id không tồn tại và xác nhận `404`; xóa id vừa tạo và xác nhận `204` với body rỗng.
- **Bước 4:** Dán response thật (kèm status line) vào mục **Smoke Test** trong README (không bịa).

:::muted
Yêu cầu tối thiểu cần đạt
:::

- `POST` trả `201`, `GET` miss trả `404`, `DELETE` trả `204` không body — tất cả xác nhận bằng output thật.
- README có 6 mục: Challenge description, How to run, Architecture/Stack, Smoke Test, Code Execution Trace, Design Decisions.

:::muted
Nice to have
:::

- Một screenshot terminal về status code dán vào README.
- Đo cold-start bằng `time npm run start`.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Smoke test contract và viết README
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** `mvn spring-boot:run`.
- **Bước 2:** Chạy chuỗi create → read → delete:
  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri "http://localhost:3000/users" -Method Post -Body (@{ name = "Ada Lovelace"; email = "ada@example.com" } | ConvertTo-Json) -ContentType "application/json"

  # macOS / Linux
  curl -i -X POST http://localhost:3000/users -H "Content-Type: application/json" -d '{"name":"Ada Lovelace","email":"ada@example.com"}'
  ```
- **Bước 3:** Đọc một id không tồn tại và xác nhận `404`; xóa id vừa tạo và xác nhận `204` với body rỗng.
- **Bước 4:** Dán response thật (kèm status line) vào mục **Smoke Test** trong README.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- `POST` trả `201`, `GET` miss trả `404`, `DELETE` trả `204` không body — xác nhận bằng output thật.
- README có 6 mục.

:::muted
Nice to have
:::

- Screenshot terminal; đo thời gian boot.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Smoke test contract và viết README
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** `dotnet run`.
- **Bước 2:** Chạy chuỗi create → read → delete:
  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri "http://localhost:3000/users" -Method Post -Body (@{ name = "Ada Lovelace"; email = "ada@example.com" } | ConvertTo-Json) -ContentType "application/json"

  # macOS / Linux
  curl -i -X POST http://localhost:3000/users -H "Content-Type: application/json" -d '{"name":"Ada Lovelace","email":"ada@example.com"}'
  ```
- **Bước 3:** Đọc một id không tồn tại và xác nhận `404`; xóa id vừa tạo và xác nhận `204` với body rỗng.
- **Bước 4:** Dán response thật (kèm status line) vào mục **Smoke Test** trong README.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- `POST` trả `201`, `GET` miss trả `404`, `DELETE` trả `204` không body — xác nhận bằng output thật.
- README có 6 mục.

:::muted
Nice to have
:::

- Screenshot terminal.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Smoke test contract và viết README
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** `go run .`.
- **Bước 2:** Chạy chuỗi create → read → delete:
  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri "http://localhost:3000/users" -Method Post -Body (@{ name = "Ada Lovelace"; email = "ada@example.com" } | ConvertTo-Json) -ContentType "application/json"

  # macOS / Linux
  curl -i -X POST http://localhost:3000/users -H "Content-Type: application/json" -d '{"name":"Ada Lovelace","email":"ada@example.com"}'
  ```
- **Bước 3:** Đọc một id không tồn tại và xác nhận `404`; xóa id vừa tạo và xác nhận `204` với body rỗng.
- **Bước 4:** Dán response thật (kèm status line) vào mục **Smoke Test** trong README.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- `POST` trả `201`, `GET` miss trả `404`, `DELETE` trả `204` không body — xác nhận bằng output thật.
- README có 6 mục.

:::muted
Nice to have
:::

- Screenshot terminal.
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
Bạn biết mô hình hóa một resource theo cách REST: URL danh từ số nhiều, tách controller/service sạch sẽ, và mỗi operation một verb.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Bạn biết mô hình hóa một resource theo cách REST: URL danh từ số nhiều, tách controller/service sạch sẽ, và mỗi operation một verb.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Bạn biết mô hình hóa một resource theo cách REST: URL danh từ số nhiều, tách handler/service sạch sẽ, và mỗi operation một verb.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Bạn biết mô hình hóa một resource theo cách REST: URL danh từ số nhiều, tách handler/service sạch sẽ, và mỗi operation một verb.
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
Bạn trả đúng status code cho mọi outcome — `201` tạo, `200` đọc, `204` xóa, `404` không tìm thấy — để client đọc kết quả chỉ từ status line.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Bạn trả đúng status code cho mọi outcome — `201` tạo, `200` đọc, `204` xóa, `404` không tìm thấy — để client đọc kết quả chỉ từ status line.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Bạn trả đúng status code cho mọi outcome — `201` tạo, `200` đọc, `204` xóa, `404` không tìm thấy — để client đọc kết quả chỉ từ status line.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Bạn trả đúng status code cho mọi outcome — `201` tạo, `200` đọc, `204` xóa, `404` không tìm thấy — để client đọc kết quả chỉ từ status line.
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
Hiểu HTTP verb, status code (`201`/`200`/`204`/`404`), và khác biệt giữa `PUT` (thay thế toàn bộ) với `PATCH` (cập nhật một phần).
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Hiểu HTTP verb, status code (`201`/`200`/`204`/`404`), và khác biệt giữa `PUT` (thay thế toàn bộ) với `PATCH` (cập nhật một phần).
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Hiểu HTTP verb, status code (`201`/`200`/`204`/`404`), và khác biệt giữa `PUT` (thay thế toàn bộ) với `PATCH` (cập nhật một phần).
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Hiểu HTTP verb, status code (`201`/`200`/`204`/`404`), và khác biệt giữa `PUT` (thay thế toàn bộ) với `PATCH` (cập nhật một phần).
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
