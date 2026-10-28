# sortIndex
<!-- @starci/seperator -->
4
<!-- @starci/seperator -->
# title
<!-- @starci/seperator -->
Import CSV bất đồng bộ, idempotent với Idempotency-Key và xử lý theo chunk
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
Xây `POST /users/import` nhận file CSV upload + header `Idempotency-Key`, trả về `202 Accepted` + `{ jobId }` và xử lý bất đồng bộ theo chunk; client poll `GET /users/import/{jobId}` để xem tiến độ (`{ status, processed, total, errors }`). Gửi lại CÙNG `Idempotency-Key` phải trả về kết quả cũ từ Redis, KHÔNG insert trùng. Chọn ngôn ngữ của bạn; mọi ngôn ngữ trả cùng một contract output.
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
Nhận upload và trả 202 + jobId ngay, xử lý bất đồng bộ
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

`POST /users/import` không xử lý đồng bộ trong request — nó chỉ ghi nhận job và trả ngay `202 Accepted` + `{ jobId }`, để việc import chạy nền. Đây là pattern chuẩn cho tác vụ dài (file lớn) tránh giữ kết nối HTTP quá lâu.

:::muted
Ràng buộc kỹ thuật
:::

- `POST /users/import` nhận `multipart/form-data` chứa file CSV (cột `name,email`) + header `Idempotency-Key` bắt buộc; thiếu key hoặc thiếu file → 400.
- Endpoint phải trả 202 Accepted + body `{ jobId }` NGAY, KHÔNG chờ parse/insert xong.
- Việc parse + insert chạy trên một background worker/queue, KHÔNG block event-loop của request handler.
- `GET /users/import/{jobId}` trả `{ status, processed, total, errors }` với `status ∈ { queued, processing, done, failed }`.

:::muted
Gợi ý
:::

Dùng BullMQ (`Queue` + `Worker` trên ioredis) cho job nền; `@Post("import")` chỉ `queue.add(...)` rồi `return { jobId }` với `@HttpCode(202)`. Đọc file qua `@UseInterceptors(FileInterceptor("file"))`.
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
Nhận upload và trả 202 + jobId ngay, xử lý bất đồng bộ
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

`POST /users/import` không xử lý đồng bộ trong request — nó chỉ ghi nhận job và trả ngay `202 Accepted` + `{ jobId }`, để việc import chạy nền. Đây là pattern chuẩn cho tác vụ dài (file lớn) tránh giữ kết nối HTTP quá lâu.

:::muted
Ràng buộc kỹ thuật
:::

- `POST /users/import` nhận `multipart/form-data` chứa file CSV (cột `name,email`) + header `Idempotency-Key` bắt buộc; thiếu key hoặc file → 400.
- Endpoint phải trả 202 Accepted + body `{ jobId }` NGAY, KHÔNG chờ parse/insert xong.
- Việc parse + insert chạy trên một background thread/task (`@Async` hoặc executor), KHÔNG block request thread.
- `GET /users/import/{jobId}` trả `{ status, processed, total, errors }` với `status ∈ { queued, processing, done, failed }`.

:::muted
Gợi ý
:::

Dùng `@Async` (bật `@EnableAsync`) cho method import; controller `@PostMapping` nhận `@RequestParam MultipartFile file` + `@RequestHeader("Idempotency-Key")`, gọi service async, rồi trả `ResponseEntity.accepted().body(...)`.
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
Nhận upload và trả 202 + jobId ngay, xử lý bất đồng bộ
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

`POST /users/import` không xử lý đồng bộ trong request — nó chỉ ghi nhận job và trả ngay `202 Accepted` + `{ jobId }`, để việc import chạy nền. Đây là pattern chuẩn cho tác vụ dài (file lớn) tránh giữ kết nối HTTP quá lâu.

:::muted
Ràng buộc kỹ thuật
:::

