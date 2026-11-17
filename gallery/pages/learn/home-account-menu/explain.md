---
title: Menu tài khoản (avatar)
route: /
area: learn
---

Route: `/` (mở menu avatar trên thanh trên). Ảnh chụp với học viên đã Premium nên dòng gói đọc "Gói của bạn"; học viên chưa Premium thấy "Nâng cấp Premium" ở cùng vị trí. Khung chung xem `learn/home/explain.md`. Menu là lớp nổi nên là chỗ duy nhất có bóng và góc bo lớn; nền trắng, nằm đè lên trang.

## Hàng danh tính

Vì sao: đầu menu cho biết đang đăng nhập là ai (email) và gói hiện tại (dòng 12 mờ "Premium" / "Chưa có Premium"). Là một hàng không dẫn đi đâu. Ghi chú lỗi ảnh: ở 390 email dài bị bẻ giữa chữ ("gallery-" / "theme@example.test") và menu che dòng phụ của dải tiêu đề.
Luật: `surface-layering`, `type-scale-14-12.md`; plan in the avatar menu, no sidebar footer (owner 2026-11-10).
Grammar: `DropdownMenu` entries, `DropdownMenuItem` {label, description} (`branch/DropdownMenu/index.d.ts`); code `fe/apps/app/src/components/blocks/AppHeader/component.tsx` (`accountItemsOf`).

## Lệnh gói

Vì sao: hành động đầu tiên sau danh tính. Chưa Premium: "Nâng cấp Premium"; đã Premium: "Gói của bạn" (như ảnh); cả hai là liên kết thật tới trang Premium, chữ foreground thường, không accent.
Luật: `surface-layering` (liên kết điều hướng không ↗), `theme-and-type` (liên kết phụ là plain, không accent).
Grammar: `DropdownMenuItem` {label, href}.

## Hồ sơ và Đăng xuất

Vì sao: trang cá nhân rồi lệnh đăng xuất (tone danger, chữ đỏ). Khách chưa đăng nhập chỉ có "Đăng nhập" mở hộp thoại tại chỗ.
Luật: `signed-out-header-avatar-modal.md`, `theme-and-type` (lỗi và nguy hiểm dùng `--danger`).
Grammar: `DropdownMenuItem` {href, tone="danger"}, `AvatarButton` (trigger).

## Nhãn nhóm "Tài khoản"

Vì sao: `DropdownMenuSection` của Grammar luôn vẽ tiêu đề nhóm (12 mờ); nhãn "Tài khoản" đặt tên cho nhóm gồm hàng danh tính, lệnh gói, hồ sơ cho trình đọc màn hình. Giữ hay bỏ là quyết định của chủ sản phẩm.
Luật: `surface-layering` (nhãn nhóm 12, weight 500, mờ).
Grammar: `DropdownMenuSection` {label}.

## Phản biện

Vì sao: tự phản biện của lần chụp này; liệt kê điều còn sai trên màn hình, không sửa trong lần chụp (chủ duyệt rồi mới sửa).
Luật: `surface-layering`, `theme-and-type`.
Grammar: không phải vùng của màn hình; không có thành phần.

- 1440, 1920, 390, vị trí menu: lớp nổi dính ngay dưới avatar, mép trên khoảng y=60 chạm vạch kẻ dưới thanh trên và che nút "Xem hướng dẫn" (chỉ còn thấy chữ "n" lọt ra ở 1440 và 1920) cùng dòng phụ của dải tiêu đề ở 390; không có khoảng thở giữa trigger và menu.
- 1440, 1920, 390, bóng và góc bo: góc bo rất lớn (khoảng 20px) và bóng mềm lan rộng, lớn hơn mọi chỗ khác; đúng luật "lớp nổi mới có bóng" nhưng góc bo không cùng họ với nút và ô.
- 390, hàng email: bị bẻ giữa chữ ("gallery-" / "theme@example.test"), xuống hai dòng và làm hàng cao hơn các hàng khác.
- 1440, 1920, 390, "Đăng xuất": đỏ cam sáng khác hẳn màu danger của các chỗ khác (chữ đỏ đậm), trên nền trắng tương phản thấp; menu không có đường kẻ ngăn lệnh nguy hiểm khỏi "Hồ sơ".
- 1440, 1920, 390, các hàng menu: "Gói của bạn", "Hồ sơ" không có hover hay icon, không đường kẻ giữa nhóm; nhãn "Tài khoản" và dòng "Premium" cỡ 12 xám nhạt, tương phản thấp.
- 1440, 1920, 390, nền trang phía sau không bị làm tối hay mờ, nên menu và nội dung (chữ "Chuỗi ngày..." bị cắt dở ở 1440) chồng lên nhau, đọc lẫn.
- Các lỗi của khung phía sau (nút chính tím nhạt, cột phụ, nút tròn tô xám) giữ như `learn/home`.
