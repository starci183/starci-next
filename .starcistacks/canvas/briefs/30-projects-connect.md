# Kết nối repo  (gallery: projects/connect, route /projects/[projectId]/connect)
Mục tiêu: nối dự án với repo GitHub và cài CI gửi bằng chứng có chữ ký.
Thao tác: projectRepository; setProjectRepository (chủ/tên hoặc địa chỉ github.com); rotateProjectCiSecret; webhook POST /webhooks/project-ci nhận header x-starci-project, x-starci-timestamp, x-starci-signature, x-starci-oidc. cần API: projectRepository trả trạng thái run đầu tiên và mẫu workflow chính thức.
Dữ liệu: số liệu minh họa (tên, số tiền, ngày dd/mm/yyyy) nằm trong các khung của pages/30-projects-connect.html; trường thật theo các thao tác ở trên.
Trạng thái: các màn đã vẽ: projects/connect (Kết nối repo; 1440 và 390); projects/connect-repo-invalid (Kết nối repo, repo sai dạng; chỉ 390); projects/connect-first-run-received (Kết nối repo, sau khi đã nhận run đầu tiên; chỉ 390); projects/connect-confirm-regenerate-secret (Kết nối repo, hỏi trước khi tạo lại secret; chỉ 390); projects/connect-change-repo-with-runs (Kết nối repo, đổi repo đã có run; chỉ 390). Trạng thái của bảng PROJECT-GALLERY-6 không vẽ: empty, loading, error, no-match, detail, first-visit, editing (trang không chạm tới, hoặc chưa được vẽ khi duyệt; thêm khi code nếu trang thật sự chạm tới).
Quyền: học viên đã đăng nhập; không có phân quyền riêng ngoài cổng Premium của khu vực (concepts/premium.md).
Grammar: PageHeader, Stepper orientation="vertical" có state, Field, Input, CopyField, MarkdownArticle (khối workflow), Button, Badge, AlertDialog. cần Grammar: không có.
Hành động chính: "Lưu repo"; khi run đầu tiên đã được GitHub xác nhận thì thành "Về dự án".
Lọc: không có.
Việc đổi: gom việc cài CI vào một trang theo thứ tự; OIDC là bằng chứng chính, secret chỉ ký kết quả.
Xung đột: đổi repo làm quên repositoryId GitHub đã thấy, nên phải cảnh báo.