- `POST /users/import` nhận `multipart/form-data` chứa file CSV (cột `name,email`) + header `Idempotency-Key` bắt buộc; thiếu key hoặc file → 400.
- Endpoint phải trả 202 Accepted (`Results.Accepted(...)`) + body `{ jobId }` NGAY, KHÔNG chờ parse/insert xong.
- Việc parse + insert chạy trên một background service (`IHostedService`/`BackgroundService` + queue, hoặc Hangfire), KHÔNG block request.
- `GET /users/import/{jobId}` trả `{ status, processed, total, errors }` với `status ∈ { queued, processing, done, failed }`.

:::muted
Gợi ý
:::

Dùng một `BackgroundService` đọc job từ `Channel<ImportJob>`, hoặc Hangfire `BackgroundJob.Enqueue`. Endpoint nhận `IFormFile file` + `Request.Headers["Idempotency-Key"]`, enqueue rồi `return Results.Accepted($"/users/import/{jobId}", new { jobId });`.
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
Nhận upload và trả 202 + jobId ngay, xử lý bất đồng bộ
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

`POST /users/import` không xử lý đồng bộ trong request — nó chỉ ghi nhận job và trả ngay `202 Accepted` + `{ jobId }`, để việc import chạy nền. Đây là pattern chuẩn cho tác vụ dài (file lớn) tránh giữ kết nối HTTP quá lâu.

:::muted
Ràng buộc kỹ thuật
:::

- `POST /users/import` nhận `multipart/form-data` chứa file CSV (cột `name,email`) + header `Idempotency-Key` bắt buộc; thiếu key hoặc file → 400.
- Endpoint phải trả 202 Accepted (`c.JSON(http.StatusAccepted, ...)`) + body `{ jobId }` NGAY, KHÔNG chờ parse/insert xong.
- Việc parse + insert chạy trên một goroutine nền (gửi job qua channel cho worker), KHÔNG block handler.
- `GET /users/import/{jobId}` trả `{ status, processed, total, errors }` với `status ∈ { queued, processing, done, failed }`.

:::muted
Gợi ý
:::

Đọc file qua `c.FormFile("file")` + `c.GetHeader("Idempotency-Key")`. Khởi một worker pool đọc từ `chan ImportJob`; handler đẩy job vào channel rồi trả ngay. CẨN THẬN copy nội dung file ra buffer trước khi handler return (file gốc bị đóng sau request).
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
Idempotency qua Redis + xử lý theo chunk + báo lỗi từng dòng
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

Bảo đảm gửi lại CÙNG `Idempotency-Key` không bao giờ insert trùng — kết quả của lần đầu được lưu trong Redis và lần sau trả lại y nguyên. File lớn được xử lý theo chunk (stream), và mỗi dòng lỗi được ghi nhận riêng mà không làm hỏng cả job (partial-success cho import).

:::muted
Ràng buộc kỹ thuật
:::

- `Idempotency-Key → result` phải lưu trong Redis (restart-safe), CẤM lưu trong `Map`/biến in-memory của process.
- Lần gửi đầu với một key: tạo job, xử lý, lưu kết quả (`jobId` + summary) vào Redis dưới key đó (có TTL).
- Lần gửi lại với CÙNG key: phát hiện key đã tồn tại trong Redis → trả lại kết quả cũ (cùng `jobId`/summary), KHÔNG parse lại, KHÔNG insert thêm dòng nào.
- File phải được đọc/insert theo chunk (vd 500 dòng/lần), KHÔNG nạp toàn bộ rows vào RAM rồi insert một phát; cập nhật `processed` sau mỗi chunk.
- Mỗi dòng không hợp lệ (thiếu email, sai format) được thêm vào `errors: [{ row, reason }]`; các dòng hợp lệ VẪN được insert (partial-success — KHÁC với rollback toàn bộ ở challenge hard).

:::muted
Gợi ý
:::

Dùng `SET <key> <result> NX EX <ttl>` của Redis để vừa kiểm tra-vừa-đặt nguyên tử (chống race 2 request cùng key). Stream CSV bằng `csv-parse` ở chế độ stream; gom dòng thành chunk rồi `insert` theo batch. Lưu trạng thái job (`status/processed/total/errors`) trong Redis hash để `GET .../{jobId}` đọc ra.
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
Idempotency qua Redis + xử lý theo chunk + báo lỗi từng dòng
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

