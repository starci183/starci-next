# starci-next lessons: bộ tiêu chí audit một bài lab

Thầy chốt ngày 2026-11-28: "chạy agent để phản biện nội dung và sửa lại cho chuẩn, để viết hàng loạt; làm cho trang saga này đi để từ từ
hoàn thiện nội dung dựa vào audit". Mỗi bài lab Essentials được một agent đọc lại theo đúng bộ tiêu chí này. Agent viết báo cáo, thầy
duyệt báo cáo, rồi mới sửa nội dung. Sửa từng đợt, đợt nào cũng có ảnh chụp trang. Luật viết bài nằm ở [lessons.md](lessons.md); file này
chỉ nói cách soi một bài đã viết.

## Người đọc

Một dev backend Việt khoảng 1 năm kinh nghiệm. Biết REST, HTTP status code, transaction trên một database Postgres và Docker cơ bản.
Chưa làm microservice, chưa nghe saga, outbox, idempotency key hay compensation.

## Nguồn agent phải đọc

- Bản ghi bài (seed): `raw/essentials/<khóa>/<bài>/starci-lab.yaml`, `course.yaml`, `_graph/concepts.yaml`.
- Repo lab `starci-next-essential-labs/<bài>/`: comment trong file học viên, gợi ý, ghi chú các bậc, ghi chú repo tham khảo.
- Nhãn UI: `fe/apps/app/src/modules/i18n/messages/vi.json`, các namespace `app.courseLesson`, `app.courseLab`, `app.courseArchitecture`.
- Luật viết bài: [lessons.md](lessons.md).

## 1. Junior theo được không

- Mỗi trang được xếp một mức: dễ / vấp / mất dấu.
- Không dùng khái niệm nào trước khi nó được giới thiệu.
- Không nhảy cóc: mỗi trang chỉ thêm một bước so với trang trước.
- Kiến thức bài ngầm đòi hỏi phải được liệt kê hết. Cái nào junior chưa chắc có thì phải có câu dẫn.
- Một câu không dồn quá một khái niệm mới.

## 2. Thuật ngữ

- Thuật ngữ nào cũng phải có trong `terms` ở lần xuất hiện đầu tiên.
- Mỗi thứ chỉ một tên trên mọi trang: "order service" không lúc là "orders", lúc là "dịch vụ đơn".
- Keyword IT giữ tiếng Anh: users, request, response, retry, commit, rollback, order, wallet, service, frontend, payments.
- Không có "shop", kể cả trong id.
- Tên bài là tên khái niệm, kèm tên tiếng Anh.

## 3. Tiếng Việt tự nhiên

- Không có câu dịch sát: danh hóa, bị động gượng, "thông qua việc", "được thực hiện".
- Viết như dev Việt nói, đối chiếu với Viblo, VNOJ và báo công nghệ.
- Không có "hỏi dồn"; dùng "câu hỏi đào sâu" / "hỏi tiếp".
- Tiền tính bằng VND, viết `1.200.000đ`.
- Câu dài quá khoảng 30 chữ thì tách.
- Đúng chính tả, dấu câu, khoảng trắng.

## 4. Giọng kể và cấu trúc bài

- Giọng thầy mentor, mở bằng một tình huống phỏng vấn.
- Không có bảng spec, không theo khuôn giáo trình.
- Thứ tự trang theo [lessons.md](lessons.md) mục 7.
- Mỗi ca có đủ ba phần: Tình huống, Điều kiện, Kiểm tra. Câu hỏi của ca là Quote mở đầu phần Tình huống.
- Tổng kết nói được ba điều: "Bạn đã làm", "Users được lợi", và câu trả lời mẫu.

## 5. Từng ca Happy/Unhappy path

- Thứ tự ca nối nhau: ca sau dựa trên ca trước, không đòi kiến thức chưa mở.
- Tình huống cụ thể: ai, bao nhiêu tiền, service nào trả gì.
- Mỗi Điều kiện kiểm tra được thật bằng test, không mơ hồ.
- Gợi ý đi từ xa tới gần: gợi ý 1 chỉ hướng, gợi ý 2 chỉ file, lời giải là bước cuối.
- Tên ca nói đúng chuyện xảy ra.

## 6. Khớp giữa chữ và code

- Mọi tên trong chữ (file, endpoint, status code, bảng, port, service) phải có thật trong repo lab.
- Comment trong file học viên cùng giọng, cùng thuật ngữ với trang.
- Ghi chú repo tham khảo phải đọc từ chính các file được liệt kê.
- Diagram và chữ ở trang Kiến trúc khớp nhau: số service, database, thứ tự request.

## 7. Nhãn UI

- Nhãn, nút, tiêu đề tự nhiên; không dịch sát từ tiếng Anh.
- Nút bắt đầu bằng động từ, 1–4 chữ.
- Cùng một hành động thì cùng một chữ ở mọi trang.

## 8. Báo cáo

- Mỗi chỗ vấp phải có câu gốc (trích nguyên văn), lý do, và câu sửa dán được ngay.
- Mỗi chỗ vấp được gắn một nhãn: `lint` nếu script bắt được (thiếu term, chữ cấm, câu dài, định dạng tiền, tên lệch), `biên tập` nếu cần người đọc.
- Cuối báo cáo: 5 chỗ nên sửa nhất, xếp theo tác động.
- Những luật gắn `lint` gặp lại ở nhiều bài thì thành script kiểm trước khi push ([lessons.md](lessons.md) mục 6).
