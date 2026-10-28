# sortIndex
<!-- @starci/seperator -->
3
<!-- @starci/seperator -->
# title
<!-- @starci/seperator -->
Batch insert nhiều resource trong một transaction nguyên tử (all-or-nothing)
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
Thêm endpoint `POST /users/batch` nhận một mảng user và ghi cả lô bên trong MỘT database transaction: nếu bất kỳ record nào fail (email trùng, thiếu field), toàn bộ lô bị `ROLLBACK` — không có partial write. Trả về `{ created, failed: [{ index, reason }] }` để client biết chính xác record nào lỗi. Chọn ngôn ngữ của bạn; mọi ngôn ngữ trả cùng một contract output.
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
Validate payload lô và định nghĩa contract response của batch
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

Thiết kế endpoint `POST /users/batch` nhận `{ users: [{ name, email }, ...] }` và trả về một response mô tả rõ kết quả của cả lô — bao nhiêu record đã tạo và record nào fail vì lý do gì.

:::muted
Ràng buộc kỹ thuật
:::

- `POST /users/batch` nhận body `{ users: CreateUserDto[] }`; mảng rỗng hoặc thiếu `users` → 400.
- Cột `email` phải UNIQUE ở tầng database (không chỉ check in-memory) — đây là ràng buộc bắt lỗi trùng.
- Response thành công → 201 với shape `{ created: number, failed: [] }` (mảng `failed` rỗng khi cả lô OK).
- Khi lô bị rollback do lỗi → trả về `{ created: 0, failed: [{ index, reason }] }` với `index` là vị trí record trong mảng gửi lên.
- `UserController` chỉ map verb → handler; toàn bộ logic transaction nằm trong tầng service.

:::muted
Gợi ý
:::

Dùng một `BatchCreateUsersDto` với `@ValidateNested()` + `@Type(() => CreateUserDto)` để validate từng phần tử. Đặt ràng buộc `@Column({ unique: true })` trên `email` của entity TypeORM.
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
Validate payload lô và định nghĩa contract response của batch
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

Thiết kế endpoint `POST /users/batch` nhận `{ users: [{ name, email }, ...] }` và trả về một response mô tả rõ kết quả của cả lô — bao nhiêu record đã tạo và record nào fail vì lý do gì.

:::muted
Ràng buộc kỹ thuật
:::

- `POST /users/batch` nhận body `{ users: CreateUserRequest[] }`; list rỗng hoặc null → 400.
- Cột `email` phải UNIQUE ở tầng database (`@Column(unique = true)` trên JPA entity).
- Response thành công → 201 với shape `{ created: number, failed: [] }`.
- Khi lô bị rollback do lỗi → `{ created: 0, failed: [{ index, reason }] }`, `index` là vị trí record trong list.
- `UserController` chỉ map verb → handler; logic transaction nằm trong service.

:::muted
Gợi ý
:::

Dùng `@Valid` + `@NotEmpty` trên list trong request DTO. Đặt `@Column(unique = true)` (và `@Table(uniqueConstraints = ...)`) trên `email`. Bắt `DataIntegrityViolationException` để map thành record fail.
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
Validate payload lô và định nghĩa contract response của batch
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

Thiết kế endpoint `POST /users/batch` nhận `{ users: [{ name, email }, ...] }` và trả về một response mô tả rõ kết quả của cả lô — bao nhiêu record đã tạo và record nào fail vì lý do gì.

:::muted
Ràng buộc kỹ thuật
:::

- `POST /users/batch` nhận body `{ users: CreateUserDto[] }`; mảng rỗng hoặc null → 400.
- Cột `Email` phải UNIQUE ở tầng database (unique index cấu hình trong EF Core).
- Response thành công → 201 với shape `{ created: number, failed: [] }`.
- Khi lô bị rollback do lỗi → `{ created: 0, failed: [{ index, reason }] }`, `index` là vị trí record trong mảng.
- HTTP adapter chỉ map verb → handler; logic transaction nằm trong service.

:::muted
Gợi ý
:::

Cấu hình unique index bằng `modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique()`. Bắt `DbUpdateException` (vi phạm unique) để biết lô đã fail và cần rollback.
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
Validate payload lô và định nghĩa contract response của batch
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

