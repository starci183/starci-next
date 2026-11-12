---
title: Đăng ký
route: /sign-in
area: auth
---

Route: `/sign-in` (chế độ Đăng ký, bấm "Đăng ký"). Màn đăng ký không dùng khung chung: thanh bên và thanh trên ẩn ở đây, trang tự vẽ thương hiệu ở giữa. Vòng "N" là lớp phủ Next dev.

## Khung (không có thanh bên, thanh trên)

Vì sao: người chưa đăng nhập chưa có điều hướng nào để dùng, nên khối chung `AppHeader` và `AppSidebar` trả về rỗng trên `/sign-in`. Chỉ còn nút tròn đổi ngôn ngữ ở góc phải. Giếng nền `--background`, thẻ đăng nhập trắng nổi.
Luật: `pink-page-surface-rule.md`, `locale-switch-round-dropdown.md`, `signed-out-header-avatar-modal.md` (ở trang khác, "Đăng nhập" là hộp thoại).
Grammar: `WorkspaceShell` (khung chung `frame/WorkspaceShell/index.d.ts`); code `fe/apps/app/src/components/blocks/AppSidebar/index.tsx`, `AppHeader/index.tsx`.

## Thương hiệu giữa trang

Vì sao: logo là liên kết về trang chủ, tên "StarCi Next" đậm bên cạnh, không mũi tên ↗.
Luật: `verify-against-visualize.md`.
Grammar: `Link media` (`leaf/Link/index.d.ts`) + `Text isStrong`; code `fe/packages/starci-next-ui/src/composites/BrandLockup`.

## Thẻ đăng ký (form)

Vì sao: do lane auth (thân trang) chịu trách nhiệm; không thuộc khung. CHƯA RÕ về phần thân: chưa được lane khung kiểm.
Luật: `table-heroui-native-section-head.md` (một nội dung một thẻ).
Grammar: xem lane auth.
