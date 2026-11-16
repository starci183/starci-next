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
