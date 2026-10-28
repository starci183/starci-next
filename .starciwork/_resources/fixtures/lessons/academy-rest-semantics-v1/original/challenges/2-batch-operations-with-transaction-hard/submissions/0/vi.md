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
Một repo public chứa code (bằng ngôn ngữ bạn chọn) + README 6 mục mà phần Smoke Test chứng minh lô đã rollback (số dòng không đổi) và SQL log thể hiện BEGIN → INSERT → ROLLBACK.
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
**Một lô hoàn toàn hợp lệ được tạo và trả về đúng shape.** `POST /users/batch` với N user phân biệt, hợp lệ phải trả về HTTP `201` và body `{ created: N, failed: [] }`. Một lần `GET /users` sau đó phải có đúng N dòng nhiều hơn trước. Trả về `created` sai, `failed` không rỗng với lô hợp lệ, hoặc ít hơn N dòng được lưu → FAIL.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Một lô hoàn toàn hợp lệ được tạo và trả về đúng shape.** `POST /users/batch` với N user phân biệt, hợp lệ phải trả về HTTP `201` và body `{ created: N, failed: [] }`. Một lần `GET /users` sau đó phải có đúng N dòng nhiều hơn trước. Trả về `created` sai, `failed` không rỗng với lô hợp lệ, hoặc ít hơn N dòng được lưu → FAIL.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Một lô hoàn toàn hợp lệ được tạo và trả về đúng shape.** `POST /users/batch` với N user phân biệt, hợp lệ phải trả về HTTP `201` và body `{ created: N, failed: [] }`. Một lần `GET /users` sau đó phải có đúng N dòng nhiều hơn trước. Trả về `created` sai, `failed` không rỗng với lô hợp lệ, hoặc ít hơn N dòng được lưu → FAIL.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Một lô hoàn toàn hợp lệ được tạo và trả về đúng shape.** `POST /users/batch` với N user phân biệt, hợp lệ phải trả về HTTP `201` và body `{ created: N, failed: [] }`. Một lần `GET /users` sau đó phải có đúng N dòng nhiều hơn trước. Trả về `created` sai, `failed` không rỗng với lô hợp lệ, hoặc ít hơn N dòng được lưu → FAIL.
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
**Record fail được báo cáo kèm index và lý do.** Khi một lô chứa record email trùng (hoặc không hợp lệ), body response phải có `failed: [{ index, reason }]` với `index` là vị trí chính xác của record lỗi trong mảng gửi lên và `reason` là nguyên nhân con người đọc được (vd "duplicate email"). Một response báo sai index, thiếu reason, hoặc trả `500` chung chung không có chi tiết từng record → FAIL.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Record fail được báo cáo kèm index và lý do.** Khi một lô chứa record email trùng (hoặc không hợp lệ), body response phải có `failed: [{ index, reason }]` với `index` là vị trí chính xác của record lỗi trong list gửi lên và `reason` là nguyên nhân con người đọc được (vd "duplicate email"). Một response báo sai index, thiếu reason, hoặc trả `500` chung chung không có chi tiết từng record → FAIL.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Record fail được báo cáo kèm index và lý do.** Khi một lô chứa record email trùng (hoặc không hợp lệ), body response phải có `failed: [{ index, reason }]` với `index` là vị trí chính xác của record lỗi trong mảng gửi lên và `reason` là nguyên nhân con người đọc được (vd "duplicate email"). Một response báo sai index, thiếu reason, hoặc trả `500` chung chung không có chi tiết từng record → FAIL.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Record fail được báo cáo kèm index và lý do.** Khi một lô chứa record email trùng (hoặc không hợp lệ), body response phải có `failed: [{ index, reason }]` với `index` là vị trí chính xác của record lỗi trong slice gửi lên và `reason` là nguyên nhân con người đọc được (vd "duplicate email"). Một response báo sai index, thiếu reason, hoặc trả `500` chung chung không có chi tiết từng record → FAIL.
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
**Cả lô được bọc trong một database transaction THẬT — fail thì rollback toàn bộ, không partial write và không compensate thủ công (kiểm bằng cách đọc code + SQL log).** Bài nộp phải mở MỘT transaction (`dataSource.createQueryRunner()` → `startTransaction()`), insert tất cả record bên trong nó, và `commitTransaction()` chỉ một lần ở cuối; khi có lỗi phải `rollbackTransaction()`. Tiêm lỗi: một lô mà record index 1 trùng email với record index 0. Sau lần gọi đó, `GET /users` (hoặc `COUNT(*)`) phải cho thấy KHÔNG có dòng mới — record 0 KHÔNG được tồn tại. SQL log phải thể hiện `START TRANSACTION` → các `INSERT` → `ROLLBACK` (không phải `COMMIT`). Grep code: KHÔNG được có pattern "insert từng dòng trong commit riêng rồi DELETE/compensate các dòng đã insert" — đó là giả lập atomicity thay vì dùng transaction boundary. Bất kỳ trường hợp nào: record 0 sống sót sau lô lỗi, commit từng dòng + dọn dẹp thủ công, hoặc thiếu `ROLLBACK` trong log → FAIL (critical → toàn bài challenge bằng 0 điểm).
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Cả lô được bọc trong một database transaction THẬT — fail thì rollback toàn bộ, không partial write và không compensate thủ công (kiểm bằng cách đọc code + SQL log).** Insert lô phải chạy bên trong một method service `@Transactional` duy nhất; exception của insert vi phạm phải lan ra để Spring rollback toàn bộ transaction. Tiêm lỗi: một lô mà record index 1 trùng email với record index 0. Sau lần gọi đó, `GET /users` (hoặc `COUNT(*)`) phải cho thấy KHÔNG có dòng mới — record 0 KHÔNG được tồn tại. SQL log phải thể hiện các `INSERT` rồi rollback (không `COMMIT`). Grep code: KHÔNG được có pattern "save từng dòng rồi DELETE/compensate các dòng đã save", và không được nuốt exception bên trong `@Transactional` (sẽ commit lặng lẽ). Bất kỳ: record 0 sống sót sau lô lỗi, commit từng dòng + dọn dẹp thủ công, hoặc exception bị nuốt khiến transaction commit → FAIL (critical → toàn bài challenge bằng 0 điểm).
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Cả lô được bọc trong một database transaction THẬT — fail thì rollback toàn bộ, không partial write và không compensate thủ công (kiểm bằng cách đọc code + SQL log).** Insert lô phải chạy bên trong MỘT scope `BeginTransactionAsync()`, `CommitAsync()` chỉ ở cuối, và rollback (tường minh hoặc qua dispose) khi có lỗi. Tiêm lỗi: một lô mà record index 1 trùng email với record index 0. Sau lần gọi đó, `GET /users` (hoặc `COUNT(*)`) phải cho thấy KHÔNG có dòng mới — record 0 KHÔNG được tồn tại. SQL log phải thể hiện `BEGIN TRANSACTION` → các `INSERT` → `ROLLBACK` (không phải `COMMIT`). Grep code: KHÔNG được có pattern "SaveChanges từng dòng trong các transaction riêng rồi delete/compensate". Bất kỳ: record 0 sống sót sau lô lỗi, commit từng dòng + dọn dẹp thủ công, hoặc thiếu `ROLLBACK` trong log → FAIL (critical → toàn bài challenge bằng 0 điểm).
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Cả lô được bọc trong một database transaction THẬT — fail thì rollback toàn bộ, không partial write và không compensate thủ công (kiểm bằng cách đọc code + SQL log).** Insert lô phải chạy bên trong `db.Transaction(func(tx *gorm.DB) error { ... })` (hoặc `Begin/Commit/Rollback` tường minh); trả về error từ closure phải kích hoạt GORM tự `ROLLBACK`. Tiêm lỗi: một lô mà record index 1 trùng email với record index 0. Sau lần gọi đó, `GET /users` (hoặc `COUNT(*)`) phải cho thấy KHÔNG có dòng mới — record 0 KHÔNG được tồn tại. GORM log phải thể hiện `BEGIN` → các `INSERT` → `ROLLBACK` (không phải `COMMIT`). Grep code: KHÔNG được có pattern "`db.Create` từng dòng ngoài transaction rồi `db.Delete`/compensate". Bất kỳ: record 0 sống sót sau lô lỗi, create từng dòng + dọn dẹp thủ công, hoặc thiếu `ROLLBACK` trong log → FAIL (critical → toàn bài challenge bằng 0 điểm).
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
**Phát hiện trùng được ép bởi ràng buộc UNIQUE ở tầng database, không phải pre-check in-memory, và tách controller/service + bằng chứng đầy đủ (kiểm bằng cách đọc code + README).** Cột `email` phải mang một ràng buộc/index `UNIQUE` thật trong schema (migration hoặc entity metadata) — record trùng phải bị bắt do DB ném vi phạm, KHÔNG phải do một `Set`/`Array.some` JavaScript quét trước khi insert. Controller chỉ routing; QueryRunner/transaction nằm trong service. README có đủ 6 mục (Challenge description, How to run, Architecture/Stack, Smoke Test, Code Execution Trace, Design Decisions) và dán response + SQL log THẬT. Bắt trùng thuần in-memory (không có DB unique index), controller sở hữu transaction, hoặc log bịa → FAIL.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Phát hiện trùng được ép bởi ràng buộc UNIQUE ở tầng database, không phải pre-check in-memory, và tách controller/service + bằng chứng đầy đủ (kiểm bằng cách đọc code + README).** Cột `email` phải mang một ràng buộc/index `UNIQUE` thật trong schema (`@Column(unique = true)` phản ánh vào DDL) — record trùng phải nổi lên dưới dạng `DataIntegrityViolationException` từ DB, KHÔNG phải từ một `Stream`/`Set` quét trước khi save. Controller chỉ routing; insert `@Transactional` nằm trong service. README có đủ 6 mục và dán response + SQL log THẬT. Bắt trùng thuần in-memory (không có DB unique index), controller sở hữu transaction, hoặc log bịa → FAIL.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Phát hiện trùng được ép bởi ràng buộc UNIQUE ở tầng database, không phải pre-check in-memory, và tách handler/service + bằng chứng đầy đủ (kiểm bằng cách đọc code + README).** Cột `Email` phải mang một unique index thật (`HasIndex(...).IsUnique()` phản ánh vào migration) — record trùng phải nổi lên dưới dạng `DbUpdateException` từ DB, KHÔNG phải từ một quét LINQ/`HashSet` trước khi `SaveChanges`. Endpoint chỉ routing; transaction nằm trong service. README có đủ 6 mục và dán response + SQL log THẬT. Bắt trùng thuần in-memory (không có DB unique index), endpoint sở hữu transaction, hoặc log bịa → FAIL.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Phát hiện trùng được ép bởi ràng buộc UNIQUE ở tầng database, không phải pre-check in-memory, và tách handler/service + bằng chứng đầy đủ (kiểm bằng cách đọc code + README).** Cột `email` phải mang một `uniqueIndex` thật (`gorm:"uniqueIndex"` phản ánh vào schema đã migrate) — record trùng phải nổi lên dưới dạng error từ `tx.Create`, KHÔNG phải từ một `map[string]bool` quét trước khi insert. Handler chỉ routing; `db.Transaction` nằm trong service. README có đủ 6 mục và dán response + SQL log THẬT. Bắt trùng thuần in-memory (không có DB unique index), handler sở hữu transaction, hoặc log bịa → FAIL.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
30
<!-- @starci/seperator -->
### critical
<!-- @starci/seperator -->
false
<!-- @starci/seperator -->
