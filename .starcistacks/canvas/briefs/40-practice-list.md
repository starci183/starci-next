# Luyện code  (gallery: practice/list, route /practice)
Mục tiêu: chọn một pattern rồi vào làm bài.
Thao tác: practicePatterns (patternId, title, problemCount, acceptedCount) và practiceReadiness (số bài Accepted cho mức sẵn sàng đi làm). Luyện code miễn phí cho mọi học viên. cần API: bỏ khóa Luyện code khỏi practicePatterns; practiceNext (bài kế và bài đang dở).
Dữ liệu: số liệu minh họa (tên, số tiền, ngày dd/mm/yyyy) nằm trong các khung của pages/40-practice-list.html; trường thật theo các thao tác ở trên.
Trạng thái: các màn đã vẽ: practice/list (Luyện code, danh sách; 1440 và 390); practice/list-first-visit (Luyện code, lần đầu; chỉ 390); practice/list-error (Luyện code, lỗi tải; chỉ 390); practice/list-loading (Luyện code, đang tải; chỉ 390); practice/list-no-match (Luyện code, không khớp bộ lọc; chỉ 390). Trạng thái của bảng PROJECT-GALLERY-6 không vẽ: empty, detail, editing (trang không chạm tới, hoặc chưa được vẽ khi duyệt; thêm khi code nếu trang thật sự chạm tới).
Quyền: Luyện code miễn phí cho mọi học viên.
Grammar: PageHeader, Section kind="list" có filter, ListRow (detail chứa Meter), Tabs kind="filter", SearchField. cần Grammar: không có.
Hành động chính: "Làm bài tiếp theo" (bài chưa Accepted đầu tiên); lần đầu "Bắt đầu với Mảng".
Lọc: ô tìm và Tabs kind="filter" theo trạng thái có đếm.
Việc đổi: bỏ nút "Mở pattern" lặp 20 lần, thêm lọc và tiến độ trên hàng, nút chính lên dải đầu.
Xung đột: practicePatterns còn locked và freeCount; Luyện code miễn phí nên giao diện bỏ qua và không có chip Premium.
