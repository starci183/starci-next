# Đã gửi email và xác nhận email  (gallery: auth/sent, route /sign-in; auth/confirm, route /sign-in/confirm)
Mục tiêu: báo người học mở email, rồi xác nhận email bằng liên kết.
Thao tác: POST /auth/resend (gửi lại), POST /auth/confirm (token trong liên kết /auth/confirm?token=, chuyển tới /sign-in/confirm). cần API: không có.
Trạng thái: các màn đã vẽ: auth/sent; auth/sent-resent; auth/sent-not-confirmed; auth/confirm; auth/confirm-expired (1440 và 390).
Grammar: SurfaceCard, Heading, Text, Button, TextAction, Alert, Spinner.
Hành động chính: "Gửi lại email"; "Đăng nhập" ở trang xác nhận.
Việc đổi: thay màn nhập mã 6 số; trang xác nhận mới.
