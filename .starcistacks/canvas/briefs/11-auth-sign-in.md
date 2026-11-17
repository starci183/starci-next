# Đăng nhập  (gallery: auth/sign-in, route /sign-in)
Mục tiêu: vào lại để học tiếp bằng GitHub, Google hoặc email và mật khẩu.
Thao tác: REST /api/identity: social/start rồi social/exchange (nút xã hội), sign-in (email + mật khẩu, server gửi mã 6 số) rồi sign-in/verify ở màn mã; GET session để biết đã đăng nhập chưa; sign-out ở menu avatar. cần API: thêm provider google cho social/start và social/exchange (Keycloak IdP google).
Dữ liệu: số liệu minh họa (tên, số tiền, ngày dd/mm/yyyy) nằm trong các khung của pages/11-auth-sign-in.html; trường thật theo các thao tác ở trên.
Trạng thái: các màn đã vẽ: auth/sign-in (Đăng nhập; 1440 và 390); auth/sign-in-wrong-password (Đăng nhập, sai mật khẩu; chỉ 390); auth/sign-in-sending-code (Đăng nhập, đang gửi mã; chỉ 390); auth/sign-in-github-confirming (Đăng nhập GitHub, đang xác nhận; chỉ 390); auth/sign-in-error (Đăng nhập GitHub, lỗi; chỉ 390). Trạng thái của bảng PROJECT-GALLERY-6 không vẽ: empty, loading, no-match, detail, first-visit, editing (trang không chạm tới, hoặc chưa được vẽ khi duyệt; thêm khi code nếu trang thật sự chạm tới).
Quyền: học viên đã đăng nhập; không có phân quyền riêng ngoài cổng Premium của khu vực (concepts/premium.md).
Grammar: EntryFrame, Form, Field, Input, Button, Alert, Divider, Link. cần Grammar: nút đăng nhập xã hội có logo nhà cung cấp (bản vẽ dùng ô chữ GH, G).
Hành động chính: "Đăng nhập"; lúc đang gửi nút xám kèm lý do.
Lọc: không có.
Việc đổi: GitHub đứng đầu vì người học là dev; lỗi sai email hoặc mật khẩu là một Alert đỏ nhạt, không nói ô nào sai.
Xung đột: backend chỉ có provider facebook và github; bản vẽ dùng GitHub và Google, bỏ Facebook (chờ chủ sản phẩm chốt).
