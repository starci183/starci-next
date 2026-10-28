# type
<!-- @starci/seperator -->
githubUrl
<!-- @starci/seperator -->
# title
<!-- @starci/seperator -->
Link GitHub Repository
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
Repo public chứa code (ngôn ngữ bạn chọn) + README 6 mục với Smoke Test output thật, chứng minh pagination, filter và search chạy trên một dataset đã được nạp dữ liệu.
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
**Kiểm cái gì.** Shape của envelope và phép toán pagination của `GET /users`. **Bằng chứng quan sát được.** `GET /users?page=1&limit=10` trả về HTTP `200` với đúng shape `{ data: User[], meta: { total, page, limit, totalPages } }` — không thừa, không thiếu field. Với `total` đã seed là `N`, `meta.totalPages` phải bằng `ceil(N / limit)`, `meta.page`/`meta.limit` lặp lại request, và `data.length <= limit`. `GET /users?page=2&limit=10` trả về cửa sổ thứ hai (item 11-20, rời nhau với trang 1). **Fail nếu:** sai HTTP code, sai shape, `totalPages != ceil(total/limit)`, hoặc trang 2 trả về cùng các hàng như trang 1.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Kiểm cái gì.** Shape của envelope và phép toán pagination của `GET /users`. **Bằng chứng quan sát được.** `GET /users?page=1&limit=10` trả về HTTP `200` với đúng shape `{ data: User[], meta: { total, page, limit, totalPages } }` — không thừa, không thiếu field. Với `total` đã seed là `N`, `meta.totalPages` phải bằng `ceil(N / limit)`, `meta.page`/`meta.limit` lặp lại request, và `data.length <= limit`. `GET /users?page=2&limit=10` trả về cửa sổ thứ hai (item 11-20, rời nhau với trang 1). **Fail nếu:** sai HTTP code, sai shape, `totalPages != ceil(total/limit)`, hoặc trang 2 trả về cùng các hàng như trang 1.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Kiểm cái gì.** Shape của envelope và phép toán pagination của `GET /users`. **Bằng chứng quan sát được.** `GET /users?page=1&limit=10` trả về HTTP `200` với đúng shape `{ data: User[], meta: { total, page, limit, totalPages } }` — không thừa, không thiếu field. Với `total` đã seed là `N`, `meta.totalPages` phải bằng `ceil(N / limit)`, `meta.page`/`meta.limit` lặp lại request, và `data.length <= limit`. `GET /users?page=2&limit=10` trả về cửa sổ thứ hai (item 11-20, rời nhau với trang 1). **Fail nếu:** sai HTTP code, sai shape, `totalPages != ceil(total/limit)`, hoặc trang 2 trả về cùng các hàng như trang 1.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Kiểm cái gì.** Shape của envelope và phép toán pagination của `GET /users`. **Bằng chứng quan sát được.** `GET /users?page=1&limit=10` trả về HTTP `200` với đúng shape `{ data: User[], meta: { total, page, limit, totalPages } }` — không thừa, không thiếu field. Với `total` đã seed là `N`, `meta.totalPages` phải bằng `ceil(N / limit)`, `meta.page`/`meta.limit` lặp lại request, và `data.length <= limit`. `GET /users?page=2&limit=10` trả về cửa sổ thứ hai (item 11-20, rời nhau với trang 1). **Fail nếu:** sai HTTP code, sai shape, `totalPages != ceil(total/limit)`, hoặc trang 2 trả về cùng các hàng như trang 1.
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
**Kiểm cái gì.** Rằng `meta.total` phản ánh tập kết quả đã filter/search, không phải toàn bảng. **Bằng chứng quan sát được.** Seed một hỗn hợp đã biết (ví dụ 30 `active`, 20 `inactive`). `GET /users?status=active` chỉ trả về các hàng `active` VÀ `meta.total === 30` (số đã filter, không phải 50); phân trang tập đã filter đó cho ra `ceil(30/limit)` trang. `GET /users?search=<word>` chỉ trả về các hàng có `name` chứa từ đó không phân biệt hoa thường, với `meta.total` bằng số match thật trong DB. **Fail nếu:** `meta.total` báo số toàn bảng chưa filter trong khi `data` đã được filter (lệch count/data kinh điển), filter rò rỉ hàng không khớp, hoặc search phân biệt hoa thường khi đáng ra không nên.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Kiểm cái gì.** Rằng `meta.total` phản ánh tập kết quả đã filter/search, không phải toàn bảng. **Bằng chứng quan sát được.** Seed một hỗn hợp đã biết (ví dụ 30 `active`, 20 `inactive`). `GET /users?status=active` chỉ trả về các hàng `active` VÀ `meta.total === 30` (số đã filter, không phải 50); phân trang tập đã filter đó cho ra `ceil(30/limit)` trang. `GET /users?search=<word>` chỉ trả về các hàng có `name` chứa từ đó không phân biệt hoa thường, với `meta.total` bằng số match thật trong DB. **Fail nếu:** `meta.total` báo số toàn bảng chưa filter trong khi `data` đã được filter (lệch count/data kinh điển), filter rò rỉ hàng không khớp, hoặc search phân biệt hoa thường khi đáng ra không nên.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Kiểm cái gì.** Rằng `meta.total` phản ánh tập kết quả đã filter/search, không phải toàn bảng. **Bằng chứng quan sát được.** Seed một hỗn hợp đã biết (ví dụ 30 `active`, 20 `inactive`). `GET /users?status=active` chỉ trả về các hàng `active` VÀ `meta.total === 30` (số đã filter, không phải 50); phân trang tập đã filter đó cho ra `ceil(30/limit)` trang. `GET /users?search=<word>` chỉ trả về các hàng có `name` chứa từ đó không phân biệt hoa thường, với `meta.total` bằng số match thật trong DB. **Fail nếu:** `meta.total` báo số toàn bảng chưa filter trong khi `data` đã được filter (lệch count/data kinh điển), filter rò rỉ hàng không khớp, hoặc search phân biệt hoa thường khi đáng ra không nên.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Kiểm cái gì.** Rằng `meta.total` phản ánh tập kết quả đã filter/search, không phải toàn bảng. **Bằng chứng quan sát được.** Seed một hỗn hợp đã biết (ví dụ 30 `active`, 20 `inactive`). `GET /users?status=active` chỉ trả về các hàng `active` VÀ `meta.total === 30` (số đã filter, không phải 50); phân trang tập đã filter đó cho ra `ceil(30/limit)` trang. `GET /users?search=<word>` chỉ trả về các hàng có `name` chứa từ đó không phân biệt hoa thường, với `meta.total` bằng số match thật trong DB. **Fail nếu:** `meta.total` báo số toàn bảng chưa filter trong khi `data` đã được filter (lệch count/data kinh điển), filter rò rỉ hàng không khớp, hoặc search phân biệt hoa thường khi đáng ra không nên.
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
**Kiểm cái gì.** Rằng filter và search thực thi ở tầng query, không phải trong bộ nhớ ứng dụng (kiểm bằng cách đọc code + SQL log). **Bằng chứng quan sát được.** `UsersService.findAll` build một `createQueryBuilder` duy nhất với `.andWhere('user.status = :status', ...)` và `.andWhere('user.name ILIKE :search', ...)` có điều kiện, chỉ thêm khi param hiện diện, theo sau là `.skip().take().getManyAndCount()`. Mục Smoke Test trong README dán TypeORM query log thể hiện mệnh đề `WHERE ... ILIKE ...` chạm tới DB. Grep repo: KHÔNG có `repo.find()` / `getMany()` toàn bộ hàng rồi `.filter()`/`.slice()` trong bộ nhớ. **Fail nếu:** service fetch hết rồi filter/paginate trong JS, mệnh đề `WHERE`/`ILIKE` vắng mặt trong SQL log, hoặc sinh ra một `WHERE status = NULL` literal vì mệnh đề không được làm có điều kiện → FAIL (critical → toàn bài challenge bằng 0 điểm).
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Kiểm cái gì.** Rằng filter và search thực thi ở tầng query, không phải trong bộ nhớ ứng dụng (kiểm bằng cách đọc code + SQL log). **Bằng chứng quan sát được.** Service build một `Specification<User>` thêm `cb.equal(root.get("status"), ...)` và `cb.like(cb.lower(root.get("name")), ...)` chỉ khi param hiện diện, rồi gọi `repo.findAll(spec, PageRequest.of(page-1, limit))`. Mục Smoke Test trong README dán Hibernate `show-sql` log thể hiện mệnh đề `where ... lower(...) like ...` chạm tới DB. Grep repo: KHÔNG có `findAll()` toàn bộ hàng rồi Java-stream `.filter()`. **Fail nếu:** service load hết rồi filter/paginate trong Java, mệnh đề `where`/`like` vắng mặt trong SQL log, hoặc một predicate được thêm vô điều kiện cho một param rỗng → FAIL (critical → toàn bài challenge bằng 0 điểm).
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Kiểm cái gì.** Rằng filter và search thực thi ở tầng query, không phải trong bộ nhớ ứng dụng (kiểm bằng cách đọc code + SQL log). **Bằng chứng quan sát được.** Service nối `IQueryable.Where(u => u.Status == ...)` và `Where(u => EF.Functions.ILike(u.Name, ...))` chỉ khi param hiện diện, rồi `CountAsync()` + `Skip().Take().ToListAsync()` trên cùng một deferred query. Mục Smoke Test trong README dán EF Core command log thể hiện mệnh đề `WHERE ... ILIKE ...` chạm tới DB. Grep repo: KHÔNG có `ToListAsync()` toàn bộ hàng rồi LINQ-to-objects `.Where()`/`.Skip()`. **Fail nếu:** service materialize hết rồi filter/paginate trong bộ nhớ, mệnh đề `WHERE`/`ILIKE` vắng mặt trong SQL log, hoặc một `Where` được thêm vô điều kiện cho một param rỗng → FAIL (critical → toàn bài challenge bằng 0 điểm).
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Kiểm cái gì.** Rằng filter và search thực thi ở tầng query, không phải trong bộ nhớ ứng dụng (kiểm bằng cách đọc code + SQL log). **Bằng chứng quan sát được.** Repository gán lại một chuỗi GORM query `tx = tx.Where("status = ?", ...)` và `tx = tx.Where("name ILIKE ?", ...)` chỉ khi param không rỗng, rồi `Count(&total)` và `Limit().Offset().Find(&data)` (với một session đã clone cho lần count). Mục Smoke Test trong README dán GORM SQL log thể hiện mệnh đề `WHERE ... ILIKE ...` chạm tới DB. Grep repo: KHÔNG có `Find(&all)` toàn bộ hàng rồi filter ở mức slice. **Fail nếu:** repo load hết rồi filter/paginate trong Go, mệnh đề `WHERE`/`ILIKE` vắng mặt trong SQL log, hoặc một `Where` được thêm vô điều kiện cho một param rỗng → FAIL (critical → toàn bài challenge bằng 0 điểm).
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
**Kiểm cái gì.** Rằng query param được validate qua một DTO có kiểu với default và bound đúng (bằng chứng validation, không chỉ happy-path). **Bằng chứng quan sát được.** Một `QueryUsersDto` khai báo `page`/`limit` với `@Type(() => Number) @IsInt() @Min(1)` và `@Max(50)` trên `limit`, cộng `@IsOptional() @IsIn(['active','inactive'])` trên `status`; `ValidationPipe({ transform: true })` được bật. `GET /users?limit=999` và `GET /users?page=0` trả về HTTP `400`; `GET /users` không param áp dụng `page=1`, `limit=10`. Mục Smoke Test trong README dán response `400` thô cho `limit=999`. **Fail nếu:** `limit`/`page` ngoài range trả về `200` thay vì `400`, default bị hardcode trong controller thay vì validate qua DTO, hoặc query string bị đọc như `string` thô mà không cast số.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Kiểm cái gì.** Rằng query param được validate qua một DTO có kiểu với default và bound đúng (bằng chứng validation, không chỉ happy-path). **Bằng chứng quan sát được.** Một `QueryUsersDto` khai báo `int page = 1` với `@Min(1)` và `int limit = 10` với `@Min(1) @Max(50)`, với `status` giới hạn trong tập cho phép; controller là `@Validated` và tham số `@Valid`. `GET /users?limit=999` và `GET /users?page=0` trả về HTTP `400`; `GET /users` không param áp dụng `page=1`, `limit=10`. Mục Smoke Test trong README dán response `400` thô cho `limit=999`. **Fail nếu:** `limit`/`page` ngoài range trả về `200` thay vì `400`, default bị hardcode trong controller thay vì DTO, hoặc thiếu constraint nên input không hợp lệ lọt qua.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Kiểm cái gì.** Rằng query param được validate qua một DTO có kiểu với default và bound đúng (bằng chứng validation, không chỉ happy-path). **Bằng chứng quan sát được.** Một `QueryUsersDto` khai báo `[Range(1, int.MaxValue)] int Page = 1` và `[Range(1, 50)] int Limit = 10`, với `Status` giới hạn trong tập cho phép; `[ApiController]` tự động validate `ModelState`. `GET /users?limit=999` và `GET /users?page=0` trả về HTTP `400`; `GET /users` không param áp dụng `Page=1`, `Limit=10`. Mục Smoke Test trong README dán response `400` thô cho `limit=999`. **Fail nếu:** `limit`/`page` ngoài range trả về `200` thay vì `400`, default bị hardcode trong controller thay vì DTO, hoặc thiếu kiểm `[Range]`/`ModelState` nên input không hợp lệ lọt qua.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Kiểm cái gì.** Rằng query param được validate qua một DTO có kiểu với default và bound đúng (bằng chứng validation, không chỉ happy-path). **Bằng chứng quan sát được.** Một struct `QueryUsersDto` khai báo `Page int form:"page,default=1" binding:"min=1"` và `Limit int form:"limit,default=10" binding:"min=1,max=50"`, với `Status` `binding:"omitempty,oneof=active inactive"`; handler gọi `c.ShouldBindQuery(&dto)` và trả về `400` khi lỗi. `GET /users?limit=999` và `GET /users?page=0` trả về HTTP `400`; `GET /users` không param áp dụng `page=1`, `limit=10`. Mục Smoke Test trong README dán response `400` thô cho `limit=999`. **Fail nếu:** `limit`/`page` ngoài range trả về `200` thay vì `400`, default bị hardcode trong handler thay vì binding tag, hoặc lỗi bind bị bỏ qua nên input không hợp lệ lọt qua.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
30
<!-- @starci/seperator -->
### critical
<!-- @starci/seperator -->
false
<!-- @starci/seperator -->
