# Docs  (gallery: harness/docs, route /harness/docs)
Mục tiêu: tra và đọc tài liệu đầy đủ của StarCi harness.
Thao tác: harnessDocs trả slug, order, title, summary, minutes. cần API: markHarnessDocRead và cờ isRead trong harnessDocs; searchHarnessDocs nếu muốn tìm trong nội dung.
Dữ liệu: số liệu minh họa (tên, số tiền, ngày dd/mm/yyyy) nằm trong các khung của pages/38-harness-docs.html; trường thật theo các thao tác ở trên.
Trạng thái: các màn đã vẽ: harness/docs (Docs, mục lục; 1440 và 390); harness/docs-no-match (Docs, lọc không khớp; 1440 và 390); harness/docs-error (Docs, lỗi tải; chỉ 390). Trạng thái của bảng PROJECT-GALLERY-6 không vẽ: empty, loading, detail, first-visit, editing (trang không chạm tới, hoặc chưa được vẽ khi duyệt; thêm khi code nếu trang thật sự chạm tới).
Quyền: học viên đã đăng nhập; không có phân quyền riêng ngoài cổng Premium của khu vực (concepts/premium.md).
Grammar: PageHeader, Tabs, Section kind="list", ListRow, SearchField, Badge, EmptyNotice. cần Grammar: không có.
Hành động chính: "Đọc tiếp" tới bài chưa đọc đầu tiên ("Đọc từ bài đầu" khi chưa đọc bài nào).
Lọc: ô lọc theo tên chạy ở trình duyệt (12 bài); không khớp thì báo rõ kèm "Xóa bộ lọc".
Việc đổi: bỏ nhóm giả, theo đúng thứ tự backend.
Xung đột: không.
