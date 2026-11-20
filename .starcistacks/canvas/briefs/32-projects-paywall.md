# Projects miễn phí  (gallery: projects/paywall, route /projects)
Mục tiêu: tài khoản chưa Premium vào Projects hoặc mở thẳng đường dẫn tạo dự án thì hiểu vì sao nên nâng cấp mà vẫn xem được mình sẽ chứng minh gì.
Thao tác: createProject, mở milestone, explainProjectConcept trả PROJECT_PREMIUM_REQUIRED; projectCatalog vẫn đọc được 10 check. cần API: cờ chỉ đọc cho dự án khi Premium hết hạn (projects/project).
Dữ liệu: số liệu minh họa (tên, số tiền, ngày dd/mm/yyyy) nằm trong các khung của pages/32-projects-paywall.html; trường thật theo các thao tác ở trên.
Trạng thái: các màn đã vẽ: projects/paywall (Projects miễn phí; 1440 và 390); projects/paywall-direct-new-link (Projects miễn phí, mở thẳng đường dẫn Dự án mới; chỉ 390); projects/paywall-expired-read-only (Projects miễn phí, Premium hết hạn, có dự án cũ; chỉ 390). Trạng thái của bảng PROJECT-GALLERY-6 không vẽ: empty, loading, error, no-match, detail, first-visit, editing (trang không chạm tới, hoặc chưa được vẽ khi duyệt; thêm khi code nếu trang thật sự chạm tới).
Quyền: tài khoản chưa Premium vào Projects hoặc mở thẳng đường dẫn tạo dự án thì hiểu vì sao nên nâng cấp mà vẫn xem được mình sẽ chứng minh gì. Trái: tiêu đề và dòng "Dành cho Premium", lời giải thích ngắn và ba cách chứng minh; phải: 10 check xếp theo milestone ở dạng khóa (chỉ tên). Mục Projects ở thanh bên có ổ khóa.
Grammar: PageHeader, Section, Alert (LockedNotice), Section kind="list", ListRow state="unavailable", Button. cần Grammar: không có.
Hành động chính: "Nâng cấp Premium"; "Học Essentials miễn phí" là nút phụ.
Lọc: không có.
Việc đổi: không còn "1/1 dự án free"; cả khu vực khóa với một thông điệp rõ.
Xung đột: không (mặc định trên origin/dev đã là 0 dự án và 0 milestone miễn phí).
