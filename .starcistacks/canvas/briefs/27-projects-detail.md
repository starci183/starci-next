# Chi tiết dự án  (gallery: projects/detail, route /projects/[projectId])
Mục tiêu: thấy cả 10 check của dự án đang ở đâu và nên làm gì tiếp.
Thao tác: project(id) (provedConceptCount, milestones với state, lastCiRun, lastProbeRun, deployedUrl); updateProject lưu deployedUrl; runProjectProbes chạy probe địa chỉ deploy (tối đa 6 lượt mỗi giờ). cần API: trạng thái check "cần chứng minh lại" (project trả regressed khi kết quả mới nhất rớt sau khi từng đạt).
Dữ liệu: số liệu minh họa (tên, số tiền, ngày dd/mm/yyyy) nằm trong các khung của pages/27-projects-detail.html; trường thật theo các thao tác ở trên.
Trạng thái: các màn đã vẽ: projects/detail (Chi tiết dự án; 1440 và 390); projects/detail-loading (Chi tiết dự án, đang tải; chỉ 390); projects/detail-repo-not-connected (Chi tiết dự án, chưa kết nối repo, lần đầu; chỉ 390); projects/detail-sixty-checks-collapsed (Chi tiết dự án, 60 check, milestone gập; 1440 và 390); projects/detail-probe-error-over-limit (Chi tiết dự án, probe lỗi, quá lượt; chỉ 390). Trạng thái của bảng PROJECT-GALLERY-6 không vẽ: empty, error, no-match, detail, first-visit, editing (trang không chạm tới, hoặc chưa được vẽ khi duyệt; thêm khi code nếu trang thật sự chạm tới).
Quyền: học viên đã đăng nhập; không có phân quyền riêng ngoài cổng Premium của khu vực (concepts/premium.md).
Grammar: PageHeader, Section kind="figures", Tabs kind="filter", Accordion, Section kind="list", ListRow, Badge isDot, ProportionBar, Input. cần Grammar: không có.
Hành động chính: "Chạy probe"; chưa kết nối repo thì thành "Kết nối repo".
Lọc: tab trạng thái và ô tìm; milestone đã xong tự gập.
Việc đổi: hiển thị check thay concept; thêm trạng thái cần chứng minh lại.
Xung đột: backend chỉ có ConceptState todo, practising, proved.
