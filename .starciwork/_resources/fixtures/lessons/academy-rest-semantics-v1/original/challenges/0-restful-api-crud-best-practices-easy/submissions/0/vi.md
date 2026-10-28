# type
<!-- @starci/seperator -->
githubUrl
<!-- @starci/seperator -->
# title
<!-- @starci/seperator -->
Link repository GitHub
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
Một repo public chứa code (bằng ngôn ngữ bạn chọn) + README 6 mục với output Smoke Test thật thể hiện các status code.
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
**Create trả về 201 kèm resource.** `POST /users` với `{"name":"Ada Lovelace","email":"ada@example.com"}` phải trả về HTTP `201` (KHÔNG phải mặc định `200` của NestJS) và body JSON đúng shape `{id, name, email}` — không thiếu, không thừa field. `id` là UUID v4 khớp `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`; `name`/`email` lặp lại đúng input. Trả về `200`, sai shape, hoặc `id` không phải UUID → FAIL.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Create trả về 201 kèm resource.** `POST /users` với `{"name":"Ada Lovelace","email":"ada@example.com"}` phải trả về HTTP `201` (KHÔNG phải mặc định `200` của Spring) và body JSON đúng shape `{id, name, email}` — không thiếu, không thừa field. `id` là UUID v4 khớp `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`; `name`/`email` lặp lại đúng input. Trả về `200`, sai shape, hoặc `id` không phải UUID → FAIL.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Create trả về 201 kèm resource.** `POST /users` với `{"name":"Ada Lovelace","email":"ada@example.com"}` phải trả về HTTP `201` và body JSON đúng shape `{id, name, email}` — không thiếu, không thừa field. `id` là UUID v4 khớp `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`; `name`/`email` lặp lại đúng input. Trả về `200`, sai shape, hoặc `id` không phải UUID → FAIL.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Create trả về 201 kèm resource.** `POST /users` với `{"name":"Ada Lovelace","email":"ada@example.com"}` phải trả về HTTP `201` và body JSON đúng shape `{id, name, email}` — không thiếu, không thừa field. `id` là UUID v4 khớp `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`; `name`/`email` lặp lại đúng input. Trả về `200`, sai shape, hoặc `id` không phải UUID → FAIL.
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
**Resource không tồn tại trả về 404, không phải 200 rỗng (bằng chứng nhánh "miss" đã được nối).** `GET /users/{nonexistent-id}` (và `PUT`/`PATCH`/`DELETE` trên một id không tồn tại) phải trả về HTTP `404`, KHÔNG phải `200` kèm `null`/`[]`/body rỗng. 404 phải đến từ `NotFoundException` (hoặc tương đương), để client phân biệt được "không có" với "có nhưng rỗng". Bất kỳ trường hợp miss nào trả về `200`/`204`/`500` thay vì `404` → FAIL.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Resource không tồn tại trả về 404, không phải 200 rỗng (bằng chứng nhánh "miss" đã được nối).** `GET /users/{nonexistent-id}` (và `PUT`/`PATCH`/`DELETE` trên một id không tồn tại) phải trả về HTTP `404`, KHÔNG phải `200` kèm `null`/`[]`/body rỗng. 404 phải đến từ một tín hiệu not-found chủ đích (ví dụ `ResponseStatusException(NOT_FOUND)`), để client phân biệt được "không có" với "có nhưng rỗng". Bất kỳ trường hợp miss nào trả về `200`/`204`/`500` thay vì `404` → FAIL.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Resource không tồn tại trả về 404, không phải 200 rỗng (bằng chứng nhánh "miss" đã được nối).** `GET /users/{nonexistent-id}` (và `PUT`/`PATCH`/`DELETE` trên một id không tồn tại) phải trả về HTTP `404`, KHÔNG phải `200` kèm `null`/`[]`/body rỗng. 404 phải đến từ một `Results.NotFound()` chủ đích, để client phân biệt được "không có" với "có nhưng rỗng". Bất kỳ trường hợp miss nào trả về `200`/`204`/`500` thay vì `404` → FAIL.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Resource không tồn tại trả về 404, không phải 200 rỗng (bằng chứng nhánh "miss" đã được nối).** `GET /users/{nonexistent-id}` (và `PUT`/`PATCH`/`DELETE` trên một id không tồn tại) phải trả về HTTP `404`, KHÔNG phải `200` kèm `null`/body rỗng. 404 phải đến từ một `c.Status(http.StatusNotFound)` chủ đích sau khi `(User, bool)` báo false, để client phân biệt được "không có" với "có nhưng rỗng". Bất kỳ trường hợp miss nào trả về `200`/`204`/`500` thay vì `404` → FAIL.
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
**Delete trả về 204 với body rỗng và idempotent trên hợp đồng.** `DELETE /users/{id}` trên một user đang tồn tại phải trả về HTTP `204 No Content` với body hoàn toàn rỗng (KHÔNG phải `200` kèm payload `{deleted:true}`). Một lần `GET /users/{id}` ngay sau đó với cùng id phải trả về `404`, chứng minh delete thực sự đã xoá state. Một `204` mà vẫn đọc lại được resource, hoặc một delete trả về `200` kèm body → FAIL.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Delete trả về 204 với body rỗng.** `DELETE /users/{id}` trên một user đang tồn tại phải trả về HTTP `204 No Content` với body hoàn toàn rỗng (KHÔNG phải `200` kèm payload). Một lần `GET /users/{id}` ngay sau đó với cùng id phải trả về `404`, chứng minh delete thực sự đã xoá state. Một `204` mà vẫn đọc lại được resource, hoặc một delete trả về `200` kèm body → FAIL.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Delete trả về 204 với body rỗng.** `DELETE /users/{id}` trên một user đang tồn tại phải trả về HTTP `204 No Content` (`Results.NoContent()`) với body hoàn toàn rỗng (KHÔNG phải `200` kèm payload). Một lần `GET /users/{id}` ngay sau đó với cùng id phải trả về `404`, chứng minh delete thực sự đã xoá state. Một `204` mà vẫn đọc lại được resource, hoặc một delete trả về `200` kèm body → FAIL.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Delete trả về 204 với body rỗng.** `DELETE /users/:id` trên một user đang tồn tại phải trả về HTTP `204 No Content` (`c.Status(http.StatusNoContent)`) với body hoàn toàn rỗng (KHÔNG phải `200` kèm payload). Một lần `GET /users/:id` ngay sau đó với cùng id phải trả về `404`, chứng minh delete thực sự đã xoá state. Một `204` mà vẫn đọc lại được resource, hoặc một delete trả về `200` kèm body → FAIL.
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
**Ánh xạ verb-tới-operation đúng, không có verb trong URL (kiểm bằng cách đọc code + danh sách route).** Mỗi operation dùng đúng HTTP verb trên một URL danh từ số nhiều: `POST /users` create, `GET /users` + `GET /users/:id` read, `PUT /users/:id` thay thế toàn bộ, `PATCH /users/:id` cập nhật một phần, `DELETE /users/:id` xoá. Grep các route: KHÔNG có verb-trong-path như `/getUsers`, `/createUser`, `/deleteUser`, và KHÔNG một-verb-cho-tất-cả (ví dụ `POST /users/update`). Dùng `POST` (hoặc bất kỳ một verb nào) cho nhiều operation, hoặc đặt động từ hành động trong path → FAIL (critical → toàn bài challenge bằng 0 điểm).
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Ánh xạ verb-tới-operation đúng, không có verb trong URL (kiểm bằng cách đọc code + danh sách route).** Mỗi operation dùng đúng mapping trên một URL danh từ số nhiều: `@PostMapping` create, `@GetMapping` read, `@PutMapping` thay thế toàn bộ, `@PatchMapping` cập nhật một phần, `@DeleteMapping` xoá — tất cả dưới `/users`. Grep các route: KHÔNG có verb-trong-path như `/getUsers`, `/createUser`, và KHÔNG một-verb-cho-tất-cả. Dùng một verb cho nhiều operation, hoặc đặt động từ hành động trong path → FAIL (critical → toàn bài challenge bằng 0 điểm).
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Ánh xạ verb-tới-operation đúng, không có verb trong URL (kiểm bằng cách đọc code + danh sách route).** Mỗi operation dùng đúng mapping trên một URL danh từ số nhiều: `MapPost` create, `MapGet` read, `MapPut` thay thế toàn bộ, `MapPatch` cập nhật một phần, `MapDelete` xoá — tất cả dưới `/users`. Grep các route: KHÔNG có verb-trong-path như `/getUsers`, `/createUser`, và KHÔNG một-verb-cho-tất-cả. Dùng một verb cho nhiều operation, hoặc đặt động từ hành động trong path → FAIL (critical → toàn bài challenge bằng 0 điểm).
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Ánh xạ verb-tới-operation đúng, không có verb trong URL (kiểm bằng cách đọc code + danh sách route).** Mỗi operation dùng đúng method trên một URL danh từ số nhiều: `r.POST("/users")` create, `r.GET("/users")` + `r.GET("/users/:id")` read, `r.PUT("/users/:id")` thay thế toàn bộ, `r.PATCH("/users/:id")` cập nhật một phần, `r.DELETE("/users/:id")` xoá. Grep các route: KHÔNG có verb-trong-path như `/getUsers`, `/createUser`, và KHÔNG một-method-cho-tất-cả. Dùng một method cho nhiều operation, hoặc đặt động từ hành động trong path → FAIL (critical → toàn bài challenge bằng 0 điểm).
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
**Tách controller/service rõ ràng + ngữ nghĩa PUT vs PATCH + bằng chứng (kiểm bằng cách đọc code + README).** Controller chỉ giữ routing + `@HttpCode`; `Map` in-memory CHỈ được chạm bên trong `UserService`. PUT phải ghi đè toàn bộ resource (một field bị bỏ khỏi body PUT sẽ reset về default/rỗng), còn PATCH chỉ thay đổi các field được gửi (field bị bỏ giữ nguyên giá trị cũ, phân biệt bằng `!== undefined` chứ không phải `??`) — chứng minh bằng cách `PUT` với một field rồi `PATCH` với field còn lại và quan sát khác biệt. README có đủ 6 mục (Challenge description, How to run, Architecture/Stack, Smoke Test, Code Execution Trace, Design Decisions); mục Smoke Test dán output THẬT. Controller chạm trực tiếp store, PUT và PATCH hành xử giống hệt nhau, hoặc output bịa → FAIL.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Tách controller/service rõ ràng + ngữ nghĩa PUT vs PATCH + bằng chứng (kiểm bằng cách đọc code + README).** Controller chỉ giữ routing + status; `Map` in-memory CHỈ được chạm bên trong `@Service UserService`, inject qua constructor. PUT phải ghi đè toàn bộ resource (một field bị bỏ khỏi body PUT sẽ reset về default/rỗng), còn PATCH chỉ thay đổi các field được gửi (kiểm tra non-null) — chứng minh bằng cách `PUT` với một field rồi `PATCH` với field còn lại. README có đủ 6 mục; mục Smoke Test dán output THẬT. Controller chạm trực tiếp store, PUT và PATCH hành xử giống hệt nhau, hoặc output bịa → FAIL.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Tách handler/service rõ ràng + ngữ nghĩa PUT vs PATCH + bằng chứng (kiểm bằng cách đọc code + README).** Các endpoint handler chỉ giữ routing + `Results.*`; `Dictionary` in-memory CHỈ được chạm bên trong `UserService` (lấy từ container). PUT phải ghi đè toàn bộ resource (một field bị bỏ khỏi body PUT sẽ reset về default/rỗng), còn PATCH chỉ thay đổi các field được gửi (kiểm tra non-null) — chứng minh bằng cách `PUT` với một field rồi `PATCH` với field còn lại. README có đủ 6 mục; mục Smoke Test dán output THẬT. Endpoint chạm trực tiếp store, PUT và PATCH hành xử giống hệt nhau, hoặc output bịa → FAIL.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Tách handler/service rõ ràng + ngữ nghĩa PUT vs PATCH + bằng chứng (kiểm bằng cách đọc code + README).** Handler chỉ giữ routing + status; `map` CHỈ được chạm bên trong `UserService` (nhận qua `NewHandler`, wiring trong `main`). PUT phải ghi đè toàn bộ resource (một field bị bỏ khỏi body PUT sẽ reset về default/rỗng), còn PATCH chỉ thay đổi các field được gửi (dùng con trỏ `*string` để một field bị bỏ giữ nguyên không đổi) — chứng minh bằng cách `PUT` với một field rồi `PATCH` với field còn lại. README có đủ 6 mục; mục Smoke Test dán output THẬT. Handler chạm trực tiếp map, PUT và PATCH hành xử giống hệt nhau, hoặc output bịa → FAIL.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
30
<!-- @starci/seperator -->
### critical
<!-- @starci/seperator -->
false
<!-- @starci/seperator -->