Bảo đảm gửi lại CÙNG `Idempotency-Key` không bao giờ insert trùng — kết quả của lần đầu được lưu trong Redis và lần sau trả lại y nguyên. File lớn được xử lý theo chunk (stream), và mỗi dòng lỗi được ghi nhận riêng mà không làm hỏng cả job (partial-success cho import).

:::muted
Ràng buộc kỹ thuật
:::

- `Idempotency-Key → result` phải lưu trong Redis (`RedisTemplate`/Lettuce), CẤM lưu trong `ConcurrentHashMap` in-memory của process.
- Lần gửi đầu: tạo job, xử lý, lưu kết quả vào Redis dưới key đó (có TTL).
- Lần gửi lại CÙNG key: phát hiện key đã tồn tại trong Redis → trả lại kết quả cũ (cùng `jobId`/summary), KHÔNG parse lại, KHÔNG insert thêm dòng nào.
- File phải được đọc/insert theo chunk (vd 500 dòng/lần) — dùng `saveAll` theo batch + `clear` EntityManager để tránh OOM; cập nhật `processed` sau mỗi chunk.
- Mỗi dòng không hợp lệ vào `errors: [{ row, reason }]`; các dòng hợp lệ VẪN được insert (partial-success — KHÁC rollback ở challenge hard).

:::muted
Gợi ý
:::

Dùng `redisTemplate.opsForValue().setIfAbsent(key, result, ttl)` (SET NX EX) để vừa kiểm tra-vừa-đặt nguyên tử. Parse CSV bằng Apache Commons CSV ở chế độ iterator (không đọc hết file vào list). Lưu trạng thái job trong Redis.
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
Idempotency qua Redis + xử lý theo chunk + báo lỗi từng dòng
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

Bảo đảm gửi lại CÙNG `Idempotency-Key` không bao giờ insert trùng — kết quả của lần đầu được lưu trong Redis và lần sau trả lại y nguyên. File lớn được xử lý theo chunk (stream), và mỗi dòng lỗi được ghi nhận riêng mà không làm hỏng cả job (partial-success cho import).

:::muted
Ràng buộc kỹ thuật
:::

- `Idempotency-Key → result` phải lưu trong Redis qua `IDistributedCache` (Redis backend), CẤM lưu trong `ConcurrentDictionary` in-memory.
- Lần gửi đầu: tạo job, xử lý, lưu kết quả vào Redis dưới key đó (có TTL).
- Lần gửi lại CÙNG key: phát hiện key đã tồn tại → trả lại kết quả cũ (cùng `jobId`/summary), KHÔNG parse lại, KHÔNG insert thêm.
- File phải được đọc/insert theo chunk (vd 500 dòng/lần) — dùng `CsvHelper` đọc streaming + `AddRange` + `SaveChanges` theo batch; cập nhật `processed` sau mỗi chunk.
- Mỗi dòng không hợp lệ vào `errors: [{ row, reason }]`; các dòng hợp lệ VẪN được insert (partial-success — KHÁC rollback ở challenge hard).

:::muted
Gợi ý
:::

Dùng `StackExchange.Redis` `StringSet(key, value, ttl, when: When.NotExists)` (SET NX EX) để kiểm tra-và-đặt nguyên tử. `CsvHelper.GetRecords<T>()` trả về IEnumerable lazy — gom thành chunk. Lưu trạng thái job trong Redis.
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
Idempotency qua Redis + xử lý theo chunk + báo lỗi từng dòng
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

Bảo đảm gửi lại CÙNG `Idempotency-Key` không bao giờ insert trùng — kết quả của lần đầu được lưu trong Redis và lần sau trả lại y nguyên. File lớn được xử lý theo chunk (stream), và mỗi dòng lỗi được ghi nhận riêng mà không làm hỏng cả job (partial-success cho import).

:::muted
Ràng buộc kỹ thuật
:::

