---
title: Hồ sơ của bạn
route: /profile
area: profile
---

Route: `/profile` (ảnh chụp: học viên đã có hai dòng CV Đã xác minh, một máy nối, gói miễn phí). Mã: `fe/apps/app/src/components/blocks/ProfileHub/`. Trang sửa: `profile/edit`. Trạng thái khác: `profile/new` (học viên mới), `profile/partial` (một vùng lỗi), `profile/loading`.

## Mục tiêu

Vì sao: thấy mình hiện ra thế nào với người khác, đổi ảnh và tên, lấy liên kết CV; từ đây vào Kinh nghiệm và Tiến độ (không có mục riêng ở thanh bên). Nút chính "Sửa hồ sơ" (với học viên mới là "Thêm ảnh và tên"). Dòng dưới tiêu đề: Học viên · gói · số mục đã xác minh trên ngưỡng giới thiệu việc làm.
Grammar: `Page chrome="panes"`, `PaneGrid`.

## Danh tính và liên kết CV

Vì sao: ảnh, tên, email và lộ trình mục tiêu. Liên kết CV tổng hợp (`myCvLink`) là hộp có Sao chép và công tắc "Cho người khác xem CV bằng liên kết này" (`setCvVisibility`); chưa có dòng đã xác minh thì chỉ nói khi nào liên kết xuất hiện.
Grammar: `Avatar`, `CopyField`, `Switch`.

## CV đã xác minh và tài khoản

Vì sao: mỗi dòng là một mục Đã xác minh với người ký, ngày, bằng chứng, mã `/verify/…`, nút Sao chép và công tắc công khai riêng. Rỗng thì có chỉ dẫn và nút. Tài khoản gồm máy đã nối và gói, mỗi hàng một liên kết.
Grammar: `Section kind="list"` + `ListRow` (`badges`, `action`, `control`), `EmptyNotice`.

## Cột phải

Vì sao: tiến độ nhanh với "Xem tiến độ" và tóm tắt Kinh nghiệm với "Mở Kinh nghiệm"; ở 390 nằm cuối trang.
Grammar: `Pane area="aside"`, `Section kind="list" layout="keyValue"`.

## Sửa hồ sơ

Vì sao: trang con "Hồ sơ / Sửa". Ảnh gửi thẳng tới kho đối tượng và tự lưu; tên chờ "Lưu thay đổi" (Hủy trung tính); đang tải ảnh thì nút Lưu tắt; xóa ảnh hỏi xác nhận. Lưu xong quay về Hồ sơ với dòng "Đã cập nhật hồ sơ".
Grammar: `FileButton`, `Input`, `AlertDialog`, `Alert`.
