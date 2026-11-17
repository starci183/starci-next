# Hướng dẫn Xài  (gallery: harness/guide, route /harness/use/[tool]/[guide])
Mục tiêu: đọc một hướng dẫn của công cụ đã chọn rồi kiểm tra đúng mục liên quan.
Thao tác: harnessGuide(tool, slug) trả sections (title, body markdown, run) và probes của bài; harnessGuides cho danh sách và Bài trước/Bài tiếp. cần API: markHarnessGuideRead và cờ isRead trong harnessGuides.
Dữ liệu: số liệu minh họa (tên, số tiền, ngày dd/mm/yyyy) nằm trong các khung của pages/37-harness-guide.html; trường thật theo các thao tác ở trên.
Trạng thái: các màn đã vẽ: harness/guide (Hướng dẫn Xài; 1440 và 390); harness/guide-not-found (Hướng dẫn Xài, không tìm thấy bài; 1440 và 390). Trạng thái của bảng PROJECT-GALLERY-6 không vẽ: empty, loading, error, no-match, detail, first-visit, editing (trang không chạm tới, hoặc chưa được vẽ khi duyệt; thêm khi code nếu trang thật sự chạm tới).
Quyền: học viên đã đăng nhập; không có phân quyền riêng ngoài cổng Premium của khu vực (concepts/premium.md).
Grammar: MarkdownArticle, Section kind="list", ListRow, Alert, Pagination, CopyField, Badge. cần Grammar: không có.
Hành động chính: không có (trang đọc).
Lọc: không có.
Việc đổi: gắn kiểm tra vào đúng bài.
Xung đột: bài không có cho công cụ đang chọn thì báo "Không tìm thấy".