- `Idempotency-Key → result` phải lưu trong Redis (`go-redis`), CẤM lưu trong `map` in-memory được bảo vệ bằng mutex của process.
- Lần gửi đầu: tạo job, xử lý, lưu kết quả vào Redis dưới key đó (có TTL).
- Lần gửi lại CÙNG key: phát hiện key đã tồn tại → trả lại kết quả cũ (cùng `jobId`/summary), KHÔNG parse lại, KHÔNG insert thêm.
- File phải được đọc/insert theo chunk (vd 500 dòng/lần) — dùng `encoding/csv` `Reader.Read()` từng dòng (streaming), gom thành chunk rồi `CreateInBatches`; cập nhật `processed` sau mỗi chunk.
- Mỗi dòng không hợp lệ vào `errors: [{ row, reason }]`; các dòng hợp lệ VẪN được insert (partial-success — KHÁC rollback ở challenge hard).

:::muted
Gợi ý
:::

Dùng `rdb.SetNX(ctx, key, result, ttl)` (SET NX EX) để kiểm tra-và-đặt nguyên tử. `csv.NewReader(r).Read()` đọc lần lượt từng record (không `ReadAll`). Lưu trạng thái job trong Redis.
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
Dựng hạ tầng queue + Redis và endpoint nhận upload
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** Chạy Redis qua Docker; thêm `ioredis` `bullmq` `csv-parse` `@nestjs/platform-express`.
- **Bước 2:** Định nghĩa `Queue("user-import")` + `Worker("user-import", processor)`; đăng ký một Redis connection dùng chung.
- **Bước 3:** `@Post("import")` với `@HttpCode(202)` + `FileInterceptor("file")`: đọc header `Idempotency-Key`, sinh `jobId`, `queue.add(...)` (kèm buffer file), trả `{ jobId }`.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- `POST /users/import` trả `202` + `jobId` ngay.
- Job thực sự được worker nền nhặt và xử lý (log thấy worker chạy).

:::muted
Nice to have
:::

- Validate Content-Type của file là `text/csv`.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Dựng hạ tầng async + Redis và endpoint nhận upload
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** Chạy Redis qua Docker; thêm `spring-boot-starter-data-redis` + `commons-csv`; bật `@EnableAsync`.
- **Bước 2:** Cấu hình `RedisTemplate<String, String>`; tạo `ImportService` với method `@Async importAsync(...)`.
- **Bước 3:** `@PostMapping("/import")` nhận `MultipartFile` + `@RequestHeader("Idempotency-Key")`: sinh `jobId`, gọi `importAsync`, trả `ResponseEntity.accepted().body(...)`.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- `POST /users/import` trả `202` + `jobId` ngay.
- Method `@Async` chạy trên thread khác request thread (log thấy thread name khác).

:::muted
Nice to have
:::

- Cấu hình một `ThreadPoolTaskExecutor` riêng cho import.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Dựng hạ tầng background + Redis và endpoint nhận upload
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** Chạy Redis qua Docker; thêm `StackExchange.Redis` (hoặc `Microsoft.Extensions.Caching.StackExchangeRedis`) + `CsvHelper`.
- **Bước 2:** Đăng ký một `BackgroundService` đọc job từ `Channel<ImportJob>` (hoặc Hangfire).
- **Bước 3:** Map `POST /users/import` nhận `IFormFile` + `Idempotency-Key`: sinh `jobId`, enqueue job, trả `Results.Accepted(...)`.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- `POST /users/import` trả `202` + `jobId` ngay.
- `BackgroundService` thực sự nhặt và xử lý job (log thấy).

:::muted
Nice to have
:::

- Giới hạn kích thước upload qua `RequestSizeLimit`.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Dựng hạ tầng worker + Redis và endpoint nhận upload
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** Chạy Redis qua Docker; `go get github.com/redis/go-redis/v9`; CSV dùng `encoding/csv` của stdlib.
- **Bước 2:** Khởi `chan ImportJob` + một (hoặc vài) goroutine worker đọc từ channel; kết nối `redis.NewClient`.
- **Bước 3:** `r.POST("/users/import", ...)`: `c.FormFile("file")` + `c.GetHeader("Idempotency-Key")`, copy file vào buffer, sinh `jobId`, đẩy job vào channel, trả `c.JSON(202, gin.H{"jobId": jobId})`.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- `POST /users/import` trả `202` + `jobId` ngay.
- Worker goroutine thực sự nhặt và xử lý job.

