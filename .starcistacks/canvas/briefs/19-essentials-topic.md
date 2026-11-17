# Chủ đề  (gallery: essentials/topic, route /essentials/[topic])
Mục tiêu: xem các bài của một chủ đề theo thứ tự nên học và còn bao nhiêu bài là xong.
Thao tác: lessonTopic(id) trả title, description, prerequisites, related và path (thứ tự bài); lessons(topic) cho từng bài; lessonProgress và lessonOpenerScores cho tiến độ. cần API: như danh mục: tiến độ 4 phần trả kèm danh sách bài.
Dữ liệu: số liệu minh họa (tên, số tiền, ngày dd/mm/yyyy) nằm trong các khung của pages/19-essentials-topic.html; trường thật theo các thao tác ở trên.
Trạng thái: các màn đã vẽ: essentials/topic (Chủ đề, Hệ thống phân tán; 1440 và 390); essentials/topic-first-visit (Chủ đề, lần đầu vào chủ đề; chỉ 390); essentials/topic-free-account (Chủ đề, tài khoản miễn phí; chỉ 390); essentials/topic-loading (Chủ đề, đang tải; chỉ 390). Trạng thái của bảng PROJECT-GALLERY-6 không vẽ: empty, error, no-match, detail, editing (trang không chạm tới, hoặc chưa được vẽ khi duyệt; thêm khi code nếu trang thật sự chạm tới).
Quyền: Cột phải (chỉ 1440): chủ đề dạy gì, 4 phần của mỗi bài, bài nên học trước (prerequisites), phần 2–4 cần Premium. "Học tiếp" (phần đang dở); lần đầu "Bắt đầu bài 1"; tài khoản miễn phí "Học tiếp phần 1".
Grammar: Breadcrumbs, PageHeader, Progress, Section kind="list", ListRow, Badge, Alert. cần Grammar: Meter nấc "đang làm" (như danh mục).
Hành động chính: "Học tiếp" (phần đang dở); lần đầu "Bắt đầu bài 1"; tài khoản miễn phí "Học tiếp phần 1".
Lọc: không cần, mỗi chủ đề vài bài.
Việc đổi: tiến độ tính theo bài cụm; bài nên học trước lấy từ prerequisites.
Xung đột: không.
