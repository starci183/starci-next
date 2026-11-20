# Build  (gallery: harness/builds, route /harness/build)
Mục tiêu: chọn một bản build trong 5 (chatbot có MCP server và vòng lặp tool, agent đọc ghi file an toàn, MCP server riêng, chatbot CSKH nhớ ngữ cảnh, agent hỏi duyệt).
Thao tác: harnessBuilds trả id, title, summary, keys (key AI cần), stageCount, practisingStages, provedStages, state (none, practising, proved). cần API: không có.
Dữ liệu: số liệu minh họa (tên, số tiền, ngày dd/mm/yyyy) nằm trong các khung của pages/34-harness-builds.html; trường thật theo các thao tác ở trên.
Trạng thái: các màn đã vẽ: harness/builds (Build, danh sách; 1440 và 390); harness/builds-empty (Build, chưa có bản build nào; 1440 và 390); harness/builds-error (Build, lỗi tải; chỉ 390). Trạng thái của bảng PROJECT-GALLERY-6 không vẽ: loading, no-match, detail, first-visit, editing (trang không chạm tới, hoặc chưa được vẽ khi duyệt; thêm khi code nếu trang thật sự chạm tới).
Quyền: học viên đã đăng nhập; không có phân quyền riêng ngoài cổng Premium của khu vực (concepts/premium.md).
Grammar: PageHeader, Tabs, DataTable, ChoiceChips, Badge, EmptyNotice. cần Grammar: không có.
Hành động chính: "Tiếp tục bản đang luyện"; chưa có bản nào thì xám kèm lý do.
Lọc: chip trạng thái, lọc ở trình duyệt vì chỉ 5 mục; ở 390 chip cuộn ngang.
Việc đổi: bảng thay thẻ, nói rõ chặng nào đã chứng minh.
Xung đột: danh sách build do admin nhập (harness import), học viên chỉ đọc.