Thiết kế endpoint `POST /users/batch` nhận `{ users: [{ name, email }, ...] }` và trả về một response mô tả rõ kết quả của cả lô — bao nhiêu record đã tạo và record nào fail vì lý do gì.

:::muted
Ràng buộc kỹ thuật
:::

- `POST /users/batch` nhận body `{ users: []CreateUserInput }`; slice rỗng hoặc thiếu → 400.
- Cột `email` phải UNIQUE ở tầng database (`gorm:"uniqueIndex"` trên struct model).
- Response thành công → 201 với shape `{ created: number, failed: [] }`.
- Khi lô bị rollback do lỗi → `{ created: 0, failed: [{ index, reason }] }`, `index` là vị trí record trong slice.
- HTTP handler chỉ map verb → operation; logic transaction nằm trong service.

:::muted
Gợi ý
:::

Đặt tag `gorm:"uniqueIndex"` trên field `Email` của model. Dùng `binding:"required,dive"` để gin validate từng phần tử của slice.
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
Bọc cả lô trong một transaction all-or-nothing
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

Ghi cả lô bên trong MỘT database transaction sao cho khi một record bất kỳ fail, mọi insert trước đó trong cùng lô đều bị huỷ (`ROLLBACK`) — kết thúc với trạng thái database y hệt lúc trước khi gọi.

:::muted
Ràng buộc kỹ thuật
:::

- Mở một transaction THẬT ở tầng database, insert toàn bộ record bên trong nó, rồi `COMMIT` một lần ở cuối.
- Nếu bất kỳ insert nào ném lỗi (email trùng → vi phạm unique, hoặc thiếu field) → `ROLLBACK` toàn bộ transaction; KHÔNG được giữ lại bất kỳ record nào của lô.
- CẤM "insert từng record + tự xoá tay/compensate khi fail" — phải dùng transaction boundary của database, không phải bù trừ thủ công.
- Khi rollback, thu thập index + lý do của (các) record gây lỗi để trả trong `failed`.
- Lệnh `BEGIN`, các `INSERT`, và `COMMIT`/`ROLLBACK` phải nhìn thấy được trong SQL log (bật query logging).

:::muted
Gợi ý
:::

Dùng `dataSource.createQueryRunner()` → `connect()` → `startTransaction()`; insert qua `queryRunner.manager`; `commitTransaction()` trong nhánh thành công và `rollbackTransaction()` trong `catch`; luôn `release()` ở `finally`. Bật `logging: true` trong cấu hình TypeORM để thấy `START TRANSACTION` / `ROLLBACK`.
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
Bọc cả lô trong một transaction all-or-nothing
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

Ghi cả lô bên trong MỘT database transaction sao cho khi một record bất kỳ fail, mọi insert trước đó trong cùng lô đều bị huỷ (`ROLLBACK`) — kết thúc với trạng thái database y hệt lúc trước khi gọi.

:::muted
Ràng buộc kỹ thuật
:::

- Method service xử lý lô được đánh dấu `@Transactional` để Spring mở/commit transaction quanh toàn bộ thân method.
- Nếu bất kỳ insert nào ném runtime exception (vi phạm unique, thiếu field) → transaction `ROLLBACK` toàn bộ; KHÔNG giữ lại record nào của lô.
- CẤM "insert từng record + tự xoá tay/compensate" — phải để transaction boundary của Spring/JPA lo việc rollback.
- Khi rollback, thu thập index + lý do của record gây lỗi để trả trong `failed` (xử lý exception ở tầng ngoài transaction để response vẫn `201` với danh sách failed, hoặc bắt rồi re-throw đúng cách giữ rollback).
- `BEGIN`/`INSERT`/`ROLLBACK` phải nhìn thấy được trong SQL log.

:::muted
Gợi ý
:::

Đặt `@Transactional` trên method service insert lô (không phải trên method bao validate). Bật `spring.jpa.show-sql=true` + `logging.level.org.hibernate.SQL=DEBUG`. Lưu ý exception phải lan ra khỏi method `@Transactional` thì rollback mới kích hoạt.
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
Bọc cả lô trong một transaction all-or-nothing
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

