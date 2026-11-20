# Đăng ký  (gallery: auth/sign-up, route /sign-in)
Mục tiêu: tạo tài khoản bằng email và mật khẩu.
Thao tác: POST /auth/signup (email, mật khẩu, ngôn ngữ), API gửi email có liên kết xác nhận và luôn trả thành công. cần API: không có.
Trạng thái: các màn đã vẽ: auth/sign-up; auth/sign-up-validation-error (1440 và 390).
Grammar: Form, Input, Checkbox, Button.
Hành động chính: "Đăng ký".
Việc đổi: mật khẩu 8 đến 72 ký tự; không còn mã 6 số, không còn báo email đã đăng ký.
