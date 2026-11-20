# Dự án mới  (gallery: projects/new, route /projects/new)
Mục tiêu: đặt tên, chọn ngôn ngữ, dán repo và tạo dự án.
Thao tác: createProject (name, kind app hoặc agent, language, stack, repoUrl tùy chọn, track khi là agent) trả ciSecret đúng một lần nên màn hình chuyển thẳng sang Kết nối repo; repo nhập sau được bằng setProjectRepository. cần API: createProject nhận language là enum bốn ngôn ngữ.
Dữ liệu: số liệu minh họa (tên, số tiền, ngày dd/mm/yyyy) nằm trong các khung của pages/26-projects-new.html; trường thật theo các thao tác ở trên.
Trạng thái: các màn đã vẽ: projects/new (Dự án mới, form trống; 1440 và 390); projects/new-ready (Dự án mới, đã điền, sẵn sàng; chỉ 390); projects/new-creating (Dự án mới, đang tạo; chỉ 390); projects/new-repo-invalid (Dự án mới, repo sai dạng; chỉ 390); projects/new-create-error (Dự án mới, tạo lỗi; chỉ 390). Trạng thái của bảng PROJECT-GALLERY-6 không vẽ: empty, loading, no-match, detail, first-visit, editing (trang không chạm tới, hoặc chưa được vẽ khi duyệt; thêm khi code nếu trang thật sự chạm tới).
Quyền: học viên đã đăng nhập; không có phân quyền riêng ngoài cổng Premium của khu vực (concepts/premium.md).
Grammar: Form, Field, Input, ChoiceChips, Segmented (RadioGroup), Button có disabledReason, Alert. cần Grammar: không có.
Hành động chính: "Tạo dự án", xám khi thiếu tên hoặc ngôn ngữ, dưới nút luôn có lý do bằng lời.
Lọc: không có.
Việc đổi: ngôn ngữ chọn bằng bốn chip thay ô chữ tự do; bỏ ô chủ đề; báo trước cách nhận secret; loại Agent hiện thêm dòng chọn track.
Xung đột: backend nhận language là chuỗi tự do còn chủ sản phẩm chốt bốn ngôn ngữ (giả định TypeScript, Python, Go, C#).
