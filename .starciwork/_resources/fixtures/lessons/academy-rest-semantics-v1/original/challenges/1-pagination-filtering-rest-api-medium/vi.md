# sortIndex
<!-- @starci/seperator -->
2
<!-- @starci/seperator -->
# title
<!-- @starci/seperator -->
Phân trang, lọc và tìm kiếm cho một collection endpoint
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
Mở rộng `GET /users` để hỗ trợ phân trang (`page`/`limit`), một filter theo status và tìm kiếm theo tên, trả về envelope chuẩn `{ data: [], meta: { total, page, limit, totalPages } }`. Chọn ngôn ngữ của bạn; mọi ngôn ngữ trả cùng một contract output.
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
Validate query param (page, limit, status, search) với default hợp lý
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

Nhận input phân trang, filter và search dưới dạng query param đã được định kiểu và validate, để endpoint không bao giờ tin tưởng chuỗi thô từ client.

:::muted
Ràng buộc kỹ thuật
:::

- `GET /users` nhận query param: `page` (default `1`, integer `>= 1`), `limit` (default `10`, integer `1..50`), `status` (optional, một trong `active`/`inactive`), `search` (optional, match theo `name`).
- Khai báo `QueryUsersDto` với decorator `class-validator` và bật `ValidationPipe({ transform: true, whitelist: true })`; query string được cast sang number qua `@Type(() => Number)`.
- `limit > 50` hoặc `page < 1` trả HTTP `400`; thiếu `page`/`limit` thì dùng default.

:::muted
Gợi ý
:::

Giá trị query luôn về dưới dạng string — thiếu `@Type(() => Number)` thì `@IsInt()` fail ở mọi request. Dùng `@IsIn(['active','inactive'])` cho `status`.
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
Validate query param (page, limit, status, search) với default hợp lý
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

Nhận input phân trang, filter và search dưới dạng query param đã được định kiểu và validate, để endpoint không bao giờ tin tưởng chuỗi thô từ client.

:::muted
Ràng buộc kỹ thuật
:::

- `GET /users` nhận query param: `page` (default `1`, integer `>= 1`), `limit` (default `10`, integer `1..50`), `status` (optional, một trong `active`/`inactive`), `search` (optional, match theo `name`).
- Bind param vào POJO `QueryUsersDto` với Jakarta Bean Validation (`@Min`, `@Max`), default qua field initializer, validate bằng `@Valid` trên tham số controller.
- `limit > 50` hoặc `page < 1` trả HTTP `400`; thiếu `page`/`limit` thì dùng default.

:::muted
Gợi ý
:::

Thêm `@Validated` trên class controller để bật constraint cấp tham số; Spring tự bind query string sang `int`.
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
Validate query param (page, limit, status, search) với default hợp lý
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

Nhận input phân trang, filter và search dưới dạng query param đã được định kiểu và validate, để endpoint không bao giờ tin tưởng chuỗi thô từ client.

:::muted
Ràng buộc kỹ thuật
:::

- `GET /users` nhận query param: `page` (default `1`, integer `>= 1`), `limit` (default `10`, integer `1..50`), `status` (optional, một trong `active`/`inactive`), `search` (optional, match theo `name`).
- Bind param vào `QueryUsersDto` với `System.ComponentModel.DataAnnotations` (`[Range(1, int.MaxValue)]`, `[Range(1, 50)]`); `[ApiController]` tự trả `400` khi `ModelState` invalid.
- `limit > 50` hoặc `page < 1` trả HTTP `400`; thiếu `page`/`limit` thì dùng default.

:::muted
Gợi ý
:::

Đặt default qua property initializer (`public int Page { get; set; } = 1;`). Query bind vào DTO khi nó là action parameter.
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
Validate query param (page, limit, status, search) với default hợp lý
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

Nhận input phân trang, filter và search dưới dạng query param đã được định kiểu và validate, để endpoint không bao giờ tin tưởng chuỗi thô từ client.

:::muted
Ràng buộc kỹ thuật
:::

- `GET /users` nhận query param: `page` (default `1`, integer `>= 1`), `limit` (default `10`, integer `1..50`), `status` (optional, một trong `active`/`inactive`), `search` (optional, match theo `name`).
- Bind param vào struct `QueryUsersDto` với tag `form` + `binding` (`go-playground/validator`); `c.ShouldBindQuery(&dto)` trả lỗi → respond `400`.
- `limit > 50` hoặc `page < 1` trả HTTP `400`; thiếu `page`/`limit` thì dùng default.

