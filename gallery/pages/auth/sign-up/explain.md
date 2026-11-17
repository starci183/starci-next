---
title: Đăng ký
route: /sign-in
area: auth
---

Route: `/sign-in` (chế độ Đăng ký, bấm "Đăng ký"). Cùng khung với `auth/sign-in`: không thanh bên, không thanh trên; trang trắng, thẻ chỉ có viền 1px.

## Khung (không có thanh bên, thanh trên)

Vì sao: người chưa đăng nhập chưa có điều hướng nào, nên `AppHeader` và `AppSidebar` trả về rỗng; chỉ còn nút tròn đổi ngôn ngữ ở góc phải trên nền trắng.
Luật: `theme-and-type`, `locale-switch-round-dropdown.md`, `signed-out-header-avatar-modal.md`.
Grammar: `WorkspaceShell` (`frame/WorkspaceShell/index.d.ts`); code `fe/apps/app/src/components/blocks/AppSidebar/index.tsx`, `AppHeader/index.tsx`.

## Thương hiệu giữa trang

Vì sao: logo và tên "StarCi Next" đậm, căn giữa phía trên thẻ, như `auth/sign-in`.
Luật: `theme-and-type`, `verify-against-visualize.md`.
Grammar: `IdentityLockup` (`composite/IdentityLockup`); code `fe/apps/app/src/components/blocks/AuthPanel`.

## Thẻ đăng ký (form)

Vì sao: thẻ đăng ký là khung đăng nhập nên vẫn là thẻ (viền 1px, không bóng). Trong thẻ: tiêu đề "Tạo tài khoản", hai nút mạng xã hội viền, vạch "hoặc", ô email, ô mật khẩu kèm dòng gợi ý "Từ 6 đến 256 ký tự", ô nhập lại mật khẩu, hộp kiểm đồng ý điều khoản và MỘT nút chính "Đăng ký". Nút chính ở trạng thái tắt (nhạt) cho tới khi tích đồng ý, đúng với ảnh. Hộp kiểm chưa tích là ô vuông viền; khi tích mới dùng màu accent. Cuối thẻ "Đã có tài khoản? Đăng nhập". Ghi chú lỗi ảnh: dòng điều khoản ở 1440 và 1920 xuống dòng và để lại chữ "tư" mồ côi; ở 390 hộp kiểm nằm lệch xuống so với dòng đầu của nhãn.
Luật: `surface-layering` (thẻ chỉ cho vật thật, một nút chính), `theme-and-type` (ô trắng viền 1px, accent chỉ cho điều khiển đã chọn và nút chính).
Grammar: `SurfaceCard measure="formCompact"`, `TextField`, `Checkbox`, `Button intent="commit" isDisabled`, `TextAction` (`fe/apps/app/src/components/blocks/AuthPanel/component.tsx`).

## Phản biện

Vì sao: tự phản biện của lần chụp này; liệt kê điều còn sai trên màn hình, không sửa trong lần chụp (chủ duyệt rồi mới sửa).
Luật: `surface-layering`, `theme-and-type`.
Grammar: không phải vùng của màn hình; không có thành phần.

- 1440, 1920, 390, nút "Đăng ký" đang tắt: nền tím rất nhạt với chữ xám, gần như không đọc được (tương phản thấp); trạng thái tắt trông như một ô tô màu mờ.
- 1440, 1920: dòng điều khoản xuống dòng và để chữ "tư" mồ côi ở dòng hai; ở 390 dòng không còn mồ côi nhưng nhãn vẫn đậm và dài.
- 1440, 1920, 390, hộp kiểm đồng ý: nhãn đậm ngang nhãn ô nhập, "Điều khoản sử dụng" và "Chính sách quyền riêng tư" không có dấu hiệu là liên kết (không gạch chân, không màu); hộp kiểm dính sát nút chính bên dưới (khoảng 12px) trong khi các ô khác cách nhau rộng hơn.
- 1440, 1920, 390, dòng gợi ý "Từ 6 đến 256 ký tự": nhỏ hơn 12px và xám nhạt, tương phản thấp.
- 1440, 1920, 390, thẻ: bo góc khoảng 24px lớn hơn nút và ô nhập; tiêu đề "Tạo tài khoản" cỡ khoảng 24px, vượt 18/600.
- 1440, 1920, 390, logo trên ô vuông xám nhạt và nút ngôn ngữ tròn tô xám: nền tô thay vì viền 1px; nút ngôn ngữ trôi riêng ở góc phải.
- 1440, 1920, 390, placeholder, "Hiện mật khẩu" xám nhạt cỡ 12, tương phản thấp; "Đăng nhập" ở cuối thẻ không gạch chân, như một nhãn đậm.