:::muted
Nice to have
:::

- `context.Context` có timeout cho mỗi job.
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
Cài **idempotency** Redis + xử lý chunk + endpoint poll trạng thái
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** Trước khi tạo job, gọi `redis.set("idem:"+key, JSON, "EX", ttl, "NX")`. Nếu trả `null` (key đã có) → đọc lại result cũ từ Redis và trả về (cùng `jobId`), KHÔNG enqueue mới.
- **Bước 2:** Trong worker: stream CSV, gom thành chunk 500 dòng, insert theo batch trong DB; sau mỗi chunk cập nhật `processed` trong Redis hash của job.
- **Bước 3:** Dòng lỗi → push `{ row, reason }` vào `errors`; dòng hợp lệ vẫn insert. Khi xong, set `status: "done"` + lưu summary vào key idempotency.
- **Bước 4:** `@Get("import/:jobId")` đọc Redis hash của job và trả `{ status, processed, total, errors }`.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- Lần đầu một key → job chạy tới `done`, `processed == total - (dòng lỗi parse)`.
- Gửi lại CÙNG key → trả `jobId` cũ, KHÔNG có dòng nào được insert thêm.

:::muted
Nice to have
:::

- Cờ `replayed: true` trong response khi trả từ cache idempotency.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Cài idempotency Redis + xử lý chunk + endpoint poll trạng thái
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** Trước khi tạo job, `setIfAbsent("idem:"+key, JSON, ttl)`. Nếu trả `false` (key đã có) → đọc result cũ từ Redis và trả về (cùng `jobId`), KHÔNG chạy import mới.
- **Bước 2:** Trong method `@Async`: parse CSV streaming, gom chunk 500 dòng, `saveAll` theo batch + `entityManager.flush()/clear()`; sau mỗi chunk cập nhật `processed` trong Redis.
- **Bước 3:** Dòng lỗi → thêm `{ row, reason }` vào `errors`; dòng hợp lệ vẫn insert. Khi xong, set `status=done` + lưu summary vào key idempotency.
- **Bước 4:** `@GetMapping("/import/{jobId}")` đọc trạng thái job từ Redis và trả `{ status, processed, total, errors }`.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- Lần đầu một key → job chạy tới `done`, `processed` đúng.
- Gửi lại CÙNG key → trả `jobId` cũ, KHÔNG có dòng nào được insert thêm.

:::muted
Nice to have
:::

- Cờ `replayed` khi trả từ cache idempotency.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Cài idempotency Redis + xử lý chunk + endpoint poll trạng thái
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** Trước khi tạo job, `db.StringSet("idem:"+key, JSON, ttl, when: When.NotExists)`. Nếu trả `false` → đọc result cũ và trả về (cùng `jobId`), KHÔNG chạy import mới.
- **Bước 2:** Trong `BackgroundService`: đọc CSV streaming bằng `CsvHelper`, gom chunk 500 dòng, `AddRange` + `SaveChangesAsync` theo batch; sau mỗi chunk cập nhật `processed` trong Redis.
- **Bước 3:** Dòng lỗi → thêm `{ row, reason }` vào `errors`; dòng hợp lệ vẫn insert. Khi xong, set `status=done` + lưu summary vào key idempotency.
- **Bước 4:** Map `GET /users/import/{jobId}` đọc trạng thái từ Redis và trả `{ status, processed, total, errors }`.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- Lần đầu một key → job chạy tới `done`, `processed` đúng.
- Gửi lại CÙNG key → trả `jobId` cũ, KHÔNG có dòng nào được insert thêm.

:::muted
Nice to have
:::

