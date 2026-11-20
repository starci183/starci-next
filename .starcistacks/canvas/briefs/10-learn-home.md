# Học  (gallery: learn/home, route /)
Mục tiêu: mở app là biết làm gì tiếp và thấy tiến độ ba khu vực Essentials, Projects, Harness.
Thao tác: Đọc learnerHub (today, streak, shards, activePath), streak, myPremium (isPremium, premiumUntil) và relayDevices cho dòng máy; lệnh duy nhất trên trang là setStreakGoal (đổi mục tiêu tuần). cần API: learnerHub trả shard harness và bỏ incidents; learnerHub.nextUp (bài đang dở, phần của bài, kết quả lần chạy CLI gần nhất).
Dữ liệu: số liệu minh họa (tên, số tiền, ngày dd/mm/yyyy) nằm trong các khung của pages/10-learn-home.html; trường thật theo các thao tác ở trên.
Trạng thái: các màn đã vẽ: learn/home (Học, đã đăng nhập, chưa Premium; 1440 và 390); learn/home-first-visit (Học, lần đầu; 1440 và 390); learn/home-loading (Học, đang tải; chỉ 390); learn/home-one-area-failed (Học, một khu vực không đọc được; chỉ 390); learn/home-has-premium (Học, đã có Premium; chỉ 390); learn/home-nav-open (Học, menu điều hướng mở; chỉ 390); learn/home-avatar-menu (Học, menu avatar; chỉ 390). Trạng thái của bảng PROJECT-GALLERY-6 không vẽ: empty, error, no-match, detail, editing (trang không chạm tới, hoặc chưa được vẽ khi duyệt; thêm khi code nếu trang thật sự chạm tới).
Quyền: Đọc learnerHub (today, streak, shards, activePath), streak, myPremium (isPremium, premiumUntil) và relayDevices cho dòng máy; lệnh duy nhất trên trang là setStreakGoal (đổi mục tiêu tuần). Menu avatar mở Premium, Máy của bạn, Hồ sơ, Đăng xuất.
Grammar: WorkspaceShell, TopBar + IdentityLockup, Sidebar, PageHeader, Section kind="figures" ribbon, Section kind="list", Stepper, Progress, DropdownMenu, Drawer. cần Grammar: không có.
Hành động chính: "Làm tiếp kịch bản" trỏ đúng việc tiếp theo; lần đầu đổi thành "Bắt đầu với Harness".
Lọc: không có.
Việc đổi: bỏ sáu thẻ phần học cũ và Sự cố; "Lộ trình đang theo" thành "Việc tiếp theo" lấy theo bài đang dở; Projects hiện khóa kèm đường tới Premium thay vì ẩn.
Xung đột: learnerHub trên origin/dev trả shard essentials, practice, projects, incidents, review (chưa có harness, còn incidents) và layer mission trỏ /paths/choose; bản vẽ bỏ incidents và paths. Số liệu chỉ minh họa.
