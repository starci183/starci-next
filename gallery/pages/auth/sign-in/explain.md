---
title: Đăng nhập
route: /sign-in
area: auth
reviewed: 2026-11-17
---

Route: `/sign-in`. Màn đăng nhập không dùng khung chung: thanh bên và thanh trên ẩn ở đây, trang tự vẽ thương hiệu ở giữa. Trang trắng, thẻ đăng nhập chỉ có viền 1px, không bóng. Ở 1440 và 1920 thẻ rộng cố định giữa trang, ở 390 thẻ chiếm gần hết bề ngang.

## Khung (không có thanh bên, thanh trên)

Vì sao: người chưa đăng nhập chưa có điều hướng nào để dùng, nên `AppHeader` và `AppSidebar` trả về rỗng trên `/sign-in`. Chỉ còn nút tròn đổi ngôn ngữ ở góc phải trên nền trắng, không có chrome nào khác.
Luật: `theme-and-type` (trang trắng, không bóng), `locale-switch-round-dropdown.md`, `signed-out-header-avatar-modal.md` (ở trang khác, "Đăng nhập" là hộp thoại).
Grammar: `WorkspaceShell` (khung chung `frame/WorkspaceShell/index.d.ts`); code `fe/apps/app/src/components/blocks/AppSidebar/index.tsx`, `AppHeader/index.tsx`.

## Thương hiệu giữa trang

Vì sao: logo và tên "StarCi Next" đậm đặt cạnh nhau, căn giữa phía trên thẻ, không mũi tên ↗.
Luật: `theme-and-type`, `verify-against-visualize.md`.
Grammar: `IdentityLockup` (`composite/IdentityLockup`); code `fe/apps/app/src/components/blocks/AuthPanel`.

## Thẻ đăng nhập (form)

Vì sao: thẻ đăng nhập là một vật thật (khung đăng nhập), nên là một trong số ít chỗ còn thẻ: viền 1px, nền trắng, không bóng. Trong thẻ: tiêu đề "Đăng nhập" và dòng phụ muted, hai nút mạng xã hội viền (trung tính, dạng viên thuốc), vạch "hoặc", ô email hoặc tên đăng nhập và ô mật khẩu (trắng, viền 1px, có "Hiện mật khẩu"), liên kết "Quên mật khẩu?" và MỘT nút chính "Đăng nhập", cuối thẻ "Chưa có tài khoản? Đăng ký". "Quên mật khẩu?" và "Đăng ký" là `TextAction` màu foreground, nên màu accent trên màn chỉ còn nút chính. Ghi chú lỗi ảnh: nút chính vẽ nền tím nhạt với chữ đen, nhạt hơn một nút chính đặc.
Luật: `surface-layering` (thẻ chỉ cho vật thật, một nút chính), `theme-and-type` (ô trắng viền 1px, accent chỉ là tín hiệu), `red-budget-links-foreground` (owner 2026-11-10).
Grammar: `SurfaceCard measure="formCompact"`, `Heading`, `Button intent="neutral"` (nút mạng xã hội) và `Button intent="commit"`, `TextField`, `TextAction` (`fe/apps/app/src/components/blocks/AuthPanel/component.tsx`).