:::muted
Gợi ý
:::

Dùng `form:"page,default=1"` cho default và `binding:"min=1,max=50"` cho giới hạn; `binding:"omitempty,oneof=active inactive"` cho status optional.
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
Đẩy filter và search xuống tầng data, phân trang, trả envelope meta
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

Áp filter và search ở tầng query (không phải trong bộ nhớ), rồi phân trang, và trả envelope `{ data, meta }` để client render pager mà không cần round-trip thứ hai.

:::muted
Ràng buộc kỹ thuật
:::

- Filter và search chạy trước phân trang; tuyệt đối không fetch hết rồi `.filter()` trong code ứng dụng.
- Response shape đúng là `{ data: User[], meta: { total, page, limit, totalPages } }`; `totalPages = ceil(total / limit)`; kết quả rỗng là `total = 0`, `data = []`.
- `status` map sang `WHERE status = :status`; `search` match `name` không phân biệt hoa thường (`ILIKE`/`LOWER(...) LIKE`); mỗi clause chỉ được nối khi param có giá trị.

:::muted
Gợi ý
:::

`getManyAndCount()` trả `[data, total]` trong một lần gọi — khớp tự nhiên với envelope `{ data, meta }`. Áp `.skip((page-1)*limit).take(limit)` sau các `andWhere` có điều kiện.
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
Đẩy filter và search xuống tầng data, phân trang, trả envelope meta
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

Áp filter và search ở tầng query (không phải trong bộ nhớ), rồi phân trang, và trả envelope `{ data, meta }` để client render pager mà không cần round-trip thứ hai.

:::muted
Ràng buộc kỹ thuật
:::

- Filter và search chạy trước phân trang; tuyệt đối không `findAll()` rồi filter trong Java.
- Response shape đúng là `{ data: User[], meta: { total, page, limit, totalPages } }`; `totalPages = ceil(total / limit)`; kết quả rỗng là `total = 0`, `data = []`.
- Dựng `Specification<User>` ghép equality `status` và `like` `name` không phân biệt hoa thường; mỗi predicate chỉ được thêm khi param có giá trị.

:::muted
Gợi ý
:::

`Page<User>` đã có sẵn `getTotalElements()` và `getContent()`; nhớ `PageRequest.of(page-1, limit)` vì Spring page đánh số từ 0.
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
Đẩy filter và search xuống tầng data, phân trang, trả envelope meta
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

Áp filter và search ở tầng query (không phải trong bộ nhớ), rồi phân trang, và trả envelope `{ data, meta }` để client render pager mà không cần round-trip thứ hai.

:::muted
Ràng buộc kỹ thuật
:::

- Filter và search chạy trước phân trang; tuyệt đối không `ToListAsync()` hết rồi filter bằng LINQ-to-objects.
- Response shape đúng là `{ data: User[], meta: { total, page, limit, totalPages } }`; `totalPages = ceil(total / limit)`; kết quả rỗng là `total = 0`, `data = []`.
- Ghép `IQueryable.Where(...)` cho `status` và match `name` không phân biệt hoa thường (`EF.Functions.ILike`); mỗi `Where` chỉ được thêm khi param có giá trị.

:::muted
Gợi ý
:::

LINQ là deferred — `CountAsync()` rồi `Skip().Take().ToListAsync()` trên cùng `IQueryable` chạy hai câu SQL với cùng filter. Dùng `AsNoTracking()` cho query đọc.
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
Đẩy filter và search xuống tầng data, phân trang, trả envelope meta
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

Áp filter và search ở tầng query (không phải trong bộ nhớ), rồi phân trang, và trả envelope `{ data, meta }` để client render pager mà không cần round-trip thứ hai.

:::muted
Ràng buộc kỹ thuật
:::

- Filter và search chạy trước phân trang; tuyệt đối không `Find(&all)` rồi filter slice trong Go.
- Response shape đúng là `{ data: User[], meta: { total, page, limit, totalPages } }`; `totalPages = ceil(total / limit)`; kết quả rỗng là `total = 0`, `data = []`.
- Reassign query đã ghép (`tx = tx.Where(...)`) cho equality `status` và `ILIKE` `name` không phân biệt hoa thường; mỗi clause chỉ được thêm khi param có giá trị.

:::muted
Gợi ý
:::