Ghi cả lô bên trong MỘT database transaction sao cho khi một record bất kỳ fail, mọi insert trước đó trong cùng lô đều bị huỷ (`ROLLBACK`) — kết thúc với trạng thái database y hệt lúc trước khi gọi.

:::muted
Ràng buộc kỹ thuật
:::

- Mở transaction bằng `await dbContext.Database.BeginTransactionAsync()`, insert toàn bộ record, rồi `CommitAsync()` ở cuối.
- Nếu bất kỳ insert nào ném lỗi (vi phạm unique, thiếu field) → `RollbackAsync()` (hoặc dispose transaction chưa commit) → KHÔNG giữ lại record nào của lô.
- CẤM "insert từng record + tự xoá tay/compensate" — phải dùng transaction boundary của EF Core.
- Khi rollback, thu thập index + lý do record gây lỗi để trả trong `failed`.
- `BEGIN TRANSACTION`/`INSERT`/`ROLLBACK` phải nhìn thấy được trong SQL log.

:::muted
Gợi ý
:::

Bọc `using var tx = await context.Database.BeginTransactionAsync();` trong `try`; `await context.SaveChangesAsync()` rồi `await tx.CommitAsync()`; trong `catch` không gọi commit (transaction tự rollback khi dispose). Bật EF logging qua `optionsBuilder.LogTo(Console.WriteLine)`.
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
Bọc cả lô trong một transaction all-or-nothing
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

Ghi cả lô bên trong MỘT database transaction sao cho khi một record bất kỳ fail, mọi insert trước đó trong cùng lô đều bị huỷ (`ROLLBACK`) — kết thúc với trạng thái database y hệt lúc trước khi gọi.

:::muted
Ràng buộc kỹ thuật
:::

- Bọc toàn bộ insert lô trong `db.Transaction(func(tx *gorm.DB) error { ... })`; trả về `nil` để commit, trả về `error` để GORM tự `ROLLBACK`.
- Nếu bất kỳ `tx.Create(...)` nào trả lỗi (vi phạm unique, thiếu field) → trả error đó ra khỏi closure → GORM rollback toàn bộ; KHÔNG giữ lại record nào của lô.
- CẤM "insert từng record + tự xoá tay/compensate" — phải dùng `db.Transaction` (hoặc `Begin/Commit/Rollback`) của GORM.
- Khi rollback, thu thập index + lý do record gây lỗi để trả trong `failed`.
- `BEGIN`/`INSERT`/`ROLLBACK` phải nhìn thấy được trong SQL log.

:::muted
Gợi ý
:::

Dùng `db.Transaction(func(tx *gorm.DB) error { for i, u := range input { if err := tx.Create(&u).Error; err != nil { return fmt.Errorf("index %d: %w", i, err) } } return nil })`. Bật GORM logger ở mức `logger.Info` để thấy `BEGIN`/`ROLLBACK`.
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
Chuyển store sang database thật với ràng buộc unique
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** Thêm PostgreSQL (Docker) + `@nestjs/typeorm` `typeorm` `pg`; cấu hình `TypeOrmModule.forRoot({ ..., logging: true })`.
- **Bước 2:** Tạo entity `User` với `@PrimaryGeneratedColumn("uuid")` và `@Column({ unique: true })` trên `email`.
- **Bước 3:** Giữ các operation CRUD đơn lẻ (từ challenge trước) chạy trên repository; chạy migration/sync để tạo bảng + unique index.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- App boot, kết nối DB, bảng `users` có unique constraint trên `email`.
- Insert hai user trùng email (ngoài batch) cũng bị DB từ chối.

:::muted
Nice to have
:::

- Dùng migration tường minh thay vì `synchronize: true`.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Chuyển store sang database thật với ràng buộc unique
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** Thêm PostgreSQL (Docker) + `spring-boot-starter-data-jpa` + driver `postgresql`.
- **Bước 2:** Tạo `@Entity User` với `@Id` UUID và `@Column(unique = true)` trên `email`; tạo `UserRepository extends JpaRepository`.
- **Bước 3:** Cấu hình `spring.jpa.show-sql=true` và để Hibernate tạo schema (hoặc Flyway) với unique index trên `email`.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- App boot, kết nối DB, bảng `users` có unique constraint trên `email`.

