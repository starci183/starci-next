# Đăng nhập  (gallery: auth/sign-in, route /sign-in)
Mục tiêu: vào lại để học tiếp bằng email và mật khẩu.
Thao tác: cổng đăng nhập của API: POST /auth/login (email, mật khẩu), POST /auth/logout ở menu avatar; GraphQL viewerRoles sau khi có phiên. cần API: không có.
Dữ liệu: số liệu minh họa nằm trong các khung của pages/11-auth-sign-in.html.
Trạng thái: các màn đã vẽ: auth/sign-in; auth/sign-in-wrong-password (1440 và 390).
Quyền: người học; không có phân quyền riêng.
Grammar: EntryFrame, Form, Field, Input, Button, Alert, Link. Nút Google chỉ hiện khi đã cấu hình Google; chưa cấu hình thì không có nút xã hội.
Hành động chính: "Đăng nhập".
Việc đổi: bỏ mã 6 số sau mật khẩu (phiên mở ngay, modal giữ nguyên chỗ đứng); bỏ Facebook và GitHub; tài khoản cũ dùng Quên mật khẩu một lần.
