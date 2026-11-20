# Phiên ôn  (gallery: review/session, route /review/session)
Mục tiêu: nhớ lại trước, xem đáp án sau, tự chấm.
Thao tác: reviewQueue hoặc reviewItem lấy thẻ; submitReviewRetrieval lưu điều học viên nhớ (kèm revision); flipReviewCard trả đáp án và khoảng hẹn cho bốn mức (again, hard, good, easy); thẻ điền chỗ trống dùng checkReviewCloze; gradeReviewCard(grade, revision) chống chấm trùng và trả remainingToday cùng ngày ôn kế. cần API: không có.
Dữ liệu: số liệu minh họa (tên, số tiền, ngày dd/mm/yyyy) nằm trong các khung của pages/46-review-session.html; trường thật theo các thao tác ở trên.
Trạng thái: các màn đã vẽ: review/session (Phiên ôn, câu hỏi; 1440 và 390); review/session-answer-and-grade (Phiên ôn, đáp án và chấm; 1440 và 390); review/session-fill-blank (Phiên ôn, điền chỗ trống; chỉ 390); review/session-summary (Phiên ôn, tổng kết; 1440 và 390); review/session-empty (Phiên ôn, không có thẻ; chỉ 390); review/session-grading-conflict (Phiên ôn, xung đột chấm; chỉ 390); review/session-loading (Phiên ôn, đang tải; chỉ 390). Trạng thái của bảng PROJECT-GALLERY-6 không vẽ: error, no-match, detail, first-visit, editing (trang không chạm tới, hoặc chưa được vẽ khi duyệt; thêm khi code nếu trang thật sự chạm tới).
Quyền: học viên đã đăng nhập; không có phân quyền riêng ngoài cổng Premium của khu vực (concepts/premium.md).
Grammar: PageHeader, Breadcrumbs, SurfaceCard, Textarea, ButtonGroup, Kbd, Progress, Alert. cần Grammar: hàng bốn nút chấm có khoảng hẹn dưới mỗi nút (GradeButtons).
Hành động chính: bước 1 "Hiện đáp án"; bước 2 "Tốt" (lựa chọn mặc định); tổng kết "Về Ôn tập".
Lọc: không có.
Việc đổi: trạng thái rỗng có lệnh đi tiếp, bộ đếm có nhãn, thấy khoảng hẹn trước khi chấm; đúng/sai có biểu tượng, không chỉ bằng màu.
Xung đột: chấm ở máy khác làm lệch revision: báo xung đột và tải lại thẻ.