:::muted
Nice to have
:::

- Dùng Flyway/Liquibase migration thay vì `ddl-auto=update`.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Chuyển store sang database thật với ràng buộc unique
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** Thêm PostgreSQL (Docker) + `Microsoft.EntityFrameworkCore` + `Npgsql.EntityFrameworkCore.PostgreSQL`.
- **Bước 2:** Tạo `AppDbContext` với `DbSet<User>`; trong `OnModelCreating` cấu hình `HasIndex(u => u.Email).IsUnique()`.
- **Bước 3:** Tạo migration (`dotnet ef migrations add Init`) + `dotnet ef database update`; bật EF query logging.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- App boot, kết nối DB, bảng `Users` có unique index trên `Email`.

:::muted
Nice to have
:::

- Cấu hình logging chỉ ở môi trường Development.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Chuyển store sang database thật với ràng buộc unique
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** Thêm PostgreSQL (Docker) + `gorm.io/gorm` + `gorm.io/driver/postgres`.
- **Bước 2:** Định nghĩa model `User` với `ID string gorm:"primaryKey"` và `Email string gorm:"uniqueIndex"`.
- **Bước 3:** `db.AutoMigrate(&User{})` để tạo bảng + unique index; cấu hình GORM logger ở mức `Info`.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- App boot, kết nối DB, bảng `users` có unique index trên `email`.

:::muted
Nice to have
:::

- Tách config DSN ra biến môi trường.
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
Triển khai endpoint batch với transaction và response failed[]
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** Thêm `@Post("batch")` trong `UserController`, nhận `BatchCreateUsersDto`.
- **Bước 2:** Trong service: `const qr = dataSource.createQueryRunner(); await qr.connect(); await qr.startTransaction();`.
- **Bước 3:** Lặp qua `users`, insert từng record qua `qr.manager`; nếu một insert ném lỗi, bắt nó, ghi `{ index, reason }`, `await qr.rollbackTransaction()` và trả `{ created: 0, failed }`.
- **Bước 4:** Nếu mọi insert thành công → `await qr.commitTransaction()` và trả `{ created: users.length, failed: [] }`; luôn `await qr.release()` ở `finally`.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- Lô hợp lệ → mọi record được commit, `failed` rỗng.
- Lô có 1 record email trùng → KHÔNG record nào tồn tại sau đó (rollback), `failed` có đúng index + reason.

:::muted
Nice to have
:::

- Trả `207 Multi-Status` thay vì `201` khi có failed (tuỳ thiết kế, ghi rõ trong README).
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Triển khai endpoint batch với transaction và response failed[]
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** Thêm `@PostMapping("/batch")` nhận `@Valid BatchCreateRequest`.
- **Bước 2:** Tạo method service `@Transactional` lặp qua list và `userRepository.save(...)` từng record; gọi `saveAndFlush` để vi phạm unique nổ ra ngay trong transaction.
- **Bước 3:** Nếu một save ném `DataIntegrityViolationException`, để nó lan ra → `@Transactional` rollback toàn bộ; tầng controller/service bao ngoài bắt exception, dựng `failed: [{ index, reason }]`.
- **Bước 4:** Khi không có lỗi → trả `{ created: N, failed: [] }`.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- Lô hợp lệ → mọi record commit, `failed` rỗng.
- Lô có 1 record email trùng → KHÔNG record nào tồn tại sau đó (rollback), `failed` có đúng index + reason.

:::muted
Nice to have
:::

- Map nhiều loại lỗi (validation vs unique) thành `reason` rõ ràng.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Triển khai endpoint batch với transaction và response failed[]
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** Map `POST /users/batch` nhận `BatchCreateUsersDto`.
- **Bước 2:** `await using var tx = await context.Database.BeginTransactionAsync();` trong `try`; `context.Users.Add(...)` từng record rồi `await context.SaveChangesAsync()`.
- **Bước 3:** Nếu `SaveChangesAsync` ném `DbUpdateException` (vi phạm unique) → vào `catch`, KHÔNG commit (tx dispose = rollback), dựng `failed: [{ index, reason }]`, trả `{ created: 0, failed }`.
- **Bước 4:** Nếu thành công → `await tx.CommitAsync()`, trả `{ created: N, failed: [] }`.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- Lô hợp lệ → mọi record commit, `failed` rỗng.
- Lô có 1 record email trùng → KHÔNG record nào tồn tại sau đó (rollback), `failed` có đúng index + reason.

