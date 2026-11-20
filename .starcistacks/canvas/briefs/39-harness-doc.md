# Bài Docs  (gallery: harness/doc, route /harness/docs/[doc])
Mục tiêu: đọc một bài liền mạch rồi sang bài kế.
Thao tác: harnessDoc(slug) trả sections (title, body markdown, run); harnessDocs cho mục lục và Bài trước/Bài tiếp. cần API: markHarnessDocRead (ghi nhận đã đọc khi cuộn tới cuối bài).
Dữ liệu: số liệu minh họa (tên, số tiền, ngày dd/mm/yyyy) nằm trong các khung của pages/39-harness-doc.html; trường thật theo các thao tác ở trên.
Trạng thái: các màn đã vẽ: harness/doc (Bài Docs; 1440 và 390); harness/doc-not-found (Bài Docs, không tìm thấy bài; 1440 và 390). Trạng thái của bảng PROJECT-GALLERY-6 không vẽ: empty, loading, error, no-match, detail, first-visit, editing (trang không chạm tới, hoặc chưa được vẽ khi duyệt; thêm khi code nếu trang thật sự chạm tới).
Quyền: học viên đã đăng nhập; không có phân quyền riêng ngoài cổng Premium của khu vực (concepts/premium.md).
Grammar: MarkdownArticle, Section kind="list", ListRow, Alert, Pagination. cần Grammar: TableOfContents (mục lục trong bài, theo dõi đề mục đang đọc).
Hành động chính: không có (trang đọc).
Lọc: không có.
Việc đổi: chữ to, nhiều khoảng trắng, có mục lục trong bài.
Xung đột: bài có thể bị gộp hoặc đổi tên, liên kết cũ báo "Không tìm thấy".