Clone session GORM giữa `Count(&total)` và `Find(&data)` để `Limit`/`Offset` không bị áp vào câu count.
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
Seed dữ liệu, smoke-test mọi luồng và viết README kèm bằng chứng
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

Tạo ra bằng chứng tái lập được rằng phân trang, filter và search thực sự chạy end-to-end trên một dataset đã được nạp dữ liệu.

:::muted
Ràng buộc kỹ thuật
:::

- Seed `>= 50` user (một script được commit, không insert thủ công) với mix status `active`/`inactive` để phân trang trải qua nhiều page.
- README có 6 mục (Challenge description, How to run, Architecture/Stack, Smoke Test, Code Execution Trace, Design Decisions); Smoke Test paste output thật cho `page=1`, `page=2`, `status=active`, `search=<word>`, và case `limit=999` → `400`.
- Code Execution Trace liệt kê `>= 4` touchpoint của luồng GET (controller → validation → service → query → response shape) kèm `file:line`.

:::muted
Gợi ý
:::

Dùng `@faker-js/faker` trong `scripts/seed.ts`. Bật query logger để paste SQL `WHERE`/`ILIKE` thật vào Smoke Test làm bằng chứng filter chạy ở tầng data.
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
Seed dữ liệu, smoke-test mọi luồng và viết README kèm bằng chứng
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

Tạo ra bằng chứng tái lập được rằng phân trang, filter và search thực sự chạy end-to-end trên một dataset đã được nạp dữ liệu.

:::muted
Ràng buộc kỹ thuật
:::

- Seed `>= 50` user (một `CommandLineRunner` hoặc script SQL được commit, không insert thủ công) với mix status `active`/`inactive` để phân trang trải qua nhiều page.
- README có 6 mục (Challenge description, How to run, Architecture/Stack, Smoke Test, Code Execution Trace, Design Decisions); Smoke Test paste output thật cho `page=1`, `page=2`, `status=active`, `search=<word>`, và case `limit=999` → `400`.
- Code Execution Trace liệt kê `>= 4` touchpoint của luồng GET (controller → validation → service → query → response shape) kèm `file:line`.

:::muted
Gợi ý
:::

Bật `spring.jpa.show-sql=true` để paste SQL `where`/`lower(...) like` thật vào Smoke Test làm bằng chứng filter chạy ở tầng data.
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
Seed dữ liệu, smoke-test mọi luồng và viết README kèm bằng chứng
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

Tạo ra bằng chứng tái lập được rằng phân trang, filter và search thực sự chạy end-to-end trên một dataset đã được nạp dữ liệu.

:::muted
Ràng buộc kỹ thuật
:::

- Seed `>= 50` user (một seeding routine lúc startup được commit, không insert thủ công) với mix status `active`/`inactive` để phân trang trải qua nhiều page.
- README có 6 mục (Challenge description, How to run, Architecture/Stack, Smoke Test, Code Execution Trace, Design Decisions); Smoke Test paste output thật cho `page=1`, `page=2`, `status=active`, `search=<word>`, và case `limit=999` → `400`.
- Code Execution Trace liệt kê `>= 4` touchpoint của luồng GET (controller → validation → service → query → response shape) kèm `file:line`.

:::muted
Gợi ý
:::

Đặt `LogLevel` cho `Microsoft.EntityFrameworkCore.Database.Command` thành `Information` để paste SQL `WHERE`/`ILIKE` thật vào Smoke Test làm bằng chứng filter chạy ở tầng data.
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
Seed dữ liệu, smoke-test mọi luồng và viết README kèm bằng chứng
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

Tạo ra bằng chứng tái lập được rằng phân trang, filter và search thực sự chạy end-to-end trên một dataset đã được nạp dữ liệu.

:::muted
Ràng buộc kỹ thuật
:::

- Seed `>= 50` user (một seeding routine được commit, không insert thủ công) với mix status `active`/`inactive` để phân trang trải qua nhiều page.
- README có 6 mục (Challenge description, How to run, Architecture/Stack, Smoke Test, Code Execution Trace, Design Decisions); Smoke Test paste output thật cho `page=1`, `page=2`, `status=active`, `search=<word>`, và case `limit=999` → `400`.
- Code Execution Trace liệt kê `>= 4` touchpoint của luồng GET (handler → binding → repository → query → response shape) kèm `file:line`.

:::muted
Gợi ý
:::