:::muted
Nice to have
:::

- Parse `DbUpdateException.InnerException` để lấy reason cụ thể.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Triển khai endpoint batch với transaction và response failed[]
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** Đăng ký `r.POST("/users/batch", ...)`; bind body vào `struct { Users []CreateUserInput }`.
- **Bước 2:** Gọi `err := db.Transaction(func(tx *gorm.DB) error { ... })`; bên trong, lặp qua slice và `tx.Create(&user)`.
- **Bước 3:** Nếu một `tx.Create` trả lỗi, trả `fmt.Errorf("index %d: %w", i, err)` ra khỏi closure → GORM rollback; bên ngoài, parse index + reason, trả `{ created: 0, failed }`.
- **Bước 4:** Nếu closure trả `nil` → đã commit, trả `{ created: N, failed: [] }`.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- Lô hợp lệ → mọi record commit, `failed` rỗng.
- Lô có 1 record email trùng → KHÔNG record nào tồn tại sau đó (rollback), `failed` có đúng index + reason.

:::muted
Nice to have
:::

- Dùng `errors.As` để phân biệt lỗi unique với lỗi khác.
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
Chứng minh tính nguyên tử bằng SQL log và viết README
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** Gửi một lô hợp lệ (vd 3 user mới) và một lô có 1 email trùng:
  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri "http://localhost:3000/users/batch" -Method Post -Body (@{ users = @(@{ name="A"; email="a@x.com" }, @{ name="B"; email="a@x.com" }) } | ConvertTo-Json -Depth 5) -ContentType "application/json"

  # macOS / Linux
  curl -i -X POST http://localhost:3000/users/batch -H "Content-Type: application/json" -d '{"users":[{"name":"A","email":"a@x.com"},{"name":"B","email":"a@x.com"}]}'
  ```
- **Bước 2:** Sau lô lỗi, gọi `GET /users` và xác nhận count KHÔNG tăng (rollback thật).
- **Bước 3:** Copy đoạn SQL log thể hiện `START TRANSACTION` → các `INSERT` → `ROLLBACK`.
- **Bước 4:** Dán cả response thật lẫn SQL log vào README (không bịa).

:::muted
Yêu cầu tối thiểu cần đạt
:::

- README có 6 mục: Challenge description, How to run, Architecture/Stack, Smoke Test, Code Execution Trace, Design Decisions.
- Smoke Test chứng minh count không đổi sau lô lỗi + SQL log có `ROLLBACK`.

:::muted
Nice to have
:::

- Benchmark thời gian commit của lô lớn (vd 1000 record).
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Chứng minh tính nguyên tử bằng SQL log và viết README
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** Gửi một lô hợp lệ và một lô có 1 email trùng:
  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri "http://localhost:3000/users/batch" -Method Post -Body (@{ users = @(@{ name="A"; email="a@x.com" }, @{ name="B"; email="a@x.com" }) } | ConvertTo-Json -Depth 5) -ContentType "application/json"

  # macOS / Linux
  curl -i -X POST http://localhost:3000/users/batch -H "Content-Type: application/json" -d '{"users":[{"name":"A","email":"a@x.com"},{"name":"B","email":"a@x.com"}]}'
  ```
- **Bước 2:** Sau lô lỗi, gọi `GET /users` và xác nhận count KHÔNG tăng (rollback thật).
- **Bước 3:** Copy đoạn SQL log (`show-sql`) thể hiện `INSERT` → rollback.
- **Bước 4:** Dán cả response thật lẫn SQL log vào README.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- README có 6 mục.
- Smoke Test chứng minh count không đổi sau lô lỗi + log rollback.

:::muted
Nice to have
:::

