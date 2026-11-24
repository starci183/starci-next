# Harness  (gallery: harness/hub, route /harness)
Mục tiêu: khu miễn phí đứng riêng, không cần Essentials hay Projects; thấy ba phần (Build, Xài, Docs) và tiến độ của mình.
Thao tác: harnessHub trả các phần (key, title, summary, total, practising, proved, done, nextId). cần API: harnessHub trả số bài Docs đã đọc và bài đọc kế tiếp (cần markHarnessDocRead).
Dữ liệu: số liệu minh họa (tên, số tiền, ngày dd/mm/yyyy) nằm trong các khung của pages/33-harness-hub.html; trường thật theo các thao tác ở trên.
Trạng thái: các màn đã vẽ: harness/hub (Harness, tổng quan; 1440 và 390); harness/hub-first-visit (Harness, lần đầu, chưa có tiến độ; 1440 và 390); harness/hub-loading (Harness, đang tải; chỉ 390); harness/hub-error (Harness, lỗi tải; chỉ 390). Trạng thái của bảng PROJECT-GALLERY-6 không vẽ: empty, no-match, detail, editing (trang không chạm tới, hoặc chưa được vẽ khi duyệt; thêm khi code nếu trang thật sự chạm tới).
Quyền: khu miễn phí đứng riêng, không cần Essentials hay Projects; thấy ba phần (Build, Xài, Docs) và tiến độ của mình.
Grammar: PageHeader, Tabs có count, Section kind="figures" ribbon, Section kind="list", ListRow, Badge, Select (compact, chọn công cụ). cần Grammar: không có.
Hành động chính: "Tiếp tục build dở" tới nextId của Build; lần đầu "Bắt đầu build đầu tiên".
Lọc: không có.
Việc đổi: lấy tiến độ làm trọng tâm thay vì thẻ lớn cho từng phần. "Đang luyện" là e2e xanh trên máy, "Đã chứng minh" là xanh trên CI của repo đã nối.
Xung đột: không cần Premium; công cụ chỉ Claude Code và Codex.
