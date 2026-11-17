# Đăng ký  (gallery: auth/sign-up, route /sign-in)
Mục tiêu: tạo tài khoản miễn phí và nói ngay được dùng gì.
Thao tác: REST sign-up (tên hiển thị 3–100 ký tự, email, mật khẩu 6–256 ký tự) rồi sign-up/verify với mã email; nút xã hội dùng social/start và social/exchange. cần API: provider google (như Đăng nhập).
Dữ liệu: số liệu minh họa (tên, số tiền, ngày dd/mm/yyyy) nằm trong các khung của pages/12-auth-sign-up.html; trường thật theo các thao tác ở trên.
Trạng thái: các màn đã vẽ: auth/sign-up (Đăng ký; 1440 và 390); auth/sign-up-validation-error (Đăng ký, có lỗi; chỉ 390). Trạng thái của bảng PROJECT-GALLERY-6 không vẽ: empty, loading, no-match, detail, first-visit, editing (trang không chạm tới, hoặc chưa được vẽ khi duyệt; thêm khi code nếu trang thật sự chạm tới).
Quyền: tạo tài khoản miễn phí và nói ngay được dùng gì.
Grammar: EntryFrame, Form, Field, Input, Button, Alert, Link. cần Grammar: không có.
Hành động chính: "Tạo tài khoản".
Lọc: không có.
Việc đổi: câu phụ nói rõ phần miễn phí: Harness, Luyện code, Ôn tập và phần 1 của mỗi bài Essentials.
Xung đột: như Đăng nhập: Google chưa có ở backend.