- Cờ `replayed` khi trả từ cache idempotency.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Cài idempotency Redis + xử lý chunk + endpoint poll trạng thái
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** Trước khi tạo job, `rdb.SetNX(ctx, "idem:"+key, JSON, ttl)`. Nếu trả `false` → đọc result cũ từ Redis và trả về (cùng `jobId`), KHÔNG chạy import mới.
- **Bước 2:** Trong worker goroutine: `csv.Reader.Read()` từng dòng, gom chunk 500 dòng, `CreateInBatches`; sau mỗi chunk cập nhật `processed` trong Redis.
- **Bước 3:** Dòng lỗi → append `{ row, reason }` vào `errors`; dòng hợp lệ vẫn insert. Khi xong, set `status=done` + lưu summary vào key idempotency.
- **Bước 4:** `r.GET("/users/import/:jobId", ...)` đọc trạng thái từ Redis và trả `{ status, processed, total, errors }`.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- Lần đầu một key → job chạy tới `done`, `processed` đúng.
- Gửi lại CÙNG key → trả `jobId` cũ, KHÔNG có dòng nào được insert thêm.

:::muted
Nice to have
:::

- Cờ `replayed` khi trả từ cache idempotency.
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
Chứng minh idempotency + partial-success và viết README
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** Tạo file CSV ≥200 dòng (kèm vài dòng lỗi); import lần 1 với một key:
  ```bash
  # Windows (PowerShell)
  curl.exe -i -X POST http://localhost:3000/users/import -H "Idempotency-Key: imp-001" -F "file=@users.csv"

  # macOS / Linux
  curl -i -X POST http://localhost:3000/users/import -H "Idempotency-Key: imp-001" -F "file=@users.csv"
  ```
- **Bước 2:** Poll `GET /users/import/{jobId}` tới `status: done`; ghi lại `processed`, `total`, `errors`.
- **Bước 3:** Đếm `GET /users` count. Gửi LẠI cùng `Idempotency-Key: imp-001` với cùng file → xác nhận trả `jobId` cũ và `GET /users` count KHÔNG tăng.
- **Bước 4:** Dán cả response thật, snapshot poll, và 2 lần đếm count vào README (không bịa).

:::muted
Yêu cầu tối thiểu cần đạt
:::

- README có 6 mục: Challenge description, How to run, Architecture/Stack, Smoke Test, Code Execution Trace, Design Decisions.
- Smoke Test chứng minh: (a) job done với partial errors, (b) gửi lại cùng key → count không đổi.

:::muted
Nice to have
:::

- Benchmark thời gian import file 10k dòng.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Chứng minh idempotency + partial-success và viết README
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** Tạo file CSV ≥200 dòng (kèm vài dòng lỗi); import lần 1 với một key:
  ```bash
  # Windows (PowerShell)
  curl.exe -i -X POST http://localhost:3000/users/import -H "Idempotency-Key: imp-001" -F "file=@users.csv"

  # macOS / Linux
  curl -i -X POST http://localhost:3000/users/import -H "Idempotency-Key: imp-001" -F "file=@users.csv"
  ```
- **Bước 2:** Poll `GET /users/import/{jobId}` tới `status: done`; ghi lại `processed`, `total`, `errors`.
- **Bước 3:** Đếm `GET /users` count. Gửi LẠI cùng key với cùng file → xác nhận trả `jobId` cũ và count KHÔNG tăng.
- **Bước 4:** Dán cả response thật, snapshot poll, và 2 lần đếm count vào README.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- README có 6 mục.
- Smoke Test chứng minh: (a) job done với partial errors, (b) gửi lại cùng key → count không đổi.

:::muted
Nice to have
:::

- Benchmark import file 10k dòng.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Chứng minh idempotency + partial-success và viết README
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** Tạo file CSV ≥200 dòng (kèm vài dòng lỗi); import lần 1 với một key:
  ```bash
  # Windows (PowerShell)
  curl.exe -i -X POST http://localhost:3000/users/import -H "Idempotency-Key: imp-001" -F "file=@users.csv"

  # macOS / Linux
  curl -i -X POST http://localhost:3000/users/import -H "Idempotency-Key: imp-001" -F "file=@users.csv"
  ```
- **Bước 2:** Poll `GET /users/import/{jobId}` tới `status: done`; ghi lại `processed`, `total`, `errors`.
- **Bước 3:** Đếm `GET /users` count. Gửi LẠI cùng key với cùng file → xác nhận trả `jobId` cũ và count KHÔNG tăng.
- **Bước 4:** Dán cả response thật, snapshot poll, và 2 lần đếm count vào README.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- README có 6 mục.
- Smoke Test chứng minh: (a) job done với partial errors, (b) gửi lại cùng key → count không đổi.