- Benchmark lô lớn.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Chứng minh tính nguyên tử bằng SQL log và viết README
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** Gửi một lô hợp lệ và một lô có 1 email trùng:
  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri "http://localhost:3000/users/batch" -Method Post -Body (@{ users = @(@{ name="A"; email="a@x.com" }, @{ name="B"; email="a@x.com" }) } | ConvertTo-Json -Depth 5) -ContentType "application/json"

  # macOS / Linux
  curl -i -X POST http://localhost:3000/users/batch -H "Content-Type: application/json" -d '{"users":[{"name":"A","email":"a@x.com"},{"name":"B","email":"a@x.com"}]}'
  ```
- **Bước 2:** Sau lô lỗi, gọi `GET /users` và xác nhận count KHÔNG tăng (rollback thật).
- **Bước 3:** Copy EF log thể hiện `BEGIN TRANSACTION` → `INSERT` → `ROLLBACK`.
- **Bước 4:** Dán cả response thật lẫn SQL log vào README.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- README có 6 mục.
- Smoke Test chứng minh count không đổi sau lô lỗi + log `ROLLBACK`.

:::muted
Nice to have
:::

- Benchmark lô lớn.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Chứng minh tính nguyên tử bằng SQL log và viết README
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** Gửi một lô hợp lệ và một lô có 1 email trùng:
  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri "http://localhost:3000/users/batch" -Method Post -Body (@{ users = @(@{ name="A"; email="a@x.com" }, @{ name="B"; email="a@x.com" }) } | ConvertTo-Json -Depth 5) -ContentType "application/json"

  # macOS / Linux
  curl -i -X POST http://localhost:3000/users/batch -H "Content-Type: application/json" -d '{"users":[{"name":"A","email":"a@x.com"},{"name":"B","email":"a@x.com"}]}'
  ```
- **Bước 2:** Sau lô lỗi, gọi `GET /users` và xác nhận count KHÔNG tăng (rollback thật).
- **Bước 3:** Copy GORM log thể hiện `BEGIN` → `INSERT` → `ROLLBACK`.
- **Bước 4:** Dán cả response thật lẫn SQL log vào README.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- README có 6 mục.
- Smoke Test chứng minh count không đổi sau lô lỗi + log `ROLLBACK`.

:::muted
Nice to have
:::

- Benchmark lô lớn.
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
Bạn hiểu transaction boundary: một lô ghi hoặc thành công trọn vẹn hoặc không để lại dấu vết nào (atomicity).
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Bạn hiểu transaction boundary: một lô ghi hoặc thành công trọn vẹn hoặc không để lại dấu vết nào (atomicity).
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Bạn hiểu transaction boundary: một lô ghi hoặc thành công trọn vẹn hoặc không để lại dấu vết nào (atomicity).
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Bạn hiểu transaction boundary: một lô ghi hoặc thành công trọn vẹn hoặc không để lại dấu vết nào (atomicity).
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
Bạn dùng được unique constraint của database làm cơ chế bắt lỗi trùng và biến vi phạm đó thành một rollback có kiểm soát thay vì partial write.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Bạn dùng được unique constraint của database làm cơ chế bắt lỗi trùng và biến vi phạm đó thành một rollback có kiểm soát thay vì partial write.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Bạn dùng được unique constraint của database làm cơ chế bắt lỗi trùng và biến vi phạm đó thành một rollback có kiểm soát thay vì partial write.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Bạn dùng được unique constraint của database làm cơ chế bắt lỗi trùng và biến vi phạm đó thành một rollback có kiểm soát thay vì partial write.
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
Đã hoàn thành challenge medium (pagination/filter trên DB thật) + Docker chạy PostgreSQL local.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Đã hoàn thành challenge medium (pagination/filter trên DB thật) + Docker chạy PostgreSQL local.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Đã hoàn thành challenge medium (pagination/filter trên DB thật) + Docker chạy PostgreSQL local.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Đã hoàn thành challenge medium (pagination/filter trên DB thật) + Docker chạy PostgreSQL local.
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
Hiểu khái niệm ACID transaction (`BEGIN`/`COMMIT`/`ROLLBACK`) và atomicity.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Hiểu khái niệm ACID transaction (`BEGIN`/`COMMIT`/`ROLLBACK`) và atomicity.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Hiểu khái niệm ACID transaction (`BEGIN`/`COMMIT`/`ROLLBACK`) và atomicity.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Hiểu khái niệm ACID transaction (`BEGIN`/`COMMIT`/`ROLLBACK`) và atomicity.
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
