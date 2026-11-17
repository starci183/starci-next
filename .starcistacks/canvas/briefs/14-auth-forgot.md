# Quên mật khẩu  (gallery: auth/forgot, route /sign-in/forgot)
Mục tiêu: đặt lại mật khẩu bằng mã gửi qua email.
Thao tác: REST password-reset (email) rồi password-reset/verify (mã 6 số + mật khẩu mới), challenge/resend. cần API: không có.
Dữ liệu: số liệu minh họa (tên, số tiền, ngày dd/mm/yyyy) nằm trong các khung của pages/14-auth-forgot.html; trường thật theo các thao tác ở trên.
Trạng thái: các màn đã vẽ: auth/forgot (Quên mật khẩu, nhập email; 1440 và 390); auth/forgot-new-password (Quên mật khẩu, nhập mã và mật khẩu mới; chỉ 390); auth/forgot-sign-in-after-reset (Quên mật khẩu, đăng nhập sau khi đặt lại; chỉ 390). Trạng thái của bảng PROJECT-GALLERY-6 không vẽ: empty, loading, error, no-match, detail, first-visit, editing (trang không chạm tới, hoặc chưa được vẽ khi duyệt; thêm khi code nếu trang thật sự chạm tới).
Quyền: học viên đã đăng nhập; không có phân quyền riêng ngoài cổng Premium của khu vực (concepts/premium.md).
Grammar: EntryFrame, Form, Field, Input, OtpInput, Button, Alert. cần Grammar: không có.
Hành động chính: "Gửi mã", rồi "Đặt mật khẩu".
Lọc: không có.
Việc đổi: trang mới, chưa có trong gallery.
Xung đột: không.
