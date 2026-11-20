# Projects  (gallery: projects/list, route /projects)
Mục tiêu: học viên Premium thấy các dự án của mình và dự án nào cần làm tiếp.
Thao tác: projects (name, language, stack, repoUrl, provedConceptCount/conceptCount, currentMilestoneId, latestCiStatus, latestCiAt, practisingConceptCount); createProject ở trang Dự án mới. cần API: projects trả số check "cần chứng minh lại" và số dòng CV đã có bằng chứng; xác nhận mặc định PROJECT_FREE_PROJECTS=0 trên mọi môi trường.
Dữ liệu: số liệu minh họa (tên, số tiền, ngày dd/mm/yyyy) nằm trong các khung của pages/25-projects-list.html; trường thật theo các thao tác ở trên.
Trạng thái: các màn đã vẽ: projects/list (Projects, danh sách; 1440 và 390); projects/list-loading (Projects, đang tải; chỉ 390); projects/list-first-visit (Projects, lần đầu; 1440 và 390); projects/list-no-match (Projects, không khớp bộ lọc; chỉ 390); projects/list-error (Projects, lỗi tải; chỉ 390). Trạng thái của bảng PROJECT-GALLERY-6 không vẽ: empty, detail, editing (trang không chạm tới, hoặc chưa được vẽ khi duyệt; thêm khi code nếu trang thật sự chạm tới).
Quyền: học viên Premium thấy các dự án của mình và dự án nào cần làm tiếp.
Grammar: PageHeader, Section kind="figures" ribbon, Tabs kind="filter" có count, SearchField, Section kind="list", ListRow, ProportionBar (tone từng đoạn), Badge. cần Grammar: không có.
Hành động chính: "Tạo dự án".
Lọc: tab ngôn ngữ (TypeScript, Python, Go, C#) và ô tìm theo tên.
Việc đổi: bỏ bảng nhiều cột và dòng "1/1 dự án free"; tiến độ theo check; thêm trạng thái cần chứng minh lại.
Xung đột: Projects chỉ dành cho Premium: origin/dev đã mặc định PROJECT_FREE_PROJECTS=0 và PROJECT_FREE_MILESTONES rỗng (project.config.ts), chỉ cần môi trường deploy không đặt khác; projectCatalog.freeProjects và milestone.free vẫn còn trong schema, giao diện bỏ qua.
