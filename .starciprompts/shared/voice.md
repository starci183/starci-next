# Voice: viết như dev Việt viết blog

How every Vietnamese sentence of StarCi Next reads (and NIVO's, which links here): openings, address, which terms stay English,
sentence shape, structure, tone. It narrows [vietnamese.md](vietnamese.md) and runs before its four skill passes. Structure and numbers
stay with each part's `rules.md` and [numbers.md](numbers.md); this file never overrides them.

Two rules are the owner's own words and carry no mark:

- "viết tự nhiên như blog ấy"
- "trò viết không giống tiếng Việt" (his verdict on the old lesson prose: right ideas, read as a translation)

Everything else here is **(đề xuất)**: inferred from 50 Viblo posts read on 2026-11-24 (44 newest, 6 editors' choice), listed with a
note each in [../sources/viblo-samples.md](../sources/viblo-samples.md). Each numbered section below carries the mark; when the owner
confirms or rejects a section, change it there.

Trích dẫn chỉ là cụm ngắn, mỗi bài nhiều nhất một cụm, số (#3) trỏ về danh sách bài. Câu "Trước / Sau" ở mục 7 là câu tự viết.

---

## 0. Dùng file này thế nào **(đề xuất)**

**Thứ tự ưu tiên.** Luật harness trước, rồi concept của app, rồi luật riêng của từng phần bài học (`essentials/*/rules.md`), rồi tới
file này. File này chỉ nói giọng văn: câu, từ, nhịp, cách mở và đóng. Nó không đổi cấu trúc năm phần, không đổi luật về số liệu.

**Hai độc giả, hai mức thuật ngữ.**

| App         | Người đọc                      | Thuật ngữ kỹ thuật                                                  | Xưng hô                                       |
| ----------- | ------------------------------ | ------------------------------------------------------------------- | --------------------------------------------- |
| StarCi Next | developer Việt, junior đến mid | Giữ tiếng Anh như dev nói hằng ngày (mục 3), giải nghĩa lần đầu     | "bạn"; "mình" khi kể chuyện của người viết    |
| NIVO        | chủ shop và nhân viên          | Không có. Nói bằng chuyện của shop: đơn, khách, tin nhắn, doanh thu | "bạn" với chủ shop; "anh/chị + tên" với khách |

Với NIVO, phần code-switching ở mục 3 gần như không dùng: chủ shop không đọc "webhook" hay "token". Phần còn lại (câu ngắn, chủ động,
không danh hóa, mở bằng chuyện thật, không văn mẫu) áp dụng y hệt.

**Cách dùng nhanh:** viết nháp, đọc to một đoạn, rồi chạy checklist ở mục 8. Câu nào đọc to thấy vấp là câu cần sửa.

---

## 1. Mở bài: ba dòng đầu quyết định người ta đọc tiếp hay không **(đề xuất)**

Bài hay trên Viblo không mở bằng định nghĩa. Họ mở bằng một thứ người đọc nhận ra ngay: một dòng lỗi, một con số, một câu sếp hay nói,
một cảnh quen. Định nghĩa đến sau, khi người đọc đã muốn biết.

### 1.1 Sáu kiểu mở hay gặp

**a. Triệu chứng người đọc từng gặp.** Câu đầu gọi đúng trải nghiệm, câu sau là dòng lỗi thật.

- Bài port 3000 (#1) mở bằng "Chắc ai làm web cũng từng gặp cảnh này", rồi dán nguyên dòng `EADDRINUSE`.
- Bài Chrome DevTools MCP (#6) tả một cảnh: bấm Lưu, form đứng im, agent đoán ba nguyên nhân, sửa một chỗ, vẫn hỏng.

Cách viết: một câu "ai cũng từng", rồi ngay lập tức một thứ cụ thể (dòng lỗi, màn hình, thao tác). Câu "ai cũng từng" đứng một mình
là câu sáo; nó chỉ sống khi câu sau cụ thể.

**b. Con số đặt lên đầu.** Series chi phí AWS gần như bài nào cũng mở bằng số.

- "Một đêm, $390" (#3) rồi mới kể vòng lặp Lambda.
- Bài phí IPv4 (#39): hai câu cực ngắn, câu hai là "Con số nhỏ đến mức không ai để ý", rồi phép nhân ra hơn nghìn đô.
- Bài Step Functions (#37): từ $250 xuống $3 "chỉ bằng cách đổi một chữ".

Cách viết: con số trước, giải thích sau. Số phải đến từ dữ liệu thật của bài (với StarCi Next là `scenarios.yaml`).

**c. Câu nói quen trong team.** Trích một câu ai cũng từng nghe ở công ty, rồi cho thấy cái giá của nó.

- Bài database ở public subnet (#38) mở bằng câu kiểu "cho dễ, dev ở nhà cũng connect được".
- Bài NOT IN (#2) mở từ một góp ý lúc review, rồi "Mình đo thử".

**d. Đề bài trông dễ.** Hợp với bài thuật toán, phỏng vấn.

- "Đề bài nghe rất hiền" (#10), rồi chỉ ra chỗ cách viết "đúng" chậm đi hàng trăm lần.
- Bài two pointers (#11) đặt bạn vào phòng phỏng vấn, người phỏng vấn hỏi tiếp "Làm nhanh hơn được không?".

**e. Câu hỏi ngây thơ, rồi lật lại.** "Máy tính biết file nào là ảnh bằng cách nào? Nhìn đuôi file thôi?" rồi hỏi tiếp: nếu file
không có đuôi thì sao (#22).

**f. Bối cảnh rất Việt.** Bài âm lịch (#33) liệt kê lịch giỗ, quà Rằm, khuyến mãi mùng Một, rồi nói thẳng cách làm tắt sẽ
"sai vào đúng những ngày người dùng quan tâm nhất". Bài Con Ngoan (#35) mở bằng lời phụ huynh nhờ "chặn game cho con".

### 1.2 Sau câu móc: nói luôn bài này làm gì

Câu thứ hai hoặc thứ ba nói phạm vi, bằng giọng người:

- "Bài này đi qua X, Y, và cái bẫy hay gặp." (kiểu series thuật toán)
- Nói cái bài **không** làm cũng tốt: bài nông trại 3D (#9) nói rõ "Tôi không kể chuyện mài nó thành sản phẩm".
- Có lợi ích riêng thì khai luôn: bài changelog (#34) nói người viết làm tool đó, "bạn cứ đọc với con mắt đó nhé".

### 1.3 Mở bài cần tránh

| Kiểu mở                                                            | Vì sao dở                                        |
| ------------------------------------------------------------------ | ------------------------------------------------ |
| "Hôm nay chúng ta sẽ cùng tìm hiểu về X" (#47)                     | Không nói gì, người đọc chưa có lý do ở lại      |
| "Về bản chất, X là..." rồi định nghĩa sách giáo khoa (#20)         | Trả lời câu hỏi chưa ai hỏi                      |
| "Trong thời đại công nghệ phát triển như vũ bão..."                | Văn mẫu, đọc là biết AI hoặc bài SEO             |
| "Chào mọi người trên Viblo" + danh sách tính năng (#49)            | Mùi quảng cáo ngay dòng đầu                      |
| Tiêu đề viết hoa toàn bộ hoặc Title Case kiểu tiếng Anh (#46, #21) | Tiếng Việt chỉ viết hoa chữ đầu câu và tên riêng |

**Áp vào StarCi Next.** Đoạn móc của phần Bản chất là "Senior/Mid hook" hai ba dòng: một cảnh trong đêm sự cố, một con số từ run thật.
Đoạn kể bối cảnh của câu hỏi Mở đầu cũng vậy: cảnh trước, cơ chế sau.

**Áp vào NIVO.** Câu mở của một màn hình hay một bài hướng dẫn là chuyện của shop: "Khách nhắn hỏi giá lúc 11 giờ đêm, sáng ra mới
thấy." Không phải "Tính năng trả lời tự động giúp tối ưu trải nghiệm khách hàng."

---

## 2. Giọng và xưng hô **(đề xuất)**

### 2.1 Ai nói với ai

Trên Viblo, xưng hô cho biết bài thuộc loại nào:

| Cách xưng         | Gặp ở đâu                                           | Dùng cho StarCi Next / NIVO                                        |
| ----------------- | --------------------------------------------------- | ------------------------------------------------------------------ |
| **mình / bạn**    | Đa số bài tự nhiên: tool write-up, debug, đo đạc    | Mặc định. "bạn" là người học; "mình" khi kể việc người viết đã làm |
| **tôi**           | Bài đo đạc nghiêm túc, giọng báo cáo (#4, #9)       | Hợp ghi chú kỹ thuật, ít hợp bài học                               |
| **anh em**        | Kết bài, bài system design kiểu cộng đồng (#1, #41) | Không dùng trong bài học và UI. Quá thân, loại trừ người đọc nữ    |
| **chúng ta**      | Bài giáo trình, thường đi với "sẽ cùng tìm hiểu"    | Tránh làm câu mở. Dùng được khi lập luận chung: "ta bỏ nửa trái"   |
| **ta** (lập luận) | Series thuật toán: "ta dừng luôn"                   | Tốt cho bước suy luận trong code, ngắn gọn                         |
| **các bạn**       | Bài cũ kiểu "Hello các bạn" (#40)                   | Không mở bài bằng nó. Lời kết thì được                             |

Quy tắc ngắn:

- Bài học: "bạn" xuyên suốt. Người học là người đang ngồi trước bug: "Bạn mở log ra, thấy..."
- "mình" chỉ khi kể việc người viết thật sự làm: "Mình chạy kịch bản này 3 lần." Không bịa "mình" đã làm khi không có run.
- NIVO: "bạn" với chủ shop. Khách là "anh Minh", "chị Hoa". Không "quý khách", không "người dùng".
- Một bài một kiểu xưng. Đừng nhảy "mình" sang "tôi" sang "chúng ta" trong ba đoạn.

### 2.2 Từ nối và chuyển ý của người nói

Bài tự nhiên dùng từ nối của văn nói, không dùng từ nối của văn bản hành chính.

| Văn nói, nên dùng         | Văn hành chính, tránh                  |
| ------------------------- | -------------------------------------- |
| Vấn đề là...              | Tuy nhiên, một vấn đề đáng lưu ý là... |
| Nghe thì hợp lý, nhưng... | Mặc dù điều này có vẻ hợp lý...        |
| Nói cho dễ hiểu (#24)     | Để hiểu rõ hơn về khái niệm này...     |
| Đó là toàn bộ ý tưởng.    | Như vậy, chúng ta đã tìm hiểu xong...  |
| Chỗ dễ sai nhất là...     | Một điểm cần đặc biệt lưu ý là...      |
| Lúc đó / Đến đây thì...   | Tại thời điểm này...                   |
| Thế còn X thì sao?        | Bên cạnh đó, X cũng là một yếu tố...   |
| Tóm lại: ...              | Tổng kết lại, có thể thấy rằng...      |
| Tức là... / Nghĩa là...   | Điều này có nghĩa là...                |
| Để ý chỗ này: ...         | Cần lưu ý rằng...                      |
| Đừng vội...               | Không nên vội vàng đưa ra kết luận...  |

Câu hỏi tu từ ngắn giữa bài giúp đổi nhịp. Bài CDC (#8) chỉ cần "Bộ phân bổ có lỗi ư? Chưa chắc." là người đọc tự đặt lại câu hỏi.
Mỗi mục một câu như vậy là đủ; câu nào cũng hỏi thì thành lên giọng.

### 2.3 Thật thà là một phần của giọng

Bài đáng tin hay nói rõ giới hạn của chính nó:

- Số nào là số minh họa, số nào là số đo (#30 ghi rõ số trong bài chỉ để minh họa cách đọc).
- Chạy trên phiên bản nào, máy nào, ngày nào (#24, #6).
- Người viết có lợi ích gì (#34, #35).
- Đã kiểm bằng gì: bài Base64 (#15) ghi một dòng cuối là đã kiểm bằng module của Python.

Với StarCi Next, chuyện này là luật: số chỉ lấy từ run thật, có ngày chạy.

---

## 3. Code-switching: từ nào giữ tiếng Anh, từ nào nói tiếng Việt **(đề xuất)**

Dev Việt nói "deploy lên staging", "cache bị miss", "mở pull request", không ai nói "triển khai lên môi trường dàn dựng". Bài tự nhiên
giữ đúng từ dev nói ở công ty. Bài dịch thì cố Việt hóa mọi thứ, hoặc ngược lại, chêm tiếng Anh viết hoa trong ngoặc sau mọi từ.

Nguyên tắc:

1. **Giữ tiếng Anh** khi dev Việt nói từ đó bằng tiếng Anh ở chỗ làm. Lần đầu giải nghĩa bằng một vế tiếng Việt ngắn, sau đó dùng trơn.
2. **Nói tiếng Việt** khi từ Việt đã quen trong trường và trong team (hàm, mảng, vòng lặp, bảng, khóa chính).
3. **Cả hai được** khi team nào cũng có người nói kiểu này, người nói kiểu kia. Chọn một, dùng nhất quán trong một bài.
4. Từ tiếng Anh viết thường, như danh từ chung trong câu Việt: "một transaction", "ba request". Không viết hoa kiểu "(Transaction)".
5. Không thêm "s" số nhiều: "ba request", không "ba requests".
6. Ngoặc giải nghĩa chỉ một lần mỗi bài, cho từ người học có thể chưa biết. Không ngoặc cho từ ai cũng biết (API, bug, log).
7. Tên riêng, lệnh, tên hàm, tên bảng để trong `code`, không dịch.

### 3.1 Bảng 84 thuật ngữ

**Giữ tiếng Anh (48)**

| Từ                   | Ví dụ câu tự nhiên                                           |
| -------------------- | ------------------------------------------------------------ |
| cache                | Giá vẫn nằm trong cache thêm 33 giây.                        |
| cache hit / miss     | Lần đọc này miss nên phải xuống database.                    |
| TTL                  | Đặt TTL 60 giây cho key giá.                                 |
| key                  | Hai request cùng ghi một key.                                |
| request / response   | API trả response sau 2 giây.                                 |
| endpoint             | Endpoint `/orders` chậm nhất.                                |
| API                  | Gọi API thanh toán.                                          |
| deploy               | Deploy xong thì service không lên.                           |
| build                | Build fail ở bước test.                                      |
| commit               | Sửa trong một commit riêng.                                  |
| branch               | Tạo branch từ `dev`.                                         |
| merge                | Merge xong mới thấy conflict.                                |
| pull request         | Mở pull request, nhờ người review.                           |
| review               | Lúc review, có người góp ý đổi sang EXISTS.                  |
| bug                  | Bug chỉ hiện khi hai request tới cùng lúc.                   |
| debug                | Debug bằng log thay vì đoán.                                 |
| log                  | Log in ra `timeout after 60s`.                               |
| query                | Query này quét cả bảng.                                      |
| index                | Thêm index cho `order_id`.                                   |
| transaction          | Gói hai lệnh vào một transaction.                            |
| rollback             | Lỗi giữa chừng thì rollback cả hai.                          |
| retry                | Client retry ba lần, mỗi lần cách 2 giây.                    |
| timeout              | Gọi sang ngân hàng bị timeout.                               |
| queue                | Đẩy job vào queue rồi trả lời khách ngay.                    |
| worker               | Ba worker cùng lấy một job.                                  |
| event                | Mỗi đơn đã trả tiền phát một event.                          |
| webhook              | Ngân hàng gọi webhook báo đã nhận tiền.                      |
| payload              | Payload lớn hơn giới hạn 6 MB.                               |
| token                | Token hết hạn sau 15 phút.                                   |
| session              | Session lưu trong Redis.                                     |
| middleware           | Kiểm tra quyền ở middleware.                                 |
| framework            | Framework tự sinh repository.                                |
| container            | Container chết vì hết RAM.                                   |
| load balancer        | Load balancer chia đều cho ba máy.                           |
| replica              | Đọc từ replica nên thấy dữ liệu cũ.                          |
| shard                | Dữ liệu chia làm 4 shard theo mã khách.                      |
| idempotency key      | Gửi kèm idempotency key để ngân hàng không trừ tiền hai lần. |
| race condition       | Đây là race condition: ai ghi sau thì thắng.                 |
| deadlock             | Hai transaction chờ nhau, deadlock.                          |
| lock                 | Giữ lock quá lâu thì request khác xếp hàng.                  |
| outbox               | Ghi event vào outbox cùng transaction với đơn hàng.          |
| tombstone            | Ghi tombstone thay vì xóa key.                               |
| circuit breaker      | Circuit breaker mở, ngừng gọi service đang chết.             |
| rate limit           | Bị rate limit ở 100 request mỗi giây.                        |
| snapshot             | Đọc snapshot trước, binlog sau.                              |
| migration            | Chạy migration trước khi deploy.                             |
| staging / production | Trên staging chạy ổn, lên production thì lỗi.                |
| p99 / latency        | p99 tăng từ 120 ms lên 2 giây.                               |

**Tiếng Việt được, nên dùng (20)**

| Tiếng Việt         | Thay cho         | Ví dụ                                  |
| ------------------ | ---------------- | -------------------------------------- |
| hàm                | function         | Hàm này gọi database hai lần.          |
| biến               | variable         | Biến `best` giữ tổng lớn nhất.         |
| mảng               | array            | Mảng đã sắp tăng dần.                  |
| chuỗi              | string           | Chuỗi rỗng cũng là giá trị hợp lệ.     |
| vòng lặp           | loop             | Hai vòng lặp lồng nhau.                |
| đệ quy             | recursion        | Hàm tự gọi chính nó.                   |
| độ phức tạp        | complexity       | Độ phức tạp O(n).                      |
| bảng / cột / dòng  | table/column/row | Bảng `orders` có 200.000 dòng.         |
| khóa ngoại         | foreign key      | Khóa ngoại trỏ về bảng khách.          |
| bộ nhớ             | memory           | Tốn thêm bộ nhớ O(1).                  |
| tiến trình         | process          | Tiến trình nào đang giữ port?          |
| hệ điều hành       | OS               | Mỗi hệ điều hành làm một kiểu.         |
| trình duyệt        | browser          | Chạy ngay trên trình duyệt.            |
| người dùng / khách | user             | Khách thấy giá cũ.                     |
| quyền              | permission       | Service không có quyền ghi.            |
| chứng chỉ          | certificate      | Chứng chỉ hết hạn.                     |
| mã hóa             | encrypt/encode   | Mã hóa Base64 làm dữ liệu to thêm 1/3. |
| cài đặt            | install          | Cài bằng một lệnh.                     |
| lỗi                | error            | Lỗi chỉ hiện khi tải cao.              |
| hóa đơn / chi phí  | bill / cost      | Hóa đơn tăng $204 mỗi tháng.           |

**Cả hai đều được, chọn một cho cả bài (16)**

| Cặp                           | Ghi chú                                                   |
| ----------------------------- | --------------------------------------------------------- |
| database / cơ sở dữ liệu      | Văn kể chuyện: database. Định nghĩa: cơ sở dữ liệu.       |
| server / máy chủ              | Dev nói server nhiều hơn.                                 |
| config / cấu hình             | "sửa config", "file cấu hình" đều tự nhiên.               |
| version / phiên bản           | "bản 1.13.0" cũng được.                                   |
| thread / luồng                | "luồng" dễ nhầm với flow; khi mơ hồ dùng thread.          |
| cluster / cụm                 | Kubernetes hay nói "cụm".                                 |
| primary key / khóa chính      |                                                           |
| source code / mã nguồn / code | "code" là từ dev nói nhiều nhất.                          |
| login / đăng nhập             | UI NIVO: luôn "đăng nhập".                                |
| domain / tên miền             | UI NIVO: luôn "tên miền".                                 |
| library / thư viện            |                                                           |
| pivot / chốt                  | Bài Quick Sort (#13) giới thiệu một lần rồi gọi "chốt".   |
| sliding window / cửa sổ trượt | Tên kỹ thuật thì giữ tiếng Anh ở tiêu đề.                 |
| consistency / tính nhất quán  |                                                           |
| test / kiểm thử               | Dev nói "viết test", "test fail"; "kiểm thử" hơi sách vở. |
| hash / băm                    | "hàm băm" quen trong trường; "hash" quen ở chỗ làm.       |

Bảng này cho StarCi Next. Với NIVO, chỉ dùng cột tiếng Việt và kể bằng chuyện của shop; không có cột "giữ tiếng Anh".

### 3.2 Calque cần tránh

Calque là dịch từng chữ một thuật ngữ, ra một từ Việt không ai dùng. Người đọc phải dịch ngược sang tiếng Anh trong đầu mới hiểu, tức
là tệ hơn cả để nguyên tiếng Anh.

| Calque                         | Dev nói               | Ghi chú                                                    |
| ------------------------------ | --------------------- | ---------------------------------------------------------- |
| lượt đọc                       | request đọc, lần đọc  | Bài CDC (#8) dùng và đọc rất cứng                          |
| dấu xóa                        | tombstone             | Giải nghĩa: "bản ghi đánh dấu đã xóa, kèm version"         |
| người đưa thư                  | message broker, queue |                                                            |
| lời báo                        | event, message        | "Hệ thống gửi lại event", không "gửi lại lời báo"          |
| sổ (cho bảng dữ liệu)          | bảng                  | "sổ" chỉ dùng khi đang ví von có chủ đích, và nói rõ là ví |
| điểm cuối                      | endpoint              |                                                            |
| bộ nhớ đệm                     | cache                 | Có trong giáo trình, nhưng dev không nói                   |
| kho chứa                       | repo                  |                                                            |
| kéo yêu cầu                    | pull request          |                                                            |
| tác nhân                       | agent                 | "AI agent", "agent"                                        |
| móc / cái móc                  | hook                  |                                                            |
| tải trọng                      | payload               |                                                            |
| ảnh chụp nhanh                 | snapshot              |                                                            |
| cờ tính năng                   | feature flag          |                                                            |
| đường ống                      | pipeline              |                                                            |
| hết thời gian chờ              | timeout               | Động từ được: "chờ 60 giây rồi bỏ cuộc"                    |
| trình xử lý                    | handler               |                                                            |
| người tiêu dùng / nhà sản xuất | consumer / producer   | Dịch kiểu này làm người đọc nghĩ tới kinh tế học           |
| khung làm việc                 | framework             |                                                            |
| thông số kỹ thuật yêu cầu      | specification, spec   | Bài BRD (#46) dịch kiểu "Tạm dịch" sau mọi từ              |

Có một ngoại lệ: **động từ** Việt thường tự nhiên hơn danh từ tiếng Anh. "Client thử lại sau 2 giây" hay hơn "client thực hiện retry".
"Chờ database rồi bỏ cuộc sau 60 giây" hay hơn "bị timeout khi kết nối database". Danh từ giữ tiếng Anh, động tác nói tiếng Việt.

### 3.3 Ngoặc giải nghĩa: một lần, ngắn, nói công dụng

- Tốt: "single-flight (nhiều request cùng hỏi một key thì chỉ một request xuống database)". Giải nghĩa bằng việc nó làm.
- Dở: "single-flight (gộp các lượt đọc trùng thành một truy vấn)". Giải nghĩa bằng một calque khác.
- Dở: mọi thuật ngữ đều có ngoặc, kể cả "prompt (toàn bộ nội dung đầu vào gửi cho AI)" (#43). Người đọc thấy bị coi thường.
- Dở: ngoặc tiếng Anh sau từ Việt, viết hoa: "dọn dẹp tài nguyên (Resource Cleanup)" (#18). Hoặc nói tiếng Việt, hoặc nói tiếng Anh.

Bài Graphify (#24) làm đúng thứ tự: giải thích bằng hình ảnh trước (bản đồ tàu điện: ga là hàm, đường nối là lời gọi), rồi mới nói
dân trong nghề gọi cái đó là knowledge graph. Khái niệm trước, nhãn sau.

---

## 4. Câu **(đề xuất)**

### 4.1 Độ dài và nhịp

Bài tự nhiên trộn câu ngắn và câu vừa. Câu dài nhất hiếm khi quá 30 chữ. Hai câu ngắn đứng cạnh nhau tạo nhịp:

- Bài Codex (#4): một câu nói thời gian chạy thẳng, một câu nói thời gian trong T3, rồi câu hỏi. Mỗi câu một con số.
- Bài type-tune (#48), dù cả bài là bản dịch, có một cặp câu đối xứng đáng học: tool nhanh hơn, "Developer của nó lại chậm hơn".

Cách kiểm: đếm dấu phẩy. Câu có từ bốn dấu phẩy trở lên thường là ba câu dính nhau. Tách ra.

### 4.2 Chủ động: ai làm gì

Văn dịch thích bị động vì tiếng Anh thích bị động. Tiếng Việt thì nói ai làm gì.

| Bị động / vô chủ (tránh)                           | Chủ động (nên)                 |
| -------------------------------------------------- | ------------------------------ |
| Request được gửi đến server bởi client.            | Client gửi request lên server. |
| Dữ liệu được ghi vào cache sau khi được đọc từ DB. | API đọc DB rồi ghi vào cache.  |
| Lỗi được phát hiện khi chạy test.                  | Test bắt được lỗi.             |
| Việc kiểm tra được thực hiện ở middleware.         | Middleware kiểm tra.           |

"Được" chỉ dùng khi có lợi thật: "khách được cộng điểm 12 lần" (khách hưởng lợi, nên "được" đúng nghĩa, và còn mỉa đúng chỗ).
"Bị" khi chịu thiệt: "request bị chặn".

### 4.3 Không danh hóa

Danh hóa là biến động từ thành danh từ rồi gắn một động từ rỗng vào. Đây là dấu hiệu số một của văn dịch và văn AI.

Các khuôn cần bắt:

| Khuôn                         | Ví dụ dở                                       | Viết lại                                   |
| ----------------------------- | ---------------------------------------------- | ------------------------------------------ |
| việc + V                      | Việc chọn sai phương thức có thể biến...       | Chọn sai cách gọi nhau thì...              |
| được thực hiện                | Quá trình đồng bộ được thực hiện mỗi 5 phút.   | Hệ thống đồng bộ 5 phút một lần.           |
| thực hiện + danh từ           | Thực hiện việc kiểm tra dữ liệu đầu vào.       | Kiểm tra dữ liệu đầu vào.                  |
| nhằm mục đích                 | Thêm index nhằm mục đích tăng tốc truy vấn.    | Thêm index để query nhanh hơn.             |
| sự + V/adj                    | Sự khác biệt giữa hai cách nằm ở...            | Hai cách khác nhau ở chỗ...                |
| tiến hành                     | Tiến hành cài đặt thư viện.                    | Cài thư viện.                              |
| có khả năng + V               | Hệ thống có khả năng xử lý 800.000 thông báo.  | Hệ thống gửi được 800.000 thông báo.       |
| đóng vai trò quan trọng       | Index đóng vai trò quan trọng trong hiệu năng. | Không có index, query quét cả bảng.        |
| mang lại                      | Generics mang lại sự linh hoạt.                | Có generics, một hàm dùng cho mọi kiểu số. |
| dẫn đến + hậu quả chung chung | ...dẫn đến nhiều hậu quả nghiêm trọng.         | ...và khách bị trừ tiền hai lần.           |

Bài Claude Code (#43) mở đoạn bằng một câu "việc ghi lại quy tắc" làm chủ ngữ; bài Job Counting (#42) có câu lấy "việc này" làm chủ
ngữ rồi "đòi hỏi... có khả năng". Cả hai đều viết lại được bằng một chủ ngữ và một động từ thật.

### 4.4 Cụ thể thay cho trừu tượng

Câu trừu tượng nghe "chuyên nghiệp" nhưng không cho người đọc gì để giữ. Thay bằng con số, tên, hành động.

- Trừu tượng: "Chi phí có thể tăng đáng kể."
- Cụ thể: "Hóa đơn thêm $204 mỗi tháng tiền NAT."
- Trừu tượng: "Hệ thống gặp vấn đề về hiệu năng khi tải cao."
- Cụ thể: "Lúc 21:05, 5.000 request mỗi giây đổ vào một key, Postgres trả lời sau 4 giây."

Bài server thiếu CPU (#30) làm rất gọn: nâng CPU khi lỗi nằm ở ổ đĩa là "tốn tiền mà website vẫn chậm". Một câu, hai hậu quả, không
một tính từ.

### 4.5 Giải thích bằng ví von

Ví von tốt là ví von **chạy được**: người đọc dùng nó để đoán đúng bước tiếp theo.

| Bài                        | Ví von                                                | Vì sao chạy được                                     |
| -------------------------- | ----------------------------------------------------- | ---------------------------------------------------- |
| Quick Sort (#13)           | "bức tường": số nhỏ ném sang trái tường               | Theo được trong bảng chạy tay, từng ô                |
| Bubble Sort (#14)          | số lớn nổi về cuối "giống bong bóng nổi lên mặt nước" | Giải thích luôn cái tên                              |
| Graphify (#24)             | bản đồ tàu điện: ga là hàm, đường là lời gọi          | Dẫn thẳng tới node/edge                              |
| ACID (#16)                 | chuyển 5 triệu từ A sang B, dùng xuyên bài            | Một ví dụ cho cả bốn chữ, không đổi ví dụ giữa chừng |
| Compiled/Interpreted (#20) | dịch cả cuốn sách rồi mới in                          | Dễ hiểu, dù câu xung quanh vẫn sách vở               |
| Kubernetes (#31)           | các team "không giẫm lên nhau"                        | Một cụm động từ thay cho cả đoạn định nghĩa          |

Luật cho ví von:

1. Một ví von, dùng xuyên suốt. Không đổi hình ảnh giữa bài.
2. Ví von đi **sau** cảnh thật, để làm rõ, không thay cảnh thật.
3. Nói ra chỗ ví von hỏng: "Khác với bốc số thật, ở đây..."
4. Ví von lấy từ đời sống Việt: bốc số thứ tự, xếp hàng ở quầy, ghi sổ nợ ở tiệm tạp hóa, gọi món ở quán. Không lấy kimchi, Super Bowl.

---

## 5. Cấu trúc bài **(đề xuất)**

### 5.1 Heading người ta thật sự dùng

Heading trên Viblo ngắn, là câu nói hoặc cụm danh từ đời thường, không phải "Giới thiệu / Nội dung / Kết luận".

Hay gặp và nên dùng:

- **Bối cảnh** / **Vấn đề**
- **Vì sao tốn tiền** / **Vì sao lại chậm** / **Vì sao không bỏ sót?** (heading là câu hỏi người đọc đang có)
- **Ý tưởng** / **Nói cho dễ hiểu**
- **Chạy tay một ví dụ** / **Chạy tay từng bước**
- **Code** / **Code Python**
- **Độ phức tạp**
- **Cách sửa** / **Cách làm**
- **Sau khi sửa**
- **Lưu ý** / **Vài điều cần nhớ**
- **Khi nào dùng, khi nào không**
- **Checklist tự kiểm tra**
- **Lời kết** / **Tóm lại**

Tránh: "I. Giới thiệu", "1. Định nghĩa X", "2. Tầm quan trọng của việc X", "3. Tác hại của X" (#47). Đó là dàn ý bài văn nghị luận.

Với StarCi Next, heading đã có luật riêng (`## N. HH:MM · tiêu đề ngắn`). File này chỉ thêm: phần tiêu đề ngắn sau giờ là một cụm
động từ có chủ ngữ ẩn ("Giá cũ sống thêm 33 giây"), không là danh từ hóa ("Sự cố về tính nhất quán của cache").

### 5.2 Đi qua bằng số thật

Đây là thứ phân biệt bài hay rõ nhất. Bài hay không nói "nhanh hơn nhiều"; họ chạy tay một ví dụ nhỏ, có bảng, rồi tính ra số.

- Series thuật toán (#10–#14): mảng 8 đến 12 phần tử, bảng từng bước, đếm đúng số phép so sánh. Two pointers: 6 bước thay vì 34.
- Series AWS (#3, #37–#39): "Hóa đơn" là phép nhân hai ba dòng, có đơn vị: số lần × giá = tiền.
- Bài NOT IN (#2): dữ liệu tự sinh, nói rõ là tự sinh, chạy 3 lần lấy trung vị, bảng ba cách viết.
- Bài Base64 (#15): một ảnh 100 KB, tính ra từng con số.

Khuôn:

1. Một ví dụ nhỏ đủ chạy tay (8–12 phần tử, 3–5 bước).
2. Một bảng: mỗi dòng một bước, cột cuối là kết quả.
3. Một câu đếm: "Tổng cộng 25 lần so sánh cho 8 phần tử."
4. Một câu phóng lên quy mô thật: "Với 1 triệu phần tử thì gần 500 tỷ."

Với StarCi Next, bước 4 lấy từ `scenarios.yaml`, không tự nhân ra.

### 5.3 Bảng

Bảng dùng khi có so sánh hai chiều. Ba kiểu bảng hay gặp:

- **Chạy tay**: Bước | Trạng thái | Hành động.
- **So sánh**: Bạn muốn biết | Cách cũ | Cách mới (#24); Bạn hay làm | Tool tương ứng (#6).
- **Hóa đơn**: Khoản | Cách tính | Thành tiền.

Ô trong bảng là cụm ngắn, không là câu dài. Cột đầu là thứ người đọc dò tìm.

### 5.4 Code đặt ở đâu

- Câu người nói trước, code sau. "Chỗ dễ sai nhất là chỉ số" rồi mới tới code.
- Code ngắn, chỉ dòng gây chuyện. Phần còn lại nói bằng tên file và số dòng.
- Comment trong code nói như người: `# < chứ không phải <=: không dùng 1 phần tử 2 lần`. Comment tiếng Việt được.
- Sau code, một câu chỉ vào dòng quan trọng: "Dòng 130 là khe hở."
- Output thật dán nguyên, cắt bớt thì ghi là cắt.

### 5.5 Kết bài

Kết bài tốt làm một trong bốn việc, không làm cả bốn:

1. **Lưu ý / Khi nào không dùng.** Giới hạn của cách sửa. Series AWS luôn có mục này: khi nào vẫn giữ cách cũ.
2. **Một việc làm được ngay.** Bài NOT IN (#2) cho một lệnh grep tìm mọi chỗ dính bẫy trong repo của bạn, mất một phút.
3. **Checklist tự kiểm tra.** Ba bốn câu hỏi có/không.
4. **Câu hỏi cho người đọc.** Hỏi về chuyện của chính họ: "Team bạn đang dùng loại nào, đã gặp lỗi khi chuyển chưa?" Không hỏi chung
   chung "Bạn nghĩ sao về bài viết?"

Tránh: "Hy vọng bài viết giúp ích cho các bạn. Happy coding!" như cả đoạn kết. Một dòng cảm ơn ở cuối thì được; nó không thay cho kết.

Với StarCi Next, kết của phần Bản chất đã có khung (Bản chất, Edge cases, Mang về). Áp dụng ý 1 và 3 vào đó; câu hỏi cho người đọc
là câu tự kiểm tra, không phải lời mời bình luận.

### 5.6 Độ dài

Bài một ý (#15, #26, #27) chỉ 2–4 phút đọc và vẫn đủ. Đừng kéo dài bằng mục "Tầm quan trọng", "Lịch sử ra đời", "Ưu điểm" chung chung.
Mỗi mục phải trả lời một câu người đọc đang hỏi.

---

## 6. Hài và sắc thái **(đề xuất)**

### 6.1 Hài tự nhiên

Hài trong bài dev Việt hay đến từ ba nguồn:

**a. Tự giễu chuyện thật.** Bài N+1 (#5) kể lúc bị thầy hỏi vặn, bạn cùng nhóm giải thích càng thêm tội, chỉ cần "Thôi xong...!" là đủ
hài. Bài NOT IN (#2) thú nhận suýt sửa code mà không đo.

**b. Động từ đời thường cho chuyện kỹ thuật.** "Vứt luôn cả nửa trái" (#12). "Dính chưởng". "Đốt tiền". "Gõ cửa". Một động từ mạnh
thay cho cả câu giải thích. Bài Go generics (#19) có "cắn răng viết thêm" một hàm y hệt.

**c. Quan sát đúng mà ai cũng thấy.** Bài Impeccable (#25): bảo agent làm landing page "mười lần thì tám lần" ra nền tối, gradient tím,
ba cái card. Người đọc cười vì đã thấy đúng cảnh đó.

Khẩu ngữ đúng liều làm bài sống: "khá khoai" (#42), "có nhiều đất diễn hơn" (#22), "Điểm ăn tiền" (#21), "phình" (#15).

### 6.2 Hài gượng

| Dấu hiệu                                            | Vì sao gượng                                          |
| --------------------------------------------------- | ----------------------------------------------------- |
| Emoji mỗi đoạn, ba cái liền 😂😂😂                  | Thay cho nội dung, đọc như bình luận Facebook         |
| "đỉnh của chóp" (#41), "hack não", "xịn xò" dày đặc | Trend chữ, hết hạn nhanh, người lớn tuổi thấy trẻ con |
| "Lên thuyền với mình đê" (#40)                      | Hợp blog cá nhân của người có fan; không hợp bài học  |
| Chơi chữ cố ý ở mỗi heading                         | Người đọc phải dừng để hiểu trò đùa                   |
| Câu đùa về giới tính, vùng miền, ngoại hình         | Không bao giờ                                         |
| Giọng hô hào: "Cùng mình khám phá nào!!!"           | Văn mẫu nhiệt tình giả                                |

Luật cho StarCi Next và NIVO:

- Bài học: hài chỉ đến từ tình huống (khách được cộng điểm 12 lần là đủ buồn cười). Không emoji trong thân bài. `=))` không.
- NIVO: không đùa trong UI. Bài blog sản phẩm được một câu nhẹ nhàng, không emoji trong câu chính.
- Không chê người đọc, không chê "junior". Tự giễu thì được, giễu người đọc thì không.

### 6.3 Tính từ cường điệu

Bài tự nhiên ít tính từ. Bài dịch và bài AI đầy "cực kỳ mạnh mẽ", "tuyệt vời", "vô cùng", "triệt để", "hoàn hảo". Mỗi tính từ
khen là một chỗ có thể thay bằng số:

- "cực kỳ nhanh" thì thay bằng "6 bước thay vì 34".
- "giảm chi phí đáng kể" thì thay bằng "từ $250 xuống $3".
- "Đây là một bước tiến thú vị" (#36): bỏ cả câu, câu sau đã nói đủ.

---

## 7. Mười lăm cặp Trước / Sau **(đề xuất)**

Câu do mình tự viết, gom các lỗi hay gặp nhất. Mỗi cặp ghi lỗi chính.

**1. Mở bài văn mẫu**

- Trước: "Trong thời đại số hóa hiện nay, cache đóng vai trò vô cùng quan trọng trong việc nâng cao hiệu năng của hệ thống."
- Sau: "21:03, trang sản phẩm hiện giá 249.000đ trong khi database đã là 199.000đ. Khách đặt theo giá cũ thêm 33 giây."

**2. Danh hóa "việc + V"**

- Trước: "Việc thực hiện kiểm tra trùng lặp trước khi ghi dữ liệu là cần thiết nhằm đảm bảo tính toàn vẹn."
- Sau: "Ghi trước rồi để database từ chối bản trùng. Kiểm tra trước rồi mới ghi thì vẫn lọt."

**3. Bị động kiểu tiếng Anh**

- Trước: "Event được gửi lại bởi hệ thống thanh toán và được nhận bởi dịch vụ tích điểm 12 lần."
- Sau: "Hệ thống thanh toán gửi lại event, và dịch vụ tích điểm nhận nó 12 lần."

**4. Calque**

- Trước: "Bên đổi giá ghi một dấu xóa, để lượt đọc kế tiếp phải xuống sổ giá."
- Sau: "Bên đổi giá ghi một tombstone (bản ghi đánh dấu đã xóa, kèm version), nên request đọc kế tiếp phải xuống Postgres."

**5. Ngoặc tiếng Anh viết hoa sau từ Việt**

- Trước: "Cơ chế Thử Lại (Retry) với Độ Trễ Tăng Dần (Exponential Backoff) giúp hệ thống Phục Hồi (Recover)."
- Sau: "Client retry với backoff tăng dần: chờ 1 giây, rồi 2, rồi 4. Service kịp đứng dậy trước khi bị dội tiếp."

**6. Giải nghĩa mọi từ**

- Trước: "Bạn gửi request (yêu cầu) tới API (giao diện lập trình ứng dụng) và nhận response (phản hồi)."
- Sau: "Bạn gọi API, đợi response."

**7. Tính từ thay cho số**

- Trước: "Sau khi tối ưu, hiệu năng được cải thiện một cách đáng kể và vượt trội."
- Sau: "Sau khi thêm index, query từ 2,1 giây xuống 40 ms."

**8. Hậu quả chung chung**

- Trước: "Nếu không xử lý race condition, hệ thống có thể gặp nhiều hậu quả nghiêm trọng."
- Sau: "Không xử lý race condition thì hai khách cùng mua được cái áo cuối cùng, và shop phải gọi xin lỗi một người."

**9. "Nhằm mục đích", "tiến hành"**

- Trước: "Chúng ta tiến hành cấu hình TTL nhằm mục đích giảm tải cho cơ sở dữ liệu."
- Sau: "Đặt TTL 60 giây để database không phải trả lời cùng một câu hỏi 5.000 lần mỗi giây."

**10. Câu dính bốn ý**

- Trước: "Khi người dùng đặt hàng, hệ thống sẽ ghi đơn vào database, sau đó gửi event sang kho, đồng thời gửi email, và nếu có lỗi
  thì sẽ thực hiện retry, tuy nhiên điều này có thể gây trùng."
- Sau: "Khách đặt hàng. Hệ thống ghi đơn, rồi báo kho và gửi email. Bước báo kho lỗi thì retry, và đây là chỗ sinh ra đơn trùng."

**11. Kết bài sáo**

- Trước: "Hy vọng qua bài viết này, các bạn đã có cái nhìn tổng quan về idempotency. Chúc các bạn thành công!"
- Sau: "Trước khi đóng tab: tìm trong code của bạn chỗ nào 'tra rồi mới ghi'. Mỗi chỗ là một khe cho bản trùng."

**12. Xưng hô lẫn lộn**

- Trước: "Chúng ta sẽ cùng tìm hiểu. Tôi đã thử chạy. Mình thấy anh em nên biết điều này."
- Sau: "Mình chạy kịch bản này 3 lần. Lần nào cũng ra 12 bản trùng. Bạn chạy thử ở lab bên phải."

**13. Văn sản phẩm NIVO bị kỹ thuật hóa**

- Trước: "Webhook Zalo trả lỗi 401, vui lòng cấu hình lại token của OA để tiếp tục đồng bộ tin nhắn."
- Sau: "Kết nối Zalo của cửa hàng đã hết hạn. Kết nối lại để trợ lý tiếp tục trả lời khách."

**14. Văn sản phẩm NIVO quảng cáo rỗng**

- Trước: "Giải pháp AI toàn diện giúp tối ưu hóa trải nghiệm khách hàng và nâng cao hiệu quả kinh doanh vượt trội."
- Sau: "Khách nhắn hỏi giá lúc 11 giờ đêm. Trợ lý trả lời ngay, sáng ra bạn chỉ việc duyệt đơn."

**15. Định nghĩa trước, chuyện sau**

- Trước: "Idempotency là tính chất mà một thao tác khi được thực hiện nhiều lần cho ra kết quả giống như khi được thực hiện một lần."
- Sau: "Khách bấm 'Thanh toán' hai lần vì mạng lag. Ngân hàng chỉ được trừ tiền một lần. Thao tác chạy bao nhiêu lần cũng ra như chạy
  một lần, người ta gọi là idempotency."

---

## 8. Checklist trước khi nộp **(đề xuất)**

Chạy trên bản nháp. Một câu "không" là sửa trước khi nộp. Sau checklist này, kiểm bằng bốn skill như [vietnamese.md](vietnamese.md) nói; skill nào làm phẳng giọng blog thì giữ giọng.

**Mở bài**

- [ ] Ba dòng đầu có một thứ cụ thể: dòng lỗi, con số, câu nói quen, cảnh người đọc nhận ra?
- [ ] Không mở bằng định nghĩa, "Hôm nay chúng ta sẽ", "Trong thời đại"?
- [ ] Câu thứ hai hoặc ba nói bài này làm gì (và không làm gì)?

**Giọng**

- [ ] Một kiểu xưng hô cho cả bài ("bạn", thêm "mình" khi kể việc đã làm thật)?
- [ ] Không "anh em", không "quý khách", không "người dùng" trong UI NIVO?
- [ ] Đọc to một đoạn bất kỳ: có giống một dev nói với đồng nghiệp không?

**Từ**

- [ ] Thuật ngữ dev nói bằng tiếng Anh thì giữ tiếng Anh, viết thường, không thêm "s"?
- [ ] Mỗi thuật ngữ lạ giải nghĩa đúng một lần, bằng việc nó làm, không bằng một calque?
- [ ] Không còn từ nào trong bảng calque (mục 3.2)?
- [ ] Không ngoặc tiếng Anh viết hoa sau từ Việt?
- [ ] NIVO: không còn thuật ngữ kỹ thuật nào ngoài "Chi tiết kỹ thuật"?

**Câu**

- [ ] Tìm "việc ", "được thực hiện", "tiến hành", "nhằm mục đích", "sự ", "mang lại", "đóng vai trò": mỗi chỗ đã viết lại bằng chủ
      ngữ + động từ thật?
- [ ] Không câu nào có từ bốn dấu phẩy trở lên?
- [ ] Mỗi câu bị động đều có lý do (được lợi / bị thiệt)?
- [ ] Tìm "cực kỳ", "vô cùng", "tuyệt vời", "đáng kể", "vượt trội", "triệt để": thay bằng số hoặc xóa?

**Cấu trúc**

- [ ] Heading là cụm đời thường hoặc câu hỏi người đọc đang có, không "Giới thiệu / Tầm quan trọng / Kết luận"?
- [ ] Có ít nhất một ví dụ chạy tay với số thật, có bảng?
- [ ] Câu người nói đứng trước code; sau code có một câu chỉ vào dòng quan trọng?
- [ ] Ví von (nếu có) là một hình ảnh dùng xuyên suốt, đời sống Việt, đi sau cảnh thật?
- [ ] Kết bài là lưu ý, việc làm ngay, checklist hoặc câu hỏi về chuyện của người đọc, không phải lời chúc?

**Thật**

- [ ] Mọi con số có nguồn (run thật, ngày chạy); số minh họa thì nói là minh họa?
- [ ] Không câu nào khẳng định điều dữ liệu không chứng minh?

**Hài**

- [ ] Không emoji trong thân bài học; không trend chữ; hài nếu có thì đến từ tình huống?

---

## Phụ lục: mười luật nếu chỉ nhớ được mười **(đề xuất)**

1. Mở bằng thứ cụ thể (lỗi, số, câu nói quen), định nghĩa để sau.
2. Ai làm gì: chủ ngữ thật, động từ thật, bỏ "việc", "được thực hiện", "tiến hành".
3. Thuật ngữ dev nói tiếng Anh thì giữ tiếng Anh, giải nghĩa một lần bằng công dụng.
4. Không calque: "lượt đọc", "dấu xóa", "lời báo", "người đưa thư" là dấu hiệu văn dịch.
5. Danh từ giữ tiếng Anh, động tác nói tiếng Việt ("client thử lại", không "thực hiện retry").
6. Số thay cho tính từ; chạy tay một ví dụ nhỏ có bảng.
7. Một ví von, đời sống Việt, dùng xuyên suốt, đặt sau cảnh thật.
8. "bạn" xuyên suốt; "mình" chỉ khi kể việc đã làm thật; không "anh em" trong bài học và UI.
9. Hài đến từ tình huống, không từ emoji hay trend chữ.
10. Kết bằng giới hạn, việc làm ngay hoặc câu hỏi về chuyện của người đọc, không bằng lời chúc.
