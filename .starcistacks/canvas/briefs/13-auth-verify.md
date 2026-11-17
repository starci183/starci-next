# Mã xác nhận  (gallery: auth/verify, route /verify/[code])
Mục tiêu: xác nhận email bằng mã 6 số sau Đăng nhập, Đăng ký hoặc Quên mật khẩu.
Thao tác: REST sign-in/verify, sign-up/verify, password-reset/verify, challenge/resend; mã sống 10 phút (challengeTtlSeconds 600); email hiện dạng che n***@vidu.vn. cần API: không có.
Dữ liệu: số liệu minh họa (tên, số tiền, ngày dd/mm/yyyy) nằm trong các khung của pages/13-auth-verify.html; trường thật theo các thao tác ở trên.
Trạng thái: các màn đã vẽ: auth/verify (Mã xác nhận; 1440 và 390); auth/verify-code-filled (Mã xác nhận, đã nhập đủ 6 số; chỉ 390); auth/verify-wrong-code (Mã xác nhận, sai; chỉ 390); auth/verify-expired (Mã xác nhận, hết hạn; chỉ 390); auth/verify-resent (Mã xác nhận, vừa gửi lại; chỉ 390). Trạng thái của bảng PROJECT-GALLERY-6 không vẽ: empty, loading, error, no-match, detail, first-visit, editing (trang không chạm tới, hoặc chưa được vẽ khi duyệt; thêm khi code nếu trang thật sự chạm tới).
Quyền: học viên đã đăng nhập; không có phân quyền riêng ngoài cổng Premium của khu vực (concepts/premium.md).
Grammar: EntryFrame, OtpInput, Button, Alert, Link. cần Grammar: không có.
Hành động chính: "Xác nhận", xám kèm lý do tới khi đủ 6 số; hết hạn thì thành "Gửi mã mới".
Lọc: không có.
Việc đổi: màn riêng có id riêng (auth/verify) để đối chiếu; sai mã thì sáu ô viền đỏ và một dòng lỗi.
Xung đột: không.
