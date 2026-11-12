---
title: Menu tài khoản (avatar)
route: /
area: learn
---

Route: `/` (mở menu avatar trên thanh trên, 1440). Ảnh chụp bằng Playwright với học viên đã Premium nên dòng gói đọc "Gói của bạn"; học viên chưa Premium thấy "Nâng cấp Premium" ở cùng vị trí. Khung chung xem `learn/home/explain.md`.

## Hàng danh tính

Vì sao: đầu menu cho biết đang đăng nhập là ai (email) và gói hiện tại (dòng 12 mờ "Premium" / "Chưa có Premium"), thay cho chân gói đã bỏ khỏi sidebar. Là một hàng không dẫn đi đâu.
Luật: nav parity with NIVO console; plan in the lockup line and the avatar menu, no sidebar footer (owner 2026-11-10, 'B đi'); `type-scale-14-12.md`.
Grammar: `DropdownMenu` entries, `DropdownMenuItem` {label, description} (`node_modules/@starci/grammar/dist/core/branch/DropdownMenu/index.d.ts`); code `fe/apps/app/src/components/blocks/AppHeader/component.tsx` (`accountItemsOf`).

## Lệnh gói

Vì sao: hành động đầu tiên sau danh tính. Chưa Premium: "Nâng cấp Premium"; đã Premium: "Gói của bạn"; cả hai là liên kết thật tới trang Premium. Thay cho liên kết "Xem Premium ↗" ở chân sidebar.
Luật: nav parity with NIVO console; plan in the lockup line and the avatar menu, no sidebar footer (owner 2026-11-10, 'B đi'); nhãn mục là động từ/danh từ, không ↗ ở điều hướng.
Grammar: `DropdownMenuItem` {label, href}.

## Hồ sơ và Đăng xuất

Vì sao: như menu tài khoản của NIVO: trang cá nhân rồi lệnh đăng xuất (tone danger, chữ đỏ). Khách chưa đăng nhập vẫn chỉ có "Đăng nhập" mở hộp thoại tại chỗ.
Luật: `signed-out-header-avatar-modal.md`; nav parity with NIVO console.
Grammar: `DropdownMenuItem` {href, tone="danger"}, `AvatarButton` (trigger); phản chiếu `D:/starci-lanes/nivo-auth-ux/fe/apps/web/src/components/blocks/ConsoleHeader/component.tsx`.

## Nhãn nhóm "Tài khoản"

Vì sao: `DropdownMenuSection` của Grammar luôn vẽ tiêu đề nhóm, và nhãn "Tài khoản" đặt tên cho nhóm gồm hàng danh tính, lệnh gói, hồ sơ cho trình đọc màn hình; menu tài khoản của NIVO không dùng nhãn này, nên giữ hay bỏ là quyết định riêng của chủ sản phẩm.
Luật: nav parity with NIVO console.
Grammar: `DropdownMenuSection` {label}.
