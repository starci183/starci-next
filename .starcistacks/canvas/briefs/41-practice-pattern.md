# Pattern  (gallery: practice/pattern, route /practice/patterns/[patternId])
Mục tiêu: chọn bài trong một pattern.
Thao tác: practiceProblems (thứ tự, tên, độ khó, nhãn, status: chưa làm, đã nộp chưa qua, Accepted) và tiến độ từ practicePatterns. cần API: practicePatternIntro (đoạn "Khi nào dùng"; hiện pattern chỉ có tên).
Dữ liệu: số liệu minh họa (tên, số tiền, ngày dd/mm/yyyy) nằm trong các khung của pages/41-practice-pattern.html; trường thật theo các thao tác ở trên.
Trạng thái: các màn đã vẽ: practice/pattern (Pattern, các bài; 1440 và 390); practice/pattern-first-visit (Pattern, lần đầu; chỉ 390); practice/pattern-empty (Pattern chưa có bài; chỉ 390); practice/pattern-error (Pattern, lỗi tải; chỉ 390); practice/pattern-loading (Pattern, đang tải; chỉ 390). Trạng thái của bảng PROJECT-GALLERY-6 không vẽ: no-match, detail, editing (trang không chạm tới, hoặc chưa được vẽ khi duyệt; thêm khi code nếu trang thật sự chạm tới).
Quyền: học viên đã đăng nhập; không có phân quyền riêng ngoài cổng Premium của khu vực (concepts/premium.md).
Grammar: PageHeader, Breadcrumbs, Section kind="list", ListRow, Badge isDot, Progress. cần Grammar: không có.
Hành động chính: "Làm bài tiếp theo"; lần đầu "Làm bài đầu tiên".
Lọc: không cần, mỗi pattern vài bài.
Việc đổi: nhãn không còn bị cắt, bỏ năm nút "Giải bài" lặp, cả hàng là liên kết.
Xung đột: không.
