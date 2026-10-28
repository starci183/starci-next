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
Một repo public chứa code (bằng ngôn ngữ bạn chọn) + README 6 mục mà phần Smoke Test chứng minh: job chạy tới done với lỗi từng dòng, và gửi lại cùng Idempotency-Key trả về jobId cũ trong khi số lượng user không đổi.
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
**Endpoint trả 202 + jobId ngay và job hoàn tất bất đồng bộ.** `POST /users/import` với file CSV + header `Idempotency-Key` phải trả về HTTP `202` và `{ jobId }` mà không chờ import xong. Poll `GET /users/import/{jobId}` cuối cùng phải đạt `status: "done"` với `processed`/`total` phản ánh đúng file. Trả về `200`/`201` đồng bộ sau khi import xong cả (không async), hoặc một `GET` không bao giờ đạt trạng thái cuối → FAIL.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Endpoint trả 202 + jobId ngay và job hoàn tất bất đồng bộ.** `POST /users/import` với file CSV + header `Idempotency-Key` phải trả về HTTP `202` và `{ jobId }` mà không chờ import xong. Poll `GET /users/import/{jobId}` cuối cùng phải đạt `status: "done"` với `processed`/`total` phản ánh đúng file. Trả về `200`/`201` đồng bộ sau khi import xong cả (không async), hoặc một `GET` không bao giờ đạt trạng thái cuối → FAIL.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Endpoint trả 202 + jobId ngay và job hoàn tất bất đồng bộ.** `POST /users/import` với file CSV + header `Idempotency-Key` phải trả về HTTP `202` và `{ jobId }` mà không chờ import xong. Poll `GET /users/import/{jobId}` cuối cùng phải đạt `status: "done"` với `processed`/`total` phản ánh đúng file. Trả về `200`/`201` đồng bộ sau khi import xong cả (không async), hoặc một `GET` không bao giờ đạt trạng thái cuối → FAIL.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Endpoint trả 202 + jobId ngay và job hoàn tất bất đồng bộ.** `POST /users/import` với file CSV + header `Idempotency-Key` phải trả về HTTP `202` và `{ jobId }` mà không chờ import xong. Poll `GET /users/import/{jobId}` cuối cùng phải đạt `status: "done"` với `processed`/`total` phản ánh đúng file. Trả về `200`/`201` đồng bộ sau khi import xong cả (không async), hoặc một `GET` không bao giờ đạt trạng thái cuối → FAIL.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
15
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
**Partial success: dòng lỗi được báo cáo từng dòng trong khi dòng hợp lệ vẫn được insert.** Với file chứa ít nhất một dòng không hợp lệ (thiếu email / sai format), job hoàn tất phải báo `errors: [{ row, reason }]` cho từng dòng lỗi VÀ vẫn insert mọi dòng hợp lệ — `GET /users` count phải tăng đúng bằng số dòng hợp lệ. Một dòng lỗi làm hỏng cả import (không dòng nào được insert), hoặc `errors` thiếu số dòng lỗi → FAIL. (Hành vi partial-success này CỐ Ý ngược với rollback all-or-nothing của challenge hard.)
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Partial success: dòng lỗi được báo cáo từng dòng trong khi dòng hợp lệ vẫn được insert.** Với file chứa ít nhất một dòng không hợp lệ (thiếu email / sai format), job hoàn tất phải báo `errors: [{ row, reason }]` cho từng dòng lỗi VÀ vẫn insert mọi dòng hợp lệ — `GET /users` count phải tăng đúng bằng số dòng hợp lệ. Một dòng lỗi làm hỏng cả import (không dòng nào được insert), hoặc `errors` thiếu số dòng lỗi → FAIL. (Hành vi partial-success này CỐ Ý ngược với rollback all-or-nothing của challenge hard.)
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Partial success: dòng lỗi được báo cáo từng dòng trong khi dòng hợp lệ vẫn được insert.** Với file chứa ít nhất một dòng không hợp lệ (thiếu email / sai format), job hoàn tất phải báo `errors: [{ row, reason }]` cho từng dòng lỗi VÀ vẫn insert mọi dòng hợp lệ — `GET /users` count phải tăng đúng bằng số dòng hợp lệ. Một dòng lỗi làm hỏng cả import (không dòng nào được insert), hoặc `errors` thiếu số dòng lỗi → FAIL. (Hành vi partial-success này CỐ Ý ngược với rollback all-or-nothing của challenge hard.)
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Partial success: dòng lỗi được báo cáo từng dòng trong khi dòng hợp lệ vẫn được insert.** Với file chứa ít nhất một dòng không hợp lệ (thiếu email / sai format), job hoàn tất phải báo `errors: [{ row, reason }]` cho từng dòng lỗi VÀ vẫn insert mọi dòng hợp lệ — `GET /users` count phải tăng đúng bằng số dòng hợp lệ. Một dòng lỗi làm hỏng cả import (không dòng nào được insert), hoặc `errors` thiếu số dòng lỗi → FAIL. (Hành vi partial-success này CỐ Ý ngược với rollback all-or-nothing của challenge hard.)
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
15
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
**Idempotency được ép qua Redis (restart-safe) nên cùng một key không bao giờ insert hai lần — kiểm bằng cách đọc code + diff số dòng.** Ánh xạ `Idempotency-Key → result` phải lưu trong Redis với check-and-set nguyên tử (`SET key value NX EX`), KHÔNG phải trong `Map`/object in-memory của process. Tiêm test: import file ≥200 dòng với `Idempotency-Key: imp-001`, chờ `done`, ghi `GET /users` count C1; gửi LẠI đúng key + file đó, chờ, ghi count C2 — C2 phải bằng C1 (không dòng mới) và response lần 2 phải mang CÙNG `jobId` với lần 1. Grep code: store idempotency phải là một lời gọi Redis client, không phải collection in-memory; và nhánh resend phải short-circuit TRƯỚC mọi DB insert. Bất kỳ: C2 > C1 (insert trùng khi resend), `jobId` mới khi resend, hoặc state idempotency nằm trong map in-memory (mất khi restart) → FAIL (critical → toàn bài challenge bằng 0 điểm).
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Idempotency được ép qua Redis (restart-safe) nên cùng một key không bao giờ insert hai lần — kiểm bằng cách đọc code + diff số dòng.** Ánh xạ `Idempotency-Key → result` phải lưu trong Redis với check-and-set nguyên tử (`setIfAbsent` = `SET NX EX`), KHÔNG phải trong `ConcurrentHashMap` của process. Tiêm test: import file ≥200 dòng với `Idempotency-Key: imp-001`, chờ `done`, ghi `GET /users` count C1; gửi LẠI đúng key + file đó, chờ, ghi count C2 — C2 phải bằng C1 (không dòng mới) và response lần 2 phải mang CÙNG `jobId` với lần 1. Grep code: store idempotency phải là lời gọi `RedisTemplate`/Lettuce, không phải collection in-memory; và nhánh resend phải short-circuit TRƯỚC mọi DB insert. Bất kỳ: C2 > C1 (insert trùng khi resend), `jobId` mới khi resend, hoặc state idempotency nằm trong map in-memory (mất khi restart) → FAIL (critical → toàn bài challenge bằng 0 điểm).
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Idempotency được ép qua Redis (restart-safe) nên cùng một key không bao giờ insert hai lần — kiểm bằng cách đọc code + diff số dòng.** Ánh xạ `Idempotency-Key → result` phải lưu trong Redis với check-and-set nguyên tử (`StringSet(..., When.NotExists)` = `SET NX EX`), KHÔNG phải trong `ConcurrentDictionary` của process. Tiêm test: import file ≥200 dòng với `Idempotency-Key: imp-001`, chờ `done`, ghi `GET /users` count C1; gửi LẠI đúng key + file đó, chờ, ghi count C2 — C2 phải bằng C1 (không dòng mới) và response lần 2 phải mang CÙNG `jobId` với lần 1. Grep code: store idempotency phải là lời gọi `StackExchange.Redis`/`IDistributedCache` (Redis), không phải collection in-memory; và nhánh resend phải short-circuit TRƯỚC mọi DB insert. Bất kỳ: C2 > C1 (insert trùng khi resend), `jobId` mới khi resend, hoặc state idempotency nằm trong dictionary in-memory (mất khi restart) → FAIL (critical → toàn bài challenge bằng 0 điểm).
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Idempotency được ép qua Redis (restart-safe) nên cùng một key không bao giờ insert hai lần — kiểm bằng cách đọc code + diff số dòng.** Ánh xạ `Idempotency-Key → result` phải lưu trong Redis với check-and-set nguyên tử (`SetNX` = `SET NX EX`), KHÔNG phải trong `map` được bảo vệ bằng mutex của process. Tiêm test: import file ≥200 dòng với `Idempotency-Key: imp-001`, chờ `done`, ghi `GET /users` count C1; gửi LẠI đúng key + file đó, chờ, ghi count C2 — C2 phải bằng C1 (không dòng mới) và response lần 2 phải mang CÙNG `jobId` với lần 1. Grep code: store idempotency phải là lời gọi `go-redis`, không phải map in-memory; và nhánh resend phải short-circuit TRƯỚC mọi DB insert. Bất kỳ: C2 > C1 (insert trùng khi resend), `jobId` mới khi resend, hoặc state idempotency nằm trong map in-memory (mất khi restart) → FAIL (critical → toàn bài challenge bằng 0 điểm).
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
**File lớn được stream theo chunk (không nạp cả file) và contract async/poll + bằng chứng đầy đủ (kiểm bằng cách đọc code + README).** CSV phải được đọc bằng parser streaming và insert theo chunk có giới hạn (vd 500 dòng) — KHÔNG được có `fs.readFileSync` + materialize toàn bộ rows thành `JSON`/mảng trong RAM trước khi insert, và `processed` phải tăng theo từng chunk (quan sát được khi poll giữa chừng). Tầng HTTP chỉ routing; queue/worker sở hữu việc xử lý. README có đủ 6 mục (Challenge description, How to run, Architecture/Stack, Smoke Test, Code Execution Trace, Design Decisions) và dán response `202`, snapshot poll, và 2 lần đếm `GET /users` THẬT. Đọc cả file vào RAM một lần, `processed` nhảy thẳng từ 0 lên total, hoặc bằng chứng bịa → FAIL.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**File lớn được stream theo chunk (không nạp cả file) và contract async/poll + bằng chứng đầy đủ (kiểm bằng cách đọc code + README).** CSV phải được đọc bằng parser streaming/iterator và insert theo chunk có giới hạn (vd 500 dòng với `saveAll` + flush/clear) — KHÔNG được đọc toàn bộ rows vào một `List` trước khi insert, và `processed` phải tăng theo từng chunk (quan sát được khi poll giữa chừng). Tầng HTTP chỉ routing; worker `@Async` sở hữu việc xử lý. README có đủ 6 mục và dán response `202`, snapshot poll, và 2 lần đếm `GET /users` THẬT. Đọc cả file vào RAM một lần, `processed` nhảy thẳng từ 0 lên total, hoặc bằng chứng bịa → FAIL.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**File lớn được stream theo chunk (không nạp cả file) và contract async/poll + bằng chứng đầy đủ (kiểm bằng cách đọc code + README).** CSV phải được đọc bằng `GetRecords` lazy của `CsvHelper` và insert theo chunk có giới hạn (vd 500 dòng với `AddRange` + `SaveChanges`) — KHÔNG được `ToList()` toàn bộ records trước khi insert, và `processed` phải tăng theo từng chunk (quan sát được khi poll giữa chừng). Tầng HTTP chỉ routing; `BackgroundService` sở hữu việc xử lý. README có đủ 6 mục và dán response `202`, snapshot poll, và 2 lần đếm `GET /users` THẬT. Đọc cả file vào RAM một lần, `processed` nhảy thẳng từ 0 lên total, hoặc bằng chứng bịa → FAIL.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**File lớn được stream theo chunk (không nạp cả file) và contract async/poll + bằng chứng đầy đủ (kiểm bằng cách đọc code + README).** CSV phải được đọc bằng `csv.Reader.Read()` từng dòng và insert theo chunk có giới hạn (vd 500 dòng với `CreateInBatches`) — KHÔNG được `csv.ReadAll()` materialize mọi dòng trước khi insert, và `processed` phải tăng theo từng chunk (quan sát được khi poll giữa chừng). Tầng HTTP chỉ routing; worker goroutine sở hữu việc xử lý. README có đủ 6 mục và dán response `202`, snapshot poll, và 2 lần đếm `GET /users` THẬT. Đọc cả file vào RAM một lần, `processed` nhảy thẳng từ 0 lên total, hoặc bằng chứng bịa → FAIL.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
30
<!-- @starci/seperator -->
### critical
<!-- @starci/seperator -->
false
<!-- @starci/seperator -->
