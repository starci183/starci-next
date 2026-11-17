# Tiến độ  (gallery: progress/overview, route /progress)
Mục tiêu: một chỗ xem mình tới đâu ở mọi khu vực và nhảy vào khu vực đó.
Thao tác: learnerProgress (ribbon: provedConcepts, streak, lessonsDone, buildsDone; essentials với parts, topics, câu mở bài trước/sau; harness với builds, doctor, trials; projects, projectsLocked; review: due, overdue, doneToday, goalDaily, streak, longestStreak; activity; unavailable khi một nguồn không đọc được). cần API: learnerProgress.practice (số Accepted, tổng bài, tiến độ từng pattern).
Dữ liệu: số liệu minh họa (tên, số tiền, ngày dd/mm/yyyy) nằm trong các khung của pages/49-progress-overview.html; trường thật theo các thao tác ở trên.
Trạng thái: các màn đã vẽ: progress/overview (Tiến độ, đã Premium; 1440 và 390); progress/overview-free (Tiến độ, chưa Premium; chỉ 390); progress/overview-first-visit (Tiến độ, lần đầu; chỉ 390); progress/overview-one-source-error (Tiến độ, một nguồn lỗi; chỉ 390); progress/overview-page-error (Tiến độ, cả trang lỗi; chỉ 390); progress/overview-loading (Tiến độ, đang tải; chỉ 390). Trạng thái của bảng PROJECT-GALLERY-6 không vẽ: empty, no-match, detail, editing (trang không chạm tới, hoặc chưa được vẽ khi duyệt; thêm khi code nếu trang thật sự chạm tới).
Quyền: học viên đã đăng nhập; không có phân quyền riêng ngoài cổng Premium của khu vực (concepts/premium.md).
Grammar: PageHeader, Breadcrumbs, Section kind="figures", Section kind="list", ListRow, Progress, Timeline, Alert. cần Grammar: không có.
Hành động chính: không có (trang chỉ để xem).
Lọc: không có.
Việc đổi: vào từ Hồ sơ ("Xem tiến độ") và từ Học, không có mục riêng ở thanh bên. Chưa Premium: phần 2–4 của Essentials ghi "Cần Premium", Projects là một hàng lời mời, còn lại đầy đủ.
Xung đột: chuỗi ngày không bao giờ vào dòng CV; chỉ check đã chứng minh qua CI mới tính.