Bật GORM `Logger.Info` để paste SQL `WHERE`/`ILIKE` thật vào Smoke Test làm bằng chứng filter chạy ở tầng data.
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
Dựng query DTO và wire validation
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** Tạo `QueryUsersDto` với `page` (`@Type(() => Number) @IsInt() @Min(1)`, default `1`), `limit` (`@IsInt() @Min(1) @Max(50)`, default `10`), `status?` (`@IsOptional() @IsIn(['active','inactive'])`), `search?` (`@IsOptional() @IsString()`).
- **Bước 2:** Dùng `@Query() query: QueryUsersDto` trong controller và bật `app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))`.
- **Bước 3:** Kiểm chứng `GET /users?limit=999` trả `400` với message rõ ràng.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- DTO có 4 field với validator decorator và cast number.
- `limit > 50` hoặc `page < 1` trả `400`.
- Default `page=1`, `limit=10` áp dụng khi bỏ trống.

:::muted
Nice to have
:::

- `forbidNonWhitelisted: true` reject query param lạ với `400`.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Dựng query DTO và wire validation
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** Tạo `QueryUsersDto` với `int page = 1` (`@Min(1)`), `int limit = 10` (`@Min(1) @Max(50)`), `String status` (`@Pattern` hoặc kiểm tra theo tập hợp lệ), `String search`.
- **Bước 2:** Annotate class controller bằng `@Validated` và tham số handler bằng `@Valid QueryUsersDto q`.
- **Bước 3:** Kiểm chứng `GET /users?limit=999` trả `400`.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- DTO có 4 field với constraint annotation.
- `limit > 50` hoặc `page < 1` trả `400`.
- Default `page=1`, `limit=10` áp dụng khi bỏ trống.

:::muted
Nice to have
:::

- Một `@ControllerAdvice` map `MethodArgumentNotValidException` thành body `400` gọn.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Dựng query DTO và wire validation
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** Tạo `QueryUsersDto` với `[Range(1, int.MaxValue)] int Page = 1`, `[Range(1, 50)] int Limit = 10`, `string? Status`, `string? Search`.
- **Bước 2:** Nhận DTO làm action parameter trên controller `[ApiController]` (hoặc handler minimal-API) để validation chạy tự động.
- **Bước 3:** Kiểm chứng `GET /users?limit=999` trả `400`.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- DTO có 4 field với `DataAnnotations`.
- `limit > 50` hoặc `page < 1` trả `400`.
- Default `Page=1`, `Limit=10` áp dụng khi bỏ trống.

:::muted
Nice to have
:::

- Một validation attribute tùy biến giới hạn `Status` về `active`/`inactive`.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Dựng query DTO và wire validation
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** Tạo struct `QueryUsersDto`: `Page int form:"page,default=1" binding:"min=1"`, `Limit int form:"limit,default=10" binding:"min=1,max=50"`, `Status string form:"status" binding:"omitempty,oneof=active inactive"`, `Search string form:"search"`.
- **Bước 2:** Trong handler gọi `c.ShouldBindQuery(&dto)`; khi lỗi respond `c.JSON(400, ...)`.
- **Bước 3:** Kiểm chứng `GET /users?limit=999` trả `400`.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- Struct bind 4 field với tag `form`/`binding`.
- `limit > 50` hoặc `page < 1` trả `400`.
- Default `page=1`, `limit=10` áp dụng khi bỏ trống.

:::muted
Nice to have
:::

- Chuyển lỗi validator thành body `400` có cấu trúc thay vì chuỗi lỗi thô.
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
Implement service: filter có điều kiện, phân trang và meta
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** Trong `UsersService.findAll(query)` khởi tạo `repo.createQueryBuilder('user')`.
- **Bước 2:** Nối `.andWhere('user.status = :status', { status })` chỉ khi `query.status` có giá trị; nối `.andWhere('user.name ILIKE :search', { search: \`%${query.search}%\` })` chỉ khi `query.search` có giá trị.
- **Bước 3:** Chạy `.skip((page-1)*limit).take(limit).getManyAndCount()` → `[data, total]`; trả `{ data, meta: { total, page, limit, totalPages: Math.ceil(total/limit) } }`.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- `GET /users?page=2&limit=10` trả item 11-20.
- `GET /users?status=active` chỉ trả user active.
- `GET /users?search=foo` chỉ trả name chứa "foo" (không phân biệt hoa thường).
- `meta` mang 4 field với giá trị chính xác.

:::muted
Nice to have
:::

