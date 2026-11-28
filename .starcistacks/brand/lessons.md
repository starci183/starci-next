# starci-next lessons: luật viết một bài lab Essentials

Prompt của mọi bài lab (contexts/project/brand.md: sheet của app, cùng họ với `brand.md`, `illustration.md`, `media.yaml`). Ai viết hoặc sửa một lab (repo `starci-next-essential-labs`, người hay AI) đọc hết file này trước khi đụng vào
`starci-lab.yaml`, code mẫu hay hình. Mỗi luật ghi kèm ngày và lời gốc của thầy; thầy góp ý thêm thì ghi tiếp vào đây,
không để góp ý chỉ nằm trong chat.

## 1. Chữ: ngôn ngữ lập trình + nghiệp vụ

- Gọi đúng vai trò kỹ thuật: `frontend`, tên service backend (`orders`, `payments`, `stock`), `Postgres`, `Redis`.
  Câu nói ai làm gì bằng chính các tên đó: "backend trả 409", "payments trừ tiền", "frontend chưa cập nhật".
  (2026-11-27: "NGÔN NGỮ LẬP TRÌNH + NGHIỆP VỤ TRONG VIẾT BÀI", "với tất cả thuật ngữ không ghi shop".)
- Không bao giờ dùng chữ "shop", không đặt tên kiểu kể chuyện cho một phần của hệ thống. "Khách" chỉ dùng khi nói
  về người thật ở phía nghiệp vụ (ví của khách), không dùng làm tên một node trong sơ đồ.
- Tiêu đề bài là **tên khái niệm**: "Idempotency key", "Saga", "Transaction (ACID)". Không dùng một câu chuyện làm
  tiêu đề. Dòng mô tả một câu, nói khái niệm làm được gì, cũng bằng tên kỹ thuật.
  (2026-11-27: "không ghi shop, tiêu đề phải là Idempotency key".)
- Giọng vẫn là người dẫn dắt nói với "bạn", mở bằng câu phỏng vấn học viên hôm nay chưa trả lời được
  (xem luật giọng kể của app), nhưng từ vựng là từ vựng kỹ thuật ở trên.

## 2. Hình giải thích của bài

- Mỗi bài có một hình giải thích (explainer): sơ đồ có chú thích, nhìn một lần là hiểu cơ chế. Không dùng hình minh
  hoạ trang trí cho chỗ này. (2026-11-27: "không hình minh hoạ như kiến trúc ấy… nhìn phát hiểu".)
