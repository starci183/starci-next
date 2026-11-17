# CV preview  (gallery: projects/cv, route /projects/[projectId]/cv)
Mục tiêu: thấy check đã chứng minh thành dòng CV nào và thiếu gì để có thêm dòng.
Thao tác: projectCvPreview(projectId) trả text, evidence, proved, subjectKind, subjectId; provedProjectConcepts cho ngày chứng minh. cần API: projectCvPreview trả dòng CV hai ngôn ngữ; liên kết CV công khai để nhà tuyển dụng xem run CI và probe (publicProjectCv).
Dữ liệu: số liệu minh họa (tên, số tiền, ngày dd/mm/yyyy) nằm trong các khung của pages/31-projects-cv.html; trường thật theo các thao tác ở trên.
Trạng thái: các màn đã vẽ: projects/cv (CV preview; 1440 và 390); projects/cv-empty (CV preview, chưa có dòng nào; chỉ 390); projects/cv-english (CV preview, English; chỉ 390); projects/cv-loading (CV preview, đang tải; chỉ 390). Trạng thái của bảng PROJECT-GALLERY-6 không vẽ: error, no-match, detail, first-visit, editing (trang không chạm tới, hoặc chưa được vẽ khi duyệt; thêm khi code nếu trang thật sự chạm tới).
Quyền: học viên đã đăng nhập; không có phân quyền riêng ngoài cổng Premium của khu vực (concepts/premium.md).
Grammar: PageHeader, Segmented (RadioGroup), SurfaceCard cho tờ CV, Section kind="list", ListRow, Badge. cần Grammar: không có.
Hành động chính: "Sao chép CV".
Lọc: chọn một dự án hoặc gộp tất cả.
Việc đổi: thấy nguồn bằng chứng từng dòng và cả dòng còn thiếu.
Xung đột: check "cần chứng minh lại" rời CV tới khi chứng minh lại (giả định).
