# Tự áp dụng  (gallery: essentials/lesson-ladder, route /essentials/[topic]/[lesson]?part=apply)
Mục tiêu: tự áp dụng điều đã học qua bốn mức Dễ, Vừa, Khó, Siêu khó; mỗi mức chỉ mở khi mức dưới đạt.
Thao tác: lesson(id).essential.challenges (level, title, brief, rubric với points và isCritical, hiddenScenarios, questions); lệnh starci-next run --challenge chạy test ẩn qua relay (lỗi RELAY_CHALLENGE_LOCKED khi mức dưới chưa đạt); submitLessonAttempt cho câu chốt thiết kế; lessonProgress.outcomes (understood, proved). cần API: điểm thang 100 theo rubric cho mỗi lần chạy challenge (lessonScenarioRuns hiện có challengeTier, chưa có điểm từng mục); trạng thái "Đã chứng minh" của bài từ CI OIDC.
Dữ liệu: số liệu minh họa (tên, số tiền, ngày dd/mm/yyyy) nằm trong các khung của pages/23-essentials-lesson-ladder.html; trường thật theo các thao tác ở trên.
Trạng thái: các màn đã vẽ: essentials/lesson-ladder (Tự áp dụng, mức Vừa đang luyện; 1440 và 390); essentials/lesson-ladder-hard-locked (Tự áp dụng, mức Khó còn khóa; chỉ 390). Trạng thái của bảng PROJECT-GALLERY-6 không vẽ: empty, loading, error, no-match, detail, first-visit, editing (trang không chạm tới, hoặc chưa được vẽ khi duyệt; thêm khi code nếu trang thật sự chạm tới).
Quyền: Thanh đầu bài chung (tab Tự áp dụng 1/4); thang bốn hàng phẳng, mức đang làm tô xám, hai mức sau ghi "Mở sau khi xong mức trước" kèm ổ khóa; dưới là chi tiết mức đang chọn: terminal, thang điểm từng mục xanh/đỏ có điểm (tổng 70/100 khớp 20+35+15), chuỗi từ chạy ẩn tới "Đã chứng minh".
Grammar: Tabs, Section kind="list", ListRow (value + badges + verdict cho từng mục chấm), Badge, Progress, Stepper. cần Grammar: không có.
Hành động chính: "Chạy lại mức Vừa".
Lọc: không có.
Việc đổi: học viên chỉ đạo AI viết code, không gõ; "Đang luyện" khi chạy trên máy, "Đã chứng minh" chỉ khi CI có OIDC của GitHub, rồi thành dòng xác minh trên hồ sơ.
Xung đột: backend mở mức kế khi mọi kịch bản ẩn của mức dưới xanh; bản vẽ giả định ngưỡng 80/100 và đạt mục trọng yếu (chờ chủ sản phẩm chốt).
