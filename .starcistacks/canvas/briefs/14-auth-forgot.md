# Quên mật khẩu và đặt mật khẩu mới  (gallery: auth/forgot, route /sign-in; auth/reset, route /sign-in/reset)
Mục tiêu: lấy lại quyền vào tài khoản; đường duy nhất cho tài khoản chuyển từ hệ thống trước.
Thao tác: POST /auth/forgot (email, ngôn ngữ), POST /auth/reset (token trong liên kết /auth/reset?token=, mật khẩu mới). cần API: không có.
Trạng thái: các màn đã vẽ: auth/forgot; auth/forgot-sent; auth/reset; auth/reset-error; auth/reset-expired; auth/forgot-sign-in-after-reset (1440 và 390).
Grammar: Form, Input, Button, Alert, SurfaceCard.
Hành động chính: "Gửi liên kết"; "Đặt mật khẩu".
Việc đổi: liên kết trong email thay mã 6 số; đặt mật khẩu mới ở trang riêng.
