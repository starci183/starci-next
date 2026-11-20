# Kinh nghiệm  (gallery: career/experience, route /experience)
Mục tiêu: biến phần đã học thành dòng CV có chữ ký, theo dõi từng mục tới khi thầy ký.
Thao tác: myExperience (state: practising, ai-graded, pending-review, verified, returned, revoked; itemType, part, subject, line vi/en, draftLine, evidence, grade, defenseQuestions, returnNote, dueAt, verificationCode), submitExperience, showExperience, revokeExperience; phía thầy decideExperience (không vẽ ở đây). cần API: assignExperience nhận part "practice" khi Accepted cả nhóm bài của một pattern (nếu chủ sản phẩm đồng ý).
Dữ liệu: số liệu minh họa (tên, số tiền, ngày dd/mm/yyyy) nằm trong các khung của pages/48-career-experience.html; trường thật theo các thao tác ở trên.
Trạng thái: các màn đã vẽ: career/experience (Kinh nghiệm, danh sách; 1440 và 390); career/experience-first-visit (Kinh nghiệm, lần đầu; chỉ 390); career/experience-empty-tab (Kinh nghiệm, tab không có mục; chỉ 390); career/experience-confirm-send-teacher (Kinh nghiệm, gửi thầy, xác nhận; chỉ 390); career/experience-error (Kinh nghiệm, lỗi tải; chỉ 390); career/experience-loading (Kinh nghiệm, đang tải; chỉ 390). Trạng thái của bảng PROJECT-GALLERY-6 không vẽ: empty, no-match, detail, editing (trang không chạm tới, hoặc chưa được vẽ khi duyệt; thêm khi code nếu trang thật sự chạm tới).
Quyền: không ở dải đầu; trong mục AI đã chấm là "Gửi thầy duyệt" (xác nhận trước khi gửi vì gửi xong khóa dòng CV).
Grammar: PageHeader, Breadcrumbs, Tabs kind="filter" có count, ChoiceChips, SurfaceCard, Badge, Switch, Input, Stepper, Alert, AlertDialog. cần Grammar: không có.
Hành động chính: không ở dải đầu; trong mục AI đã chấm là "Gửi thầy duyệt" (xác nhận trước khi gửi vì gửi xong khóa dòng CV).
Lọc: tab trạng thái, chip nguồn (Essentials, Projects, Harness, Luyện code).
Việc đổi: tiêu đề là tên trang thay vì câu dài; trạng thái rỗng có chỉ dẫn và nút.
Xung đột: nguồn Luyện code chưa có ở backend; có tính vào kinh nghiệm hay không chờ chủ sản phẩm chốt.
