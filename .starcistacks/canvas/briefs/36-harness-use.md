# Xài  (gallery: harness/use, route /harness/use)
Mục tiêu: chọn công cụ (Claude Code hoặc Codex), xem máy mình đạt hay trượt từng mục và đọc hướng dẫn.
Thao tác: harnessGuides(tool); harnessDoctor(tool) trả probes (passed, failed, skipped, invalid, not-run kèm reason, fix, guide) và passed/total; harnessTrials (bẫy, shortcut agent đã thử, blocked, verdict). cần API: không có.
Dữ liệu: số liệu minh họa (tên, số tiền, ngày dd/mm/yyyy) nằm trong các khung của pages/36-harness-use.html; trường thật theo các thao tác ở trên.
Trạng thái: các màn đã vẽ: harness/use (Xài, Claude Code; 1440 và 390); harness/use-codex-no-doctor (Xài, Codex, chưa chạy doctor; 1440 và 390); harness/use-loading (Xài, đang tải; chỉ 390); harness/use-error (Xài, lỗi tải; chỉ 390). Trạng thái của bảng PROJECT-GALLERY-6 không vẽ: empty, no-match, detail, first-visit, editing (trang không chạm tới, hoặc chưa được vẽ khi duyệt; thêm khi code nếu trang thật sự chạm tới).
Quyền: học viên đã đăng nhập; không có phân quyền riêng ngoài cổng Premium của khu vực (concepts/premium.md).
Grammar: PageHeader, Tabs, Select (compact, chọn công cụ), Section kind="list", ListRow, Switch, CopyField, DataTable, Badge. cần Grammar: không có.
Hành động chính: "Chép lệnh doctor".
Lọc: Select công cụ, công tắc "Chỉ hiện mục chưa đạt".
Việc đổi: mục trượt chỉ thẳng bài sửa.
Xung đột: doctor và trial chạy trên máy học viên, CLI chỉ gửi kết quả, không gửi nội dung file.