- Prompt gốc: `media.yaml` cạnh file này, `bases.explainer` (font IBM Plex Serif cho
  title/description, IBM Plex Sans cho nhãn, kích thước chip, vòng số, ghim, màu cố định). Hình mới **phải** bắt đầu
  bằng đúng base đó; chỉ phần subject là của từng bài. (2026-11-27: "chốt phông chữ, height của chip, size của
  title/description… 1 size".)
- Subject của một bài gồm: title (tên khái niệm), description, các actor từ trái sang phải đúng thứ tự luồng, các
  bước đánh số 1, 2, 3… (mỗi nhãn bước một dòng, tối đa ~32 ký tự), và checklist 2–4 dòng.
- Nhãn trong hình theo luật chữ ở mục 1.

## 3. Code mẫu: sai sẵn ở mọi ca

- Code học viên tải về sai sẵn **ở cả ca bình thường**, nhưng chỉ 1–2 dòng mỗi chỗ, sửa nhanh. Ca sự cố mới là chỗ
  sửa lớn. (2026-11-27: "ở happy case của đơn bình thường thì cố tình sai 1,2 dòng để sửa nhanh thôi".)
- Bậc của lab (git tag `<lab>/<bậc>`):
  - `c0-start`: code học viên tải về. Bằng `c0-naive` cộng 1–2 lỗi nhỏ làm đỏ các ca bình thường.
  - `c0-naive`: bản sửa của các ca bình thường (`ref` của chúng). Từ bậc này các ca bình thường phải xanh.
  - `c1-…` trở đi: mỗi ca sự cố một bậc, như cũ.
  - Mỗi bậc chỉ được đổi file học viên sửa so với bậc trước (`ladder:check` kiểm).
- Lỗi của ca bình thường phải là lỗi thường gặp, không phải lỗi của khái niệm bài: quên một dòng chốt
  (`orders.confirm`), timeout quá ngắn, sai một tham số. Mỗi lỗi chỉ làm đỏ **một** điều kiện rõ ràng, để học viên
  thấy ngay chỗ lệch.
- Mỗi ca ghi `focus`: file và các dòng ca đó kiểm, để trang tô đúng dòng khi chọn ca. (2026-11-27: "highlight từng
  success case/fail case từng cái".)
- Mỗi điều kiện (invariant) là một test riêng, để trang tô xanh/đỏ từng điều kiện một.

## 4. File học viên sửa

- Mặc định **một file** mỗi lab (`learnerFile`), ghi ngay đầu file "Đây là file duy nhất bạn sửa". Một file giữ
  bài tập trung, diff ngắn, grader chỉ chấm đúng chỗ.
- Chỉ dùng nhiều file khi chính khái niệm buộc phải vậy (ví dụ outbox: code service **và** migration của bảng
  outbox). Khi đó:
  - manifest khai `learnerFiles: [a, b]`, tối đa 3 file;
  - `focus` của từng ca nói rõ file nào, dòng nào;
  - mỗi bậc chỉ được đổi các file trong `learnerFiles`;
  - trang đổi nhãn thành "Những file bạn sửa (2)", có tab theo file, mỗi file có dòng tô màu và tab "Bạn đã đổi" riêng.
  - Nếu một ca cần sửa ở hơn 3 file thì tách thành hai lab, đừng nới luật.

## 5. Diff

- "Bạn đã đổi" (file hiện tại so với `c0-start`) luôn mở: đó là code của chính học viên.
- Diff với bản giải (bậc trước → bậc của ca) chỉ mở khi ca đã xanh; reset về bản giải luôn mở nhưng được ghi lại
  là `case.reset`. Không lab nào được để lộ bản giải sớm hơn.

## 6. Kiểm trước khi push

- `npm run case -- ladder:check` trong thư mục lab: bậc `c0-start` có ca bình thường đỏ đúng điều kiện đã định, mọi
  bậc sau đó đúng luật mục 3.
- Rà chữ theo mục 1: tìm "shop", tên kể chuyện, tiêu đề không phải tên khái niệm.
- Hình theo mục 2: soi lại chữ có dấu, kích thước chip và title giống các hình đã duyệt.
- Audit nội dung theo [lessons-audit.md](lessons-audit.md) (2026-11-28): một agent đọc bài với vai junior, viết báo cáo; thầy duyệt rồi mới sửa.

## 7. Các trang của bài và cách vẽ

- Thứ tự trang: Giới thiệu → Cài đặt → Kiến trúc → Happy path → Unhappy path → Tổng kết → Nộp bài. Kiến trúc đứng ngay
  sau Cài đặt: lab đã dựng trên máy, học viên đọc hệ thống được xây thế nào và code nào chạy, rồi mới chạy các ca. (2026-11-28:
  "sau trang này đến trang kiến trúc chứ không phải đơn bình thường?")
- Trang Cài đặt, Kiến trúc chia hai như Giới thiệu: cột chính ở reading measure căn giữa, rail dính mép phải. Mỗi bước, mỗi
  mọi con số (bước 1–3, mốc relay 1–5, hàng đánh số ở trang Kiến trúc) là IconTile TRÒN (status mark, `IconTile state`
  với glyph là con số): bước hiện tại waiting, bước chưa tới notRun, mốc đang chạy có vòng xoay, lỗi danger, xong là tick.
  Không dùng ô vuông `IconTile step` cho số. Alert của trang chia hai nằm trong cột giữa, cùng reading measure, không trải
  qua rail. (2026-11-28: "trước h chốt tròn là IconTile cả mà", "alert phải nằm giữa".)
- Trang Kiến trúc là trang tĩnh, chỉ giải thích: nghiệp vụ (luồng một đơn bằng từ nghiệp vụ), kiến trúc (sơ đồ Mermaid sinh
  từ source), vì sao cách làm thường không đủ (ví dụ: không có transaction bao trọn các database), và code (file học viên
  sửa nằm ở đâu, trích đoạn tô màu Shiki). Không trạng thái ca; nút duy nhất là lệnh sang Đơn bình thường ở rail. (2026-11-27: "chỉ phân tích bối cảnh, giải
  thích nghiệp vụ, giải thích code như trang tĩnh".)
- Sơ đồ ghi tên thật từ source: cạnh là HTTP request với method và path (`POST /charges`), không ghi chữ mơ hồ như "lời
  gọi"; hộp database ghi tên các bảng nó giữ và chú thích "chỉ service này đọc/ghi". (2026-11-27: "lời gọi là gì? dữ liệu
  riêng làm gì?")
- Danh sách có dấu (học xong làm được, phải đúng, các bước cài đặt) dùng `IconTile` của Grammar, không dùng ✓ hay vòng số
  trơn; bước đã xong là tile check xanh, bước đang làm tile tím, bước chưa tới tile xám. (2026-11-27: "check nhớ dùng icon
  tile", "số 2 vẫn là icon tile à?")
- Canvas thiết kế chỉ là tham khảo bố cục; trang thật dựng bằng component Grammar trên source hiện tại.
- Trang Kiến trúc không có mục "Phần bạn sửa". Thay vào đó, trang kết thúc bằng "Các tình huống kiểm tra": mọi ca của bài,
  ca bình thường trước rồi ca sự cố, mỗi dòng một tile số, tên ca và một câu tả tình huống nó tạo ra bằng từ kỹ thuật và
  nghiệp vụ ("payments trả lời chậm 400 ms"). Chỉ tình huống, không cách sửa, không tên khái niệm. (2026-11-27: "không
  ghi phần bạn sửa mà liệt kê các tình huống kiểm tra".)
- Không bao giờ dùng tên file trơn làm tiêu đề hay để người đọc tự đoán. Lần đầu nhắc file học viên sửa: tiêu đề nói việc
  nó làm ("Code chạy khi frontend gửi POST /checkout"), câu đầu nói nó nằm ở service nào, làm gì, và là file duy nhất bạn
  sửa; trên sơ đồ, node chứa file ghi thêm tên file. (2026-11-27: "checkout ts là gì?")
- Trang Nộp bài sau khi qua là repo quà: bản chuẩn StarCi và các repo thật trên thế giới dùng cùng ý tưởng. Mỗi mục chỉ
  nói bản chất và vài câu sơ lược (nó giống, khác bài ở đâu), không đặt code hay diff lên trang; code nằm trong repo quà.
  Không phải lúc nào cũng show code: chỉ đưa code khi chính đoạn code là điều cần hiểu. (2026-11-28: "gửi bản chất và nói
  sơ sơ thôi, chứ không phải lúc nào cũng show code".)

## 8. Văn phong: tiếng Việt của dev, thuật ngữ giữ tiếng Anh

Câu viết bằng tiếng Việt; mọi thuật ngữ kỹ thuật và tên thực thể giữ nguyên tiếng Anh như trong code và như dev Việt nói
với nhau, không dịch. Áp 100% cho mọi chữ của bài: tiêu đề, câu phỏng vấn, outcome, tên ca, gợi ý, chú thích sơ đồ, hình.
(2026-11-28: "văn phong backend, frontend, giao dịch, sửa khách thành users… 100% ngôn ngữ truyền đạt là thế".)

| không viết | viết |
|---|---|
| khách, khách hàng | user |
| giao dịch | transaction |
| máy chủ, phía máy chủ | backend |
| giao diện, phía người dùng | frontend |
| đơn hàng (dữ liệu) | order |
| ví | wallet |
| lời gọi, gọi sang | request, gửi request |
| câu trả lời | response |
| cơ sở dữ liệu | database |
| thử lại | retry |
| hết hạn chờ | timeout |
| hoàn tiền (thao tác) | refund |
| kho, giữ hàng (dữ liệu) | stock, reservation |

Ví dụ: "payments đã trừ tiền trong wallet của user, rồi stock trả 409 hết hàng; không có transaction nào rollback được."

## 9. Ngôn ngữ IT, tên service, keyword, câu trích (2026-11-28)

- Viết bằng **ngôn ngữ IT**, như dev Việt nói về lập trình: câu tiếng Việt, keyword tiếng Anh. Nói "users", "gửi request",
  "nhận response", "retry", "timeout", "commit", "rollback", "trả 409". (Owner: "ghi rõ users, gửi request, nhận responses,
  như cách dev việt nói về lập trình".) Bảng từ ở mục 8.
- Keyword có gạch chân chấm (3 chấm dưới chữ); rê chuột hoặc chạm thì hiện giải thích ngắn (`GlossaryTerm` của Grammar: gạch chân chấm, giải thích khi hover, focus hoặc chạm; không dùng `SidenoteTerm`, vì nó đặt giải thích ở cột bên). Không
  giải thích chen trong câu, không danh sách thuật ngữ cuối đoạn. (Owner: "dùng tiếng anh cho keyword, có 3 chấm dưới! không
  cần giải thích đâu, hover vào là có".) Giải thích nằm trong dữ liệu bài (`terms`), một câu mỗi keyword.
- Gọi tên service đầy đủ, in đậm: **order service**, **payment service**, **stock service**, **notify service**; không viết trơn
  "payments", "backend orders". Tên trong code (`orders`, `payments`) chỉ dùng khi nói đúng tên trong code hay sơ đồ, để dạng code.
  (Owner: "payments gì? ghi rõ ra payment service chớ?")
- Lời dẫn viết bằng markdown: in đậm tên service, code để dạng `code`.
- Câu trích (lời người phỏng vấn, câu hỏi dồn) để chữ trơn: không in đậm, không code, không keyword gạch chân. (Owner: "quote
  thì plain text".)
- Lời dẫn đi kèm avatar thầy và nhãn người kể (Owner: "để cái mặt thầy".)
- Không khung "phút thứ 40": không dòng "Phỏng vấn vòng hai, phút thứ 40", không byline đó dưới câu hỏi, tiêu đề nhắc lại không nhắc phút
  (2026-11-28, owner: "bỏ mấy từ này đi, ghi rõ CTO nivo.vn".)
- Người hỏi là chính thầy, CTO của nivo.vn: không có "anh/chị trưởng nhóm" hay người thứ hai nào. `hook.asker` là
  "Thầy StarCi · CTO nivo.vn"; câu hỏi vẽ bằng `Quote` của Grammar (`variant="block"`, `source` "Thầy StarCi · CTO nivo.vn", không byline)
  nằm trong cùng khối với lời dẫn: một avatar và nhãn ở đầu, rồi lời dẫn, rồi câu hỏi của thầy, không avatar thứ hai. Lời dẫn kể như thầy
  nói với bạn ("Thầy gật đầu, rồi vẽ lên bảng bốn service…"), tiêu đề nhắc lại là "Bạn còn nhớ câu Thầy StarCi hỏi ở đầu bài không?" (owner chọn, 2026-11-28).
  (2026-11-28, owner: "sao lại còn anh trưởng nhóm hỏi? là thầy hỏi đó".)
- `Quote` của câu hỏi không có `source`: avatar và nhãn "Thầy StarCi · CTO nivo.vn" ở đầu khối đã nói ai hỏi. (2026-11-28, owner: "trên có
  mặt rồi cần thầy starci cto hỏi chi nữa?")
- Cảnh phỏng vấn (hook scene, stuck, promise) và đoạn nhắc lại (recall) là chuyện kể ngôi thứ ba: Thầy StarCi phỏng vấn một ứng viên
  backend, không kéo "bạn" vào chuyện ("Thầy StarCi đang phỏng vấn một ứng viên backend. Ứng viên trả lời trôi mấy câu mở màn về Postgres
  và transaction. Thầy StarCi vẽ lên bảng bốn service… Ứng viên định nói “bọc hết trong một transaction”, rồi khựng lại…"). Ghi rõ
  "Thầy StarCi" ít nhất ở lần nhắc đầu của mỗi đoạn, sau đó "thầy" là được; người được hỏi là "ứng viên". Outcomes, tình huống, gợi ý vẫn
  nói với người học. (2026-11-28, owner: "đừng lôi bạn vào, kiểu kể chuyện thầy phỏng vấn", "thầy StarCi ghi rõ ra nhé".)
- Ứng viên không tự thấy chỗ hỏng: `hook.stuck` là câu trả lời ngây thơ của ứng viên, rồi Thầy StarCi sấy lại bằng một câu trích chữ trơn
  (`hook.pushback`, cùng `Quote` không nhãn) cho thấy vì sao nó hỏng, không gọi tên khái niệm hay cách sửa; `promise` mở bằng "Ứng viên
  im lặng." Saga: “Bốn service, bốn database. Transaction nào bao trọn được cả bốn? Payment service đã commit xong rồi, stock service mới
  trả 409. Em rollback cái gì?” (2026-11-28, owner: "ghi rõ thầy sấy đi!! chứ ứng viên sao tự trả lời dc".)

Ví dụ lời dẫn đúng: "Bạn vừa kể xong cách **order service** gửi request sang **payment service**: đặt timeout 1 giây, không nhận
được response thì retry, mỗi lần chờ lâu hơn theo backoff." (timeout, response, retry, backoff có gạch chân chấm.)
- Tên hai trang ca: **Happy path** và **Unhappy path** (2026-11-28: "chốt"), không "Đơn bình thường / Khi có sự cố",
  không "Happy case" (chữ "case" trùng với "ca"). Từng ca bên trong vẫn là "ca". Ca ở Unhappy path giống ca ở Happy path: không
  có header thầy; câu Thầy StarCi hỏi là Quote mở đầu phần Tình huống (2026-11-28: "ghép mặt thầy vào làm gì?"). Header thầy
  chỉ ở trang Giới thiệu và Tổng kết. Rail của trang ca là "Những file bạn sửa".
- Nhãn UI viết như dev Việt nói (2026-11-28: "label với mấy từ trò dùng như dịch eng sang"; đối chiếu file dịch giao diện
  VNOJ, LQDOJ và bài QA Viblo). Trạng thái: Đạt / Không đạt / Chưa chạy / Đang chấm / Đã khoá. "Kết quả mong đợi",
  "Kết quả thực tế", "Xem lời giải", "Lấy lời giải" (một tên cho một thứ: nút và dòng dưới nó cùng gọi là lời giải, 2026-11-28), "So sánh với lời giải", "Thử lại" (không "Retry"), "Kết nối máy"
  (không "Ghép máy"), "Nộp bài / Nộp lại". Ba phần của một ca: Tình huống → Điều kiện → Kiểm tra. Không danh từ hoá kiểu
  "Điều phải đúng", "Về bước tham khảo"; không thêm "về/của" thừa; nhãn nút là động từ + tân ngữ.
- Câu hỏi nối tiếp của người phỏng vấn là **câu hỏi đào sâu** (báo tuyển dụng VN, CareerLink) hoặc "Thầy StarCi hỏi tiếp";
  không viết "hỏi dồn" (nghĩa là dồn dập, ép). Văn phong như báo chí Việt: chủ ngữ rõ, câu đủ ý, không cắt chữ kiểu
  "Chưa đạt · qua câu này…". (2026-11-28: "hỏi dồn là gì? wording chuẩn tiếng Việt, văn phong người Việt".)
- Mỗi lần qua một mốc thì bắn confetti một lần (2026-11-28: "pass gì đó nhớ bắn confetti"): lab dựng xong, một ca chuyển
  sang Đạt, bài nộp qua. Chỉ bắn đúng lúc trạng thái đổi khi trang đang mở, không bắn khi mở trang đã qua; tắt khi
  người dùng chọn giảm chuyển động.
- Cỡ IconTile (2026-11-28, chốt): **48** định danh đầu trang, trạng thái rỗng; **40** một hàng bấm/chọn được trong danh sách
  (đầu mỗi ca trong accordion, hàng điều hướng); **20** mọi đánh dấu đi cùng một dòng chữ chỉ để đọc (bước cài đặt, mốc
  relay, luồng order, request, tình huống, phần trong ca, điều kiện, điều học được, điều kiện nộp bài). Bấm được → 40; chỉ
  đọc → 20; đầu trang → 48.

## 10. Cỡ chữ: một vai một cỡ (2026-11-28)

Thầy chốt ngày 2026-11-28: "phông chữ label lúc nhỏ lúc to, audit lại font chữ toàn bộ sao cho đồng nhất". Mọi trang của mọi bài
dùng đúng một cỡ và một độ đậm cho mỗi vai, lấy từ type role của Grammar (`contexts/ui/presentation.md` "The type roles" của
harness), không tự đặt cỡ:

| Vai | Cỡ / dòng / đậm | Vẽ bằng |
| --- | --- | --- |
| Tiêu đề trang (tên bài) | 18 / 26 / 500 | header của Page (h1), một lần mỗi trang; tab không thêm tiêu đề thứ hai |
| Tab trang | 14 / 20 / 500 | `Tabs` |
| Tiêu đề section (h2), section con (h3), card, một ca trong accordion | 16 / 24 / 500 (`title.section`) | `Section title`, `SurfaceCard label`, tên ca là `Text role="title.section"`; không dùng `Heading level={2}` trơn (14), không dùng `reading.title` |
| Nhãn trên một danh sách, tên một mục, tên phần trong ca | 14 / 20 / 500 (`label.item`) | `Text role="label.item"` ("Cần đủ hai điều kiện trước khi chấm", "Tech stack", "Tình huống") |
| Chữ thường, mô tả dưới tiêu đề | 14 / 20 / 400 (`body`) | `Text` không role; phụ thì `tone="muted"`; mô tả mở đầu một section là `Text` body đầu tiên trong section (không dùng `Section description`: nó vẽ thành chú thích 12 dưới thân section) |
| Lời dẫn của trang | 17 / 29 / 400 (`reading.body`) | chỉ đoạn kể của chính trang, đứng thẳng ở cấp trang (hook trang Giới thiệu, đoạn kể trang Tổng kết) |
| Câu trích | 16 / 400 ở cấp trang; 14 / 22 / 400 (`body`) trong khối lồng | Grammar `Quote` block: ở cấp trang (câu trích mở đầu trang Giới thiệu) giữ cỡ lớn; trong accordion, phần gập, section con hay card Grammar tự vẽ nó bằng `body`, nổi bằng vạch màu và dấu trích |
| Meta, chú thích | 12 / 16 / 400 muted (`caption`) | ngày, ngôn ngữ, danh sách sự cố; không bao giờ là nhãn trên một danh sách |
| Badge | 12 / 16 / 500 | `Badge` |
| Code | theo dòng chứa nó | `Code` trong câu (0,875 cỡ dòng), khối code 13 |
| Nút, link | 14 / 500 | `Button`, `Link` |

Bốn luật đi kèm (ba luật đầu là của harness `contexts/grammars/contract.yaml`: `DNA-COMMON-TYPE-NESTED-NOT-LARGER`, `DNA-COMMON-TYPE-SIBLINGS-SAME`,
`DNA-COMMON-TYPE-LEAD-PAGE-ONLY`):

1. **Lồng vào thì nhỏ đi hoặc bằng.** Chữ trong một khối (section, card, ca, phần gập) không bao giờ to hơn tiêu đề của chính khối
   đó, cả cỡ lẫn độ đậm, ở mọi tầng. Một ca có tiêu đề 16 nên tên phần 14/500 và chữ trong phần, câu trích cũng vậy, 14/400: không vượt nó, cũng không vượt tên phần.
2. **Anh em cùng kiểu.** Các khối cùng cấp (các section của một trang, các card của một danh sách, các phần của một ca) dùng cùng
   cỡ và độ đậm cho cùng một vai. Một section cấp 2 của trang Nộp bài to bằng section cấp 2 của trang Cài đặt.
3. **Cỡ lời dẫn chỉ ở cấp trang.** `reading.body` chỉ dành cho lời kể của chính trang, không bao giờ trong section, card, ca hay phần
   gập; trong đó là `body`. Đoạn kể trong section "Vì sao không dùng một transaction" là `body`.
4. **Tối đa bốn tầng chữ.** Thầy chốt ngày 2026-11-28 (phương án D, "chọn D carbon"): một màn hình có tối đa bốn tầng chữ; tiêu đề
   lặp lại tên tab hoặc tên trang thì hạ thành một dòng chú thích (`caption`), không bao giờ chiếm một tầng riêng. Ở tầng sâu nhất
   tiêu đề và thân bài cùng cỡ, khác nhau bằng độ đậm (như Carbon heading-01/body-01, M3 Title Small/Body Medium). Trang ca: tiêu đề
   trang → tên ca 16/500 (`title.section`) → tên phần 14/500 (`label.item`: "Chuyện xảy ra", "Chưa sửa thì hỏng", "Điều kiện",
   "Sửa thế nào", "Kiểm tra", "Trước khi sửa", "Sau khi sửa") → mọi chữ trong phần 14/400 (`body`, câu trích cũng vậy). "Unhappy path ·
   7 trên 7 ca đã qua" lặp tab nên chỉ còn dòng chú thích "7 trên 7 ca đã qua"; accordion giữ tên đầy đủ làm nhãn cho trình đọc màn hình.

Kiểm bằng probe: `node scripts/integration/lesson-type-probe.mjs <đường dẫn bài>` đo mọi trang của bài trên dev và báo mọi chỗ phạm
ba luật ([lessons-audit.md](lessons-audit.md) mục 9). Bài chỉ xong khi probe báo 0.