- Một `PaginatedResponse<User>` có định kiểu thay vì object inline.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Implement service: filter có điều kiện, phân trang và meta
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** Cho `UserRepository` extend `JpaSpecificationExecutor<User>`.
- **Bước 2:** Dựng `Specification<User>`: thêm `cb.equal(root.get("status"), status)` chỉ khi `status` có giá trị; thêm `cb.like(cb.lower(root.get("name")), "%"+search.toLowerCase()+"%")` chỉ khi `search` có giá trị.
- **Bước 3:** Gọi `repo.findAll(spec, PageRequest.of(page-1, limit))`; map `Page<User>` thành `{ data: getContent(), meta: { total: getTotalElements(), page, limit, totalPages } }`.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- `GET /users?page=2&limit=10` trả item 11-20.
- `GET /users?status=active` chỉ trả user active.
- `GET /users?search=foo` chỉ trả name chứa "foo" (không phân biệt hoa thường).
- `meta` mang 4 field với giá trị chính xác.

:::muted
Nice to have
:::

- Một record `Meta(long total, int page, int limit, int totalPages)`.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Implement service: filter có điều kiện, phân trang và meta
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** Khởi tạo `var query = _ctx.Users.AsNoTracking();`.
- **Bước 2:** Thêm `query = query.Where(u => u.Status == status)` chỉ khi `status` có giá trị; thêm `query = query.Where(u => EF.Functions.ILike(u.Name, $"%{search}%"))` chỉ khi `search` có giá trị.
- **Bước 3:** `var total = await query.CountAsync(); var data = await query.Skip((page-1)*limit).Take(limit).ToListAsync();` trả `{ data, meta: { total, page, limit, totalPages = (int)Math.Ceiling((double)total/limit) } }`.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- `GET /users?page=2&limit=10` trả item 11-20.
- `GET /users?status=active` chỉ trả user active.
- `GET /users?search=foo` chỉ trả name chứa "foo" (không phân biệt hoa thường).
- `meta` mang 4 field với giá trị chính xác.

:::muted
Nice to have
:::

- Một `record PagedResult<T>(IReadOnlyList<T> Data, Meta Meta)`.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Implement service: filter có điều kiện, phân trang và meta
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** Khởi tạo `tx := r.db.Model(&User{})`.
- **Bước 2:** Reassign `tx = tx.Where("status = ?", status)` chỉ khi `status != ""`; reassign `tx = tx.Where("name ILIKE ?", "%"+search+"%")` chỉ khi `search != ""`.
- **Bước 3:** `var total int64; tx.Count(&total); var data []User; tx.Limit(limit).Offset((page-1)*limit).Find(&data)`; trả `{ data, meta: { total, page, limit, totalPages } }`.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- `GET /users?page=2&limit=10` trả item 11-20.
- `GET /users?status=active` chỉ trả user active.
- `GET /users?search=foo` chỉ trả name chứa "foo" (không phân biệt hoa thường).
- `meta` mang 4 field với giá trị chính xác.

:::muted
Nice to have
:::

- Một struct `Meta` + wrapper generic `Paginated[T]`.
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
Seed, smoke-test và viết README
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** Viết `scripts/seed.ts` với `@faker-js/faker` insert `>= 50` user với status hỗn hợp; ghi rõ lệnh (`npm run seed`).
- **Bước 2:** Chạy app và capture output thật cho 5 luồng:
  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri "http://localhost:3000/users?page=1&limit=10"

  # macOS / Linux
  curl -s "http://localhost:3000/users?page=1&limit=10"
  ```
- **Bước 3:** Paste cả 5 response + SQL từ query logger vào mục **Smoke Test** của README, và viết **Code Execution Trace** `UsersController -> ValidationPipe -> UsersService -> QueryBuilder -> response` kèm `file:line`.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- Seed tái lập được (`npm run seed` insert `>= 50` user).
- README có 6 mục.
- Smoke Test có `>= 5` luồng với output thật, gồm case `limit=999` → `400`.
- SQL log chứng minh `WHERE status` + `ILIKE` chạy ở tầng data.

:::muted
Nice to have
:::

- Một mermaid diagram của luồng phân trang.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Seed, smoke-test và viết README
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** Viết một `CommandLineRunner` (hoặc `data.sql`) insert `>= 50` user với status hỗn hợp; ghi rõ cách chạy.
- **Bước 2:** Chạy app và capture output thật cho 5 luồng:
  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri "http://localhost:3000/users?page=1&limit=10"

  # macOS / Linux
  curl -s "http://localhost:3000/users?page=1&limit=10"
  ```