:::muted
Nice to have
:::

- Benchmark import file 10k dòng.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Chứng minh idempotency + partial-success và viết README
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** Tạo file CSV ≥200 dòng (kèm vài dòng lỗi); import lần 1 với một key:
  ```bash
  # Windows (PowerShell)
  curl.exe -i -X POST http://localhost:3000/users/import -H "Idempotency-Key: imp-001" -F "file=@users.csv"

  # macOS / Linux
  curl -i -X POST http://localhost:3000/users/import -H "Idempotency-Key: imp-001" -F "file=@users.csv"
  ```
- **Bước 2:** Poll `GET /users/import/{jobId}` tới `status: done`; ghi lại `processed`, `total`, `errors`.
- **Bước 3:** Đếm `GET /users` count. Gửi LẠI cùng key với cùng file → xác nhận trả `jobId` cũ và count KHÔNG tăng.
- **Bước 4:** Dán cả response thật, snapshot poll, và 2 lần đếm count vào README.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- README có 6 mục.
- Smoke Test chứng minh: (a) job done với partial errors, (b) gửi lại cùng key → count không đổi.

:::muted
Nice to have
:::

- Benchmark import file 10k dòng.
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
Bạn triển khai được idempotency thật ở mức implementation: cùng một Idempotency-Key luôn cho cùng một kết quả và không bao giờ ghi trùng, kể cả sau restart (vì state nằm ở Redis).
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Bạn triển khai được idempotency thật ở mức implementation: cùng một Idempotency-Key luôn cho cùng một kết quả và không bao giờ ghi trùng, kể cả sau restart (vì state nằm ở Redis).
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Bạn triển khai được idempotency thật ở mức implementation: cùng một Idempotency-Key luôn cho cùng một kết quả và không bao giờ ghi trùng, kể cả sau restart (vì state nằm ở Redis).
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Bạn triển khai được idempotency thật ở mức implementation: cùng một Idempotency-Key luôn cho cùng một kết quả và không bao giờ ghi trùng, kể cả sau restart (vì state nằm ở Redis).
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
Bạn xử lý được tác vụ dài bằng pattern async job (202 + poll) và stream file lớn theo chunk thay vì nạp hết vào RAM, với partial-success báo lỗi từng dòng.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Bạn xử lý được tác vụ dài bằng pattern async job (202 + poll) và stream file lớn theo chunk thay vì nạp hết vào RAM, với partial-success báo lỗi từng dòng.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Bạn xử lý được tác vụ dài bằng pattern async job (202 + poll) và stream file lớn theo chunk thay vì nạp hết vào RAM, với partial-success báo lỗi từng dòng.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Bạn xử lý được tác vụ dài bằng pattern async job (202 + poll) và stream file lớn theo chunk thay vì nạp hết vào RAM, với partial-success báo lỗi từng dòng.
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
Đã hoàn thành challenge hard (batch + transaction) + Docker chạy PostgreSQL và Redis local.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Đã hoàn thành challenge hard (batch + transaction) + Docker chạy PostgreSQL và Redis local.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Đã hoàn thành challenge hard (batch + transaction) + Docker chạy PostgreSQL và Redis local.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Đã hoàn thành challenge hard (batch + transaction) + Docker chạy PostgreSQL và Redis local.
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
Hiểu idempotency (§2.2.1), pattern async job (`202 Accepted` + polling), và cơ bản về Redis (`SET NX EX`, TTL).
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Hiểu idempotency (§2.2.1), pattern async job (`202 Accepted` + polling), và cơ bản về Redis (`SET NX EX`, TTL).
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Hiểu idempotency (§2.2.1), pattern async job (`202 Accepted` + polling), và cơ bản về Redis (`SET NX EX`, TTL).
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Hiểu idempotency (§2.2.1), pattern async job (`202 Accepted` + polling), và cơ bản về Redis (`SET NX EX`, TTL).
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
