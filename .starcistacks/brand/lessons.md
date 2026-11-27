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

## 7. Các trang của bài và cách vẽ

- Thứ tự trang: Giới thiệu → Cài đặt → Đơn bình thường → Kiến trúc → Khi có sự cố → Tổng kết → Nộp bài. Kiến trúc đứng sau
  khi học viên đã chạy hệ thống xanh và trước các ca sự cố. (2026-11-27: "kiến trúc sau cài đặt và trước khi có sự cố".)
- Trang Kiến trúc là trang tĩnh, chỉ giải thích: nghiệp vụ (luồng một đơn bằng từ nghiệp vụ), kiến trúc (sơ đồ Mermaid sinh
  từ source), vì sao cách làm thường không đủ (ví dụ: không có transaction bao trọn các database), và code (file học viên
  sửa nằm ở đâu, trích đoạn tô màu Shiki). Không nút bấm, không trạng thái ca. (2026-11-27: "chỉ phân tích bối cảnh, giải
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
