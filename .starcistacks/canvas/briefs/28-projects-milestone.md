# Milestone  (gallery: projects/milestone, route /projects/[projectId]/[milestoneId])
Mục tiêu: khai báo mỗi check nằm ở đâu trong code và probe gọi endpoint nào, rồi chạy probe cho cả nhóm.
Thao tác: projectMilestone (concepts, slots, location, endpoint, sampleBody); setProjectConcept (location dạng path hoặc path#symbol, endpoint METHOD /path, sampleBody JSON nhỏ; lỗi PROJECT_ENDPOINT_INVALID, PROJECT_LOCATION_INVALID); runProjectProbes. cần API: không có.
Dữ liệu: số liệu minh họa (tên, số tiền, ngày dd/mm/yyyy) nằm trong các khung của pages/28-projects-milestone.html; trường thật theo các thao tác ở trên.
Trạng thái: các màn đã vẽ: projects/milestone (Milestone; 1440 và 390); projects/milestone-editing (Milestone, đang sửa vị trí và endpoint; chỉ 390); projects/milestone-no-endpoint (Milestone, chưa khai báo endpoint, nút tắt; chỉ 390); projects/milestone-done (Milestone đã xong; chỉ 390). Trạng thái của bảng PROJECT-GALLERY-6 không vẽ: empty, loading, error, no-match, detail, first-visit (trang không chạm tới, hoặc chưa được vẽ khi duyệt; thêm khi code nếu trang thật sự chạm tới).
Quyền: học viên đã đăng nhập; không có phân quyền riêng ngoài cổng Premium của khu vực (concepts/premium.md).
Grammar: PageHeader, Section kind="figures", Section kind="list", ListRow, Field, Input, Button, Badge. cần Grammar: hàng danh sách mở form sửa tại chỗ (inline edit row).
Hành động chính: "Chạy probe milestone", chỉ dò các check đã khai báo endpoint; chưa có endpoint nào thì nút xám kèm lý do.
Lọc: không cần, mỗi milestone vài check.
Việc đổi: bỏ checklist chỉ để đọc; sửa vị trí và endpoint ngay trên hàng.
Xung đột: không còn milestone miễn phí (PROJECT_FREE_MILESTONES rỗng trên origin/dev), trạng thái locked không dùng.