- **Bước 3:** Paste cả 5 response + log `show-sql` vào mục **Smoke Test** của README, và viết **Code Execution Trace** `UserController -> @Valid -> UserService -> Specification -> response` kèm `file:line`.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- Seed tái lập được insert `>= 50` user.
- README có 6 mục.
- Smoke Test có `>= 5` luồng với output thật, gồm case `limit=999` → `400`.
- SQL log chứng minh `where`/`lower(...) like` chạy ở tầng data.

:::muted
Nice to have
:::

- Một mermaid diagram của luồng phân trang.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Seed, smoke-test và viết README
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** Thêm seeding routine lúc startup insert `>= 50` user với status hỗn hợp; ghi rõ cách chạy.
- **Bước 2:** Chạy app và capture output thật cho 5 luồng:
  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri "http://localhost:3000/users?page=1&limit=10"

  # macOS / Linux
  curl -s "http://localhost:3000/users?page=1&limit=10"
  ```
- **Bước 3:** Paste cả 5 response + log command của EF Core vào mục **Smoke Test** của README, và viết **Code Execution Trace** `UsersController -> ModelState -> UsersService -> IQueryable -> response` kèm `file:line`.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- Seed tái lập được insert `>= 50` user.
- README có 6 mục.
- Smoke Test có `>= 5` luồng với output thật, gồm case `limit=999` → `400`.
- SQL log chứng minh `WHERE status` + `ILIKE` chạy ở tầng data.

:::muted
Nice to have
:::

- Một mermaid diagram của luồng phân trang.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Seed, smoke-test và viết README
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** Thêm seeding routine insert `>= 50` user với status hỗn hợp; ghi rõ cách chạy.
- **Bước 2:** Chạy app và capture output thật cho 5 luồng:
  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri "http://localhost:3000/users?page=1&limit=10"

  # macOS / Linux
  curl -s "http://localhost:3000/users?page=1&limit=10"
  ```
- **Bước 3:** Paste cả 5 response + SQL log của GORM vào mục **Smoke Test** của README, và viết **Code Execution Trace** `handler -> ShouldBindQuery -> repository -> gorm query -> response` kèm `file:line`.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- Seed tái lập được insert `>= 50` user.
- README có 6 mục.
- Smoke Test có `>= 5` luồng với output thật, gồm case `limit=999` → `400`.
- SQL log chứng minh `WHERE status` + `ILIKE` chạy ở tầng data.

:::muted
Nice to have
:::

- Một mermaid diagram của luồng phân trang.
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
Bạn implement được pagination + filter + search trên một REST collection với query validation chặt và envelope chuẩn `{ data, meta }`.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Bạn implement được pagination + filter + search trên một REST collection với query validation chặt và envelope chuẩn `{ data, meta }`.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Bạn implement được pagination + filter + search trên một REST collection với query validation chặt và envelope chuẩn `{ data, meta }`.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Bạn implement được pagination + filter + search trên một REST collection với query validation chặt và envelope chuẩn `{ data, meta }`.
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
Bạn đẩy được filter/search xuống tầng query (WHERE/ILIKE) thay vì filter trong bộ nhớ, và lập luận được về contract của meta payload.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Bạn đẩy được filter/search xuống tầng query (WHERE/ILIKE) thay vì filter trong bộ nhớ, và lập luận được về contract của meta payload.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Bạn đẩy được filter/search xuống tầng query (WHERE/ILIKE) thay vì filter trong bộ nhớ, và lập luận được về contract của meta payload.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Bạn đẩy được filter/search xuống tầng query (WHERE/ILIKE) thay vì filter trong bộ nhớ, và lập luận được về contract của meta payload.
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
Đã hoàn thành bản EASY `restful-api-crud-best-practices-easy`.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Đã hoàn thành bản EASY `restful-api-crud-best-practices-easy`.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Đã hoàn thành bản EASY `restful-api-crud-best-practices-easy`.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Đã hoàn thành bản EASY `restful-api-crud-best-practices-easy`.
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
Một relational database chạy được local và connection string đọc từ config layer (không hardcode).
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Một relational database chạy được local và connection string đọc từ config layer (không hardcode).
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Một relational database chạy được local và connection string đọc từ config layer (không hardcode).
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Một relational database chạy được local và connection string đọc từ config layer (không hardcode).
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
