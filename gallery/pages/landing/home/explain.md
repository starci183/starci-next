---
title: Trang giới thiệu (landing)
route: /
area: landing
reviewed: 2026-11-17
---

Route: `/` của ứng dụng `landing` (cổng riêng, không phải ứng dụng học). Mã: `fe/apps/landing/src/app/[locale]/page.tsx`. Đây là trang khung của bộ dựng: chưa có thiết kế sản phẩm. Toàn trang trắng, các dải ngăn nhau bằng đường kẻ 1px.

## Dải thương hiệu "starci-next"

Vì sao: một dải trắng cao một hàng, đường kẻ dưới, chỉ có tên dự án bằng chữ thường ở góc trái; không logo, không điều hướng, không đổi ngôn ngữ. CHƯA RÕ: ứng dụng học dùng logo StarCi và thanh trên có đổi ngôn ngữ, sáng tối; landing dùng chữ thường trần "starci-next" nên chưa cùng thương hiệu.
Luật: `surface-layering` (chrome trắng, phẳng, chỉ đường kẻ).
Grammar: `TopBar` chưa dùng; dải là khung dựng sẵn của bộ dựng (`fe/apps/landing/src/features`).

## Dải tiêu đề "Chào mừng đến với starci-next"

Vì sao: dải trắng phẳng, đường kẻ dưới, tiêu đề 18/600 sát trái: lời chào chung của khung. CHƯA RÕ: không nói StarCi Next là gì, cho ai, học gì; đây là chữ mặc định của bộ dựng chứ chưa phải lời giới thiệu sản phẩm.
Luật: `page-header-left-sublabel-xs.md`, `type-scale-14-12.md`.
Grammar: `Page header={{ title }}` (`frame/Page/index.d.ts`).

## Đoạn mô tả và nút "Mở ứng dụng"

Vì sao: một dòng muted "Mọi thứ bạn cần đều ở trong ứng dụng." và MỘT nút chính "Mở ứng dụng" (viên thuốc, màu accent tím) dẫn sang ứng dụng học, cùng họ màu với ứng dụng học. Ghi chú lỗi ảnh: khối thân thụt vào so với dải tiêu đề (chữ bắt đầu ở x=112 ở 1440 và x=352 ở 1920, trong khi tiêu đề ở x=32); ở 390 thì thẳng lề. Nút chính vẽ nền tím nhạt với chữ đen.
Luật: `surface-layering` (một nút chính), `theme-and-type` (accent là tín hiệu của nút chính).
Grammar: `Button intent="commit" href` (`leaf/Button`).
